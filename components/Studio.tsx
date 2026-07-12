"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import Board from "./Board";
import ProjectSwitcher from "./ProjectSwitcher";
import RecordBar, { type RecState } from "./RecordBar";
import SettingsModal from "./SettingsModal";
import SidePanel, { type Tab } from "./SidePanel";
import SyncModal from "./SyncModal";
import TakeEditor from "./TakeEditor";
import Teleprompter, { type PrompterSettings } from "./Teleprompter";
import WebcamBubble from "./WebcamBubble";
import type { Take } from "./panels/TakesPanel";
import {
  addMermaidToTray,
  applyTemplateScene,
  captureTemplateScene,
  insertMermaidIntoScene,
} from "@/lib/board-actions";
import type { EditedExport } from "@/lib/take-editor";
import {
  FORMATS,
  defaultWebcamLayout,
  type FormatKey,
  type WebcamCorner,
  type WebcamLayout,
} from "@/lib/formats";
import { SessionRecorder } from "@/lib/recorder";
import {
  createProject,
  deleteProject,
  initializeProjectVault,
  listStoredTakes,
  listProjects,
  removeStoredTake,
  renameProject,
  requestDurableBrowserStorage,
  setActiveProjectId,
  storeProject,
  storeProjectSnapshot,
  storeTake,
  type ProjectSnapshot,
  type SketchProject,
} from "@/lib/recovery-vault";
import {
  decryptProject,
  encryptProject,
  generateSyncCode,
  legacySyncIdFromCode,
  syncIdFromCode,
  syncWriteTokenFromCode,
  type SyncEnvelope,
} from "@/lib/project-sync";
import {
  deleteTemplate,
  listTemplates,
  saveTemplate,
  type SketchTemplate,
} from "@/lib/templates";
import { useCreatorCloud } from "@/components/useCreatorCloud";

const CORNER_ORDER: WebcamCorner[] = ["br", "bl", "tl", "tr"];

export default function Studio() {
  const { account } = useCreatorCloud();
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [format, setFormat] = useState<FormatKey>("16:9");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [webcam, setWebcam] = useState<WebcamLayout>(() => defaultWebcamLayout("16:9"));
  const [recState, setRecState] = useState<RecState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [takes, setTakes] = useState<Take[]>([]);
  const [script, setScript] = useState("");
  const [seedConcept, setSeedConcept] = useState("");
  const [templates, setTemplates] = useState<SketchTemplate[]>(() => listTemplates());
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 960, h: 540 });
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<Tab>("ai");
  const [editingTake, setEditingTake] = useState<Take | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [projects, setProjects] = useState<SketchProject[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState("");
  const [prompter, setPrompter] = useState<PrompterSettings>({
    visible: false,
    playing: false,
    speed: 55,
    fontSize: 24,
    opacity: 0.8,
    autoStart: true,
  });

  const boardWrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<SessionRecorder | null>(null);
  const webcamLive: WebcamLayout = { ...webcam, visible: webcam.visible && camOn };
  const webcamRef = useRef(webcamLive);
  const takesRef = useRef<Take[]>([]);
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const pendingProjectRef = useRef<SketchProject | null>(null);
  const activeProjectIdRef = useRef("");
  const recoveryReadyRef = useRef(false);
  const recoveryTimerRef = useRef<number | null>(null);
  const deletedTakeIdsRef = useRef(new Set<string>());
  const draftValuesRef = useRef({ format, script, webcam });
  const sceneRef = useRef<ProjectSnapshot["scene"] | null>(null);

  // Keep a ref in sync so the recorder reads live webcam layout every frame
  useEffect(() => {
    webcamRef.current = webcamLive;
  });

  useEffect(() => {
    takesRef.current = takes;
  }, [takes]);

  useEffect(() => {
    draftValuesRef.current = { format, script, webcam };
    if (!recoveryReadyRef.current || !sceneRef.current || !activeProjectIdRef.current) return;
    if (recoveryTimerRef.current) window.clearTimeout(recoveryTimerRef.current);
    recoveryTimerRef.current = window.setTimeout(() => {
      if (!sceneRef.current || !activeProjectIdRef.current) return;
      void storeProjectSnapshot(activeProjectIdRef.current, {
        ...draftValuesRef.current,
        scene: sceneRef.current,
      }).catch((error) => console.error("Recovery Vault autosave failed", error));
    }, 650);
  }, [format, script, webcam]);

  const restoreProject = useCallback(
    (nextApi: ExcalidrawImperativeAPI, project: SketchProject, announce = true) => {
      sceneRef.current = project.scene;
      applyTemplateScene(nextApi, project.scene);
      pendingProjectRef.current = null;
      recoveryReadyRef.current = true;
      setRecoveryReady(true);
      if (announce) toast.success(`Opened “${project.name}” from the Recovery Vault.`);
    },
    []
  );

  const handleApiReady = useCallback(
    (nextApi: ExcalidrawImperativeAPI) => {
      apiRef.current = nextApi;
      setApi(nextApi);
      if (pendingProjectRef.current) {
        restoreProject(nextApi, pendingProjectRef.current);
      }
    },
    [restoreProject]
  );

  useEffect(() => {
    let cancelled = false;
    void initializeProjectVault()
      .then((vault) => {
        if (cancelled) return;
        setProjects(vault.projects);
        setActiveProjectIdState(vault.activeProject.id);
        activeProjectIdRef.current = vault.activeProject.id;
        setTakes(
          vault.takes.map((take) => ({
            ...take,
            url: URL.createObjectURL(take.blob),
            persisted: true,
          }))
        );
        setFormat(vault.activeProject.format);
        setScript(vault.activeProject.script);
        setWebcam(vault.activeProject.webcam);
        pendingProjectRef.current = vault.activeProject;
        if (apiRef.current) restoreProject(apiRef.current, vault.activeProject);
        void requestDurableBrowserStorage();
      })
      .catch((error) => {
        console.error("Recovery Vault could not load", error);
        recoveryReadyRef.current = true;
        setRecoveryReady(true);
        toast.error("Local recovery is unavailable in this browser session.");
      });
    return () => {
      cancelled = true;
      if (recoveryTimerRef.current) window.clearTimeout(recoveryTimerRef.current);
      for (const take of takesRef.current) URL.revokeObjectURL(take.url);
    };
  }, [restoreProject]);

  const handleSceneChange = useCallback<NonNullable<React.ComponentProps<typeof Board>["onSceneChange"]>>(
    (elements, appState, files) => {
      sceneRef.current = {
        elements: elements.map((element) => ({ ...element })),
        files: files as unknown as Record<string, unknown>,
        viewBackgroundColor: appState.viewBackgroundColor,
      };
      if (!recoveryReadyRef.current || !activeProjectIdRef.current) return;
      if (recoveryTimerRef.current) window.clearTimeout(recoveryTimerRef.current);
      recoveryTimerRef.current = window.setTimeout(() => {
        if (!sceneRef.current || !activeProjectIdRef.current) return;
        void storeProjectSnapshot(activeProjectIdRef.current, {
          ...draftValuesRef.current,
          scene: sceneRef.current,
        }).catch((error) => console.error("Recovery Vault autosave failed", error));
      }, 650);
    },
    []
  );

  const persistTake = useCallback(async (take: Take, blob: Blob) => {
    try {
      await storeTake({
        id: take.id,
        projectId: activeProjectIdRef.current,
        blob,
        filename: take.filename,
        sizeMB: take.sizeMB,
        seconds: take.seconds,
        format: take.format,
        createdAt: new Date().toISOString(),
      });
      // A fast delete can race an IndexedDB write. Honor the user's delete
      // after the write finishes so the take cannot reappear on next launch.
      if (deletedTakeIdsRef.current.has(take.id)) {
        await removeStoredTake(take.id);
        deletedTakeIdsRef.current.delete(take.id);
        return false;
      }
      setTakes((current) =>
        current.map((item) => (item.id === take.id ? { ...item, persisted: true } : item))
      );
      return true;
    } catch (error) {
      console.error("Could not save take to Recovery Vault", error);
      if (deletedTakeIdsRef.current.delete(take.id)) return false;
      toast.error("This take is still open, but local recovery could not save it. Download it now.");
      return false;
    }
  }, []);

  // The workspace fills all available space; the recorded frame (crop) is a
  // centered region holding the export aspect ratio. Everything outside the
  // frame is backstage: visible to the creator, never recorded.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const spec = FORMATS[format];
    const update = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      // Keep the recorded frame clear of Excalidraw's floating UI: toolbar
      // band up top, zoom/undo island at the bottom
      const topUi = ch < 520 ? 56 : 84;
      const bottomUi = ch < 520 ? 44 : 56;
      const pad = 16;
      const scale = Math.min(
        (cw - pad * 2) / spec.width,
        (ch - topUi - bottomUi) / spec.height
      );
      const w = Math.max(180, Math.floor(spec.width * scale));
      const h = Math.max(180, Math.floor(spec.height * scale));
      setCrop({
        x: Math.floor((cw - w) / 2),
        y: Math.floor(topUi + (ch - topUi - bottomUi - h) / 2),
        w,
        h,
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [format]);

  const cropRef = useRef(crop);
  useEffect(() => {
    cropRef.current = crop;
  });

  useEffect(() => {
    if (recState !== "recording") return;
    const timer = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recState]);

  // Warn only while recording or while a take has not reached IndexedDB yet.
  useEffect(() => {
    if (takes.every((take) => take.persisted) && recState === "idle") return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [takes, recState]);

  const startSession = async () => {
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      setStream(media);
      setCamOn(true);
      setMicOn(true);
      toast.success("Camera and mic connected. You're live on the stage.");
    } catch (error) {
      console.error(error);
      toast.error(
        "Camera or mic was blocked. You can still record the board without them."
      );
    }
  };

  const endSession = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  const toggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    stream?.getVideoTracks().forEach((t) => (t.enabled = next));
  };

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    stream?.getAudioTracks().forEach((t) => (t.enabled = next));
  };

  const changeFormat = (next: FormatKey) => {
    setFormat(next);
    setWebcam((prev) => ({ ...prev, sizeFrac: defaultWebcamLayout(next).sizeFrac }));
  };

  const cycleCorner = () => {
    setWebcam((prev) => ({
      ...prev,
      corner:
        CORNER_ORDER[(CORNER_ORDER.indexOf(prev.corner) + 1) % CORNER_ORDER.length],
    }));
  };

  const startRecording = () => {
    const stageEl = stageRef.current;
    if (!stageEl) return;
    try {
      const recorder = new SessionRecorder({
        boardEl: stageEl,
        getCrop: () => cropRef.current,
        getVideo: () => videoRef.current,
        micStream: stream,
        format,
        getWebcam: () => webcamRef.current,
        onStop: (result) => {
          const url = URL.createObjectURL(result.blob);
          const stamp = new Date()
            .toISOString()
            .slice(0, 16)
            .replace(/[:T]/g, "-");
          const take: Take = {
            id: `take_${Date.now()}`,
            url,
            filename: `sketchcast-${result.format.replace(":", "x")}-${stamp}.${result.extension}`,
            sizeMB: result.blob.size / (1024 * 1024),
            seconds: result.durationMs / 1000,
            format: result.format,
            persisted: false,
          };
          setTakes((prev) => [take, ...prev]);
          void persistTake(take, result.blob);
          setRecState("idle");
          // Jump straight to the take so there's no hunting for it
          setPanelTab("takes");
          setPanelOpen(true);
          toast.success("Take captured. Recovery Vault is saving it locally.");
        },
      });
      recorderRef.current = recorder;
      recorder.start();
      setElapsed(0);
      setRecState("recording");
      if (prompter.autoStart && script.trim()) {
        setPrompter((p) => ({ ...p, visible: true, playing: true }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Recording isn't supported in this browser. Try Chrome or Edge.");
    }
  };

  const insertMermaid = useCallback(
    async (mermaid: string) => {
      if (!api) {
        toast.error("The whiteboard is still loading…");
        return false;
      }
      try {
        // Land the diagram inside the visible part of the recorded frame,
        // below the prompter when it's showing
        const c = cropRef.current;
        const topPad = prompter.visible ? c.h * 0.4 : c.h * 0.08;
        await insertMermaidIntoScene(api, mermaid, {
          x: c.x + c.w * 0.06,
          y: c.y + topPad,
          w: c.w * 0.88,
          h: Math.max(60, c.h - topPad - c.h * 0.08),
        });
        return true;
      } catch (error) {
        console.error(error);
        toast.error("That diagram didn't parse cleanly. Regenerate and try again.");
        return false;
      }
    },
    [api, prompter.visible]
  );

  const saveToTray = useCallback(
    async (mermaid: string, name: string) => {
      if (!api) {
        toast.error("The whiteboard is still loading…");
        return false;
      }
      try {
        await addMermaidToTray(api, mermaid, name);
        return true;
      } catch (error) {
        console.error(error);
        toast.error("Couldn't stage that diagram. Regenerate and try again.");
        return false;
      }
    },
    [api]
  );

  const handleEditedExport = (result: EditedExport) => {
    const url = URL.createObjectURL(result.blob);
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    const sourceFormat = editingTake?.format ?? format;
    const take: Take = {
      id: `take_${Date.now()}`,
      url,
      filename: `sketchcast-${sourceFormat.replace(":", "x")}-edited-${stamp}.${result.extension}`,
      sizeMB: result.blob.size / (1024 * 1024),
      seconds: result.durationMs / 1000,
      format: sourceFormat,
      persisted: false,
    };
    setTakes((prev) => [take, ...prev]);
    void persistTake(take, result.blob);
    setPanelTab("takes");
  };

  const handleSaveTemplate = (name: string) => {
    if (
      account.limits.templates !== null &&
      templates.length >= account.limits.templates
    ) {
      toast.error("The free plan includes 3 layouts.", {
        action: {
          label: "View Creator",
          onClick: () => { window.location.href = "/#pricing"; },
        },
      });
      return;
    }
    if (!api) {
      toast.error("The whiteboard is still loading…");
      return;
    }
    try {
      saveTemplate({ name, format, script, webcam, scene: captureTemplateScene(api) });
      setTemplates(listTemplates());
      toast.success(`Template "${name}" saved`);
    } catch (error) {
      console.error(error);
      toast.error(
        "Couldn't save: browser storage is full. Large pasted images are usually the culprit."
      );
    }
  };

  const handleLoadTemplate = (tpl: SketchTemplate) => {
    if (!api) return;
    applyTemplateScene(api, tpl.scene);
    setFormat(tpl.format);
    setScript(tpl.script);
    setWebcam(tpl.webcam);
    toast.success(`Loaded "${tpl.name}". Same setup, new topic.`);
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
    setTemplates(listTemplates());
  };

  const handleDeleteTake = (id: string) => {
    deletedTakeIdsRef.current.add(id);
    setTakes((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((t) => t.id !== id);
    });
    void removeStoredTake(id).catch((error) => {
      console.error("Could not delete take from Recovery Vault", error);
      toast.error("That take could not be removed from local recovery.");
    }).finally(() => {
      // Persisting takes clear their own marker after resolving the race.
      if (!takesRef.current.some((take) => take.id === id && !take.persisted)) {
        deletedTakeIdsRef.current.delete(id);
      }
    });
  };

  const currentSnapshot = useCallback((): ProjectSnapshot => ({
    ...draftValuesRef.current,
    scene: sceneRef.current ?? {
      elements: [],
      files: {},
      viewBackgroundColor: "#ffffff",
    },
  }), []);

  const saveActiveProject = useCallback(async () => {
    if (!activeProjectIdRef.current) throw new Error("No active project");
    if (recoveryTimerRef.current) {
      window.clearTimeout(recoveryTimerRef.current);
      recoveryTimerRef.current = null;
    }
    const saved = await storeProjectSnapshot(
      activeProjectIdRef.current,
      currentSnapshot()
    );
    setProjects(await listProjects());
    return saved;
  }, [currentSnapshot]);

  const openProject = useCallback(
    async (project: SketchProject, announce = true) => {
      recoveryReadyRef.current = false;
      setRecoveryReady(false);
      if (recoveryTimerRef.current) window.clearTimeout(recoveryTimerRef.current);
      for (const take of takesRef.current) URL.revokeObjectURL(take.url);

      activeProjectIdRef.current = project.id;
      setActiveProjectIdState(project.id);
      await setActiveProjectId(project.id);
      setFormat(project.format);
      setScript(project.script);
      setWebcam(project.webcam);
      draftValuesRef.current = {
        format: project.format,
        script: project.script,
        webcam: project.webcam,
      };
      sceneRef.current = project.scene;
      const storedTakes = await listStoredTakes(project.id);
      setTakes(
        storedTakes.map((take) => ({
          ...take,
          url: URL.createObjectURL(take.blob),
          persisted: true,
        }))
      );
      if (apiRef.current) restoreProject(apiRef.current, project, announce);
      else pendingProjectRef.current = project;
    },
    [restoreProject]
  );

  const handleSwitchProject = async (projectId: string) => {
    if (projectId === activeProjectIdRef.current || recState !== "idle") return;
    try {
      await saveActiveProject();
      const project = projects.find((item) => item.id === projectId);
      if (project) await openProject(project);
    } catch (error) {
      console.error("Could not switch projects", error);
      toast.error("That project could not be opened.");
      recoveryReadyRef.current = true;
      setRecoveryReady(true);
    }
  };

  const handleCreateProject = async (name: string) => {
    try {
      if (activeProjectIdRef.current) await saveActiveProject();
      const project = await createProject(name);
      setProjects(await listProjects());
      await openProject(project);
      toast.success(`Created “${project.name}”.`);
    } catch (error) {
      console.error("Could not create project", error);
      toast.error("That project could not be created.");
    }
  };

  const handleRenameProject = async (name: string) => {
    try {
      const renamed = await renameProject(activeProjectIdRef.current, name);
      setProjects(await listProjects());
      toast.success(`Renamed to “${renamed.name}”.`);
    } catch (error) {
      console.error("Could not rename project", error);
      toast.error("That project could not be renamed.");
    }
  };

  const handleDeleteProject = async () => {
    try {
      const currentId = activeProjectIdRef.current;
      const next = projects.find((project) => project.id !== currentId);
      if (!next) return;
      await deleteProject(currentId);
      const remaining = await listProjects();
      setProjects(remaining);
      await openProject(remaining.find((project) => project.id === next.id) ?? remaining[0]);
      toast.success("Project deleted from this device.");
    } catch (error) {
      console.error("Could not delete project", error);
      toast.error(error instanceof Error ? error.message : "That project could not be deleted.");
    }
  };

  const handlePushSync = async (): Promise<string> => {
    try {
      const saved = await saveActiveProject();
      const syncCode = saved.syncCode ?? generateSyncCode();
      const projectWithCode = { ...saved, syncCode };
      const { id, envelope } = await encryptProject(projectWithCode, syncCode);
      const writeToken = await syncWriteTokenFromCode(syncCode);
      const response = await fetch("/api/sync", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-sync-write-token": writeToken,
        },
        body: JSON.stringify({ id, envelope }),
      });
      const data = (await response.json()) as { error?: string; syncedAt?: string };
      if (!response.ok) throw new Error(data.error ?? "Cloud sync failed");
      await storeProject({
        ...projectWithCode,
        lastSyncedAt: data.syncedAt ?? new Date().toISOString(),
      });
      setProjects(await listProjects());
      toast.success("Encrypted project synced. Video takes stayed local.");
      return syncCode;
    } catch (error) {
      console.error("Cloud push failed", error);
      toast.error(error instanceof Error ? error.message : "Cloud sync failed.");
      throw error;
    }
  };

  const handlePullSync = async (syncCode: string) => {
    try {
      const id = await syncIdFromCode(syncCode);
      let response = await fetch(`/api/sync?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      // Compatibility for projects uploaded before write capabilities shipped.
      if (response.status === 404) {
        const legacyId = await legacySyncIdFromCode(syncCode);
        response = await fetch(`/api/sync?id=${encodeURIComponent(legacyId)}`, {
          cache: "no-store",
        });
      }
      const data = (await response.json()) as { error?: string; envelope?: SyncEnvelope };
      if (!response.ok || !data.envelope) {
        throw new Error(data.error ?? "Cloud project not found");
      }
      const cloud = await decryptProject(data.envelope, syncCode);
      await saveActiveProject();
      const latestProjects = await listProjects();
      const linked = latestProjects.find((project) => project.syncCode === syncCode);
      const imported = linked
        ? await storeProject({
            ...linked,
            ...cloud.snapshot,
            name: cloud.name,
            syncCode,
            lastSyncedAt: new Date().toISOString(),
          })
        : await storeProject({
            ...(await createProject(cloud.name, cloud.snapshot)),
            syncCode,
            lastSyncedAt: new Date().toISOString(),
          });
      setProjects(await listProjects());
      await openProject(imported);
      toast.success(`Unlocked “${imported.name}” from encrypted cloud sync.`);
    } catch (error) {
      console.error("Cloud pull failed", error);
      toast.error(error instanceof Error ? error.message : "Cloud project could not be opened.");
      throw error;
    }
  };

  const activeProject = projects.find((project) => project.id === activeProjectId);

  const handleOpenSync = () => {
    if (account.syncRequiresCreator && account.plan !== "creator") {
      toast.error(
        account.signedIn
          ? "Hosted encrypted sync is included with Creator Cloud."
          : "Sign in to a Creator Cloud account to use hosted sync.",
        {
          action: {
            label: account.signedIn ? "View plan" : "Sign in",
            onClick: () => {
              window.location.href = account.signedIn ? "/#pricing" : "/sign-in";
            },
          },
        }
      );
      return;
    }
    setSyncOpen(true);
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center gap-3 border-b border-zinc-800 px-4 py-2.5">
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 md:hidden"
        >
          ☰ Tools
        </button>
        <h1 className="text-sm font-bold tracking-tight text-white">
          Sketchcast <span className="font-normal text-zinc-500">Studio</span>
        </h1>
        <ProjectSwitcher
          projects={projects}
          activeProjectId={activeProjectId}
          disabled={!recoveryReady || recState !== "idle"}
          onSwitch={handleSwitchProject}
          onCreate={handleCreateProject}
          onRename={handleRenameProject}
          onDelete={handleDeleteProject}
          onOpenSync={handleOpenSync}
        />
        <div className="ml-auto flex items-center gap-3 text-[11px]">
          <Link
            href="/account"
            className="hidden rounded-md bg-zinc-800 px-2.5 py-1.5 font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white sm:block"
          >
            {account.plan === "creator" ? "Creator account" : "Account"}
          </Link>
          <span
            className={`hidden items-center gap-1.5 rounded-full px-2 py-1 sm:flex ${
              recoveryReady
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-zinc-800 text-zinc-500"
            }`}
            title="Your active board, script, layout, and takes recover locally on this device"
          >
            <span className="text-[10px]">◆</span>
            {recoveryReady ? "Recovery Vault on" : "Opening vault…"}
          </span>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
          >
            ⚙ Keys
          </button>
          <span
            className={`h-2 w-2 rounded-full ${
              recState !== "idle"
                ? "animate-pulse bg-red-500"
                : stream
                  ? "bg-emerald-500"
                  : "bg-zinc-700"
            }`}
          />
          <span className="text-zinc-500">
            {recState !== "idle" ? "Recording" : stream ? "Session live" : "No session"}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {panelOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setPanelOpen(false)}
          />
        )}
        <aside
          className={`${
            panelOpen ? "translate-x-0" : "-translate-x-full"
          } fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[340px] shrink-0 transform overflow-hidden border-r border-zinc-800 bg-zinc-950 p-3 transition-transform duration-200 md:static md:z-auto md:w-[340px] md:translate-x-0 md:transition-none`}
        >
          <div className="mb-2 flex justify-end md:hidden">
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300"
            >
              Close ✕
            </button>
          </div>
          <SidePanel
            tab={panelTab}
            onTabChange={setPanelTab}
            onInsert={insertMermaid}
            onSaveToTray={saveToTray}
            onUseScript={(s) => setScript(s)}
            onOpenKeys={() => setSettingsOpen(true)}
            seedConcept={seedConcept}
            onConceptUsed={setSeedConcept}
            script={script}
            onScriptChange={setScript}
            prompter={prompter}
            onPrompterChange={(patch) => setPrompter((p) => ({ ...p, ...patch }))}
            templates={templates}
            onSaveTemplate={handleSaveTemplate}
            onLoadTemplate={handleLoadTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            templateLimit={account.limits.templates}
            takes={takes}
            onDeleteTake={handleDeleteTake}
            onEditTake={(take) => {
              setEditingTake(take);
              setPanelOpen(false);
            }}
          />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div
            ref={boardWrapRef}
            className="relative min-h-0 flex-1 bg-zinc-900 p-2"
          >
            <div
              ref={stageRef}
              className="relative h-full w-full overflow-hidden rounded-lg bg-white"
            >
              <Board onApiReady={handleApiReady} onSceneChange={handleSceneChange} />
              {/* Recorded frame: only this region lands in the export.
                  The dimmed wings around it are backstage workspace. */}
              <div
                className="pointer-events-none absolute z-[3] rounded-sm border border-zinc-500/60"
                style={{
                  left: crop.x,
                  top: crop.y,
                  width: crop.w,
                  height: crop.h,
                  boxShadow: "0 0 0 9999px rgba(24, 24, 27, 0.6)",
                }}
              >
                {(crop.x > 90 || crop.y > 60) && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
                    Recorded area · the dim wings are your backstage
                  </span>
                )}
                <WebcamBubble
                  stream={stream}
                  layout={webcamLive}
                  stageW={crop.w}
                  stageH={crop.h}
                  videoRef={videoRef}
                  onCycleCorner={cycleCorner}
                />
                <Teleprompter
                  script={script}
                  settings={prompter}
                  onChange={(patch) => setPrompter((p) => ({ ...p, ...patch }))}
                />
                {recState !== "idle" && (
                  <div className="absolute bottom-3 left-3 z-40 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">
                    <span
                      className={`h-2 w-2 rounded-full bg-red-500 ${
                        recState === "recording" ? "animate-pulse" : ""
                      }`}
                    />
                    {recState === "paused" ? "PAUSED" : "REC"}
                  </div>
                )}
              </div>
            </div>
          </div>

          <RecordBar
            hasSession={!!stream}
            camOn={camOn}
            micOn={micOn}
            recState={recState}
            elapsed={elapsed}
            format={format}
            webcam={webcam}
            prompterVisible={prompter.visible}
            onStartSession={startSession}
            onEndSession={endSession}
            onToggleCam={toggleCam}
            onToggleMic={toggleMic}
            onFormatChange={changeFormat}
            onWebcamSize={(sizeFrac) => setWebcam((p) => ({ ...p, sizeFrac }))}
            onTogglePrompter={() =>
              setPrompter((p) => ({ ...p, visible: !p.visible }))
            }
            onRecord={startRecording}
            onPause={() => {
              recorderRef.current?.pause();
              setRecState("paused");
            }}
            onResume={() => {
              recorderRef.current?.resume();
              setRecState("recording");
            }}
            onStop={() => recorderRef.current?.stop()}
          />
        </main>
      </div>

      {editingTake && (
        <TakeEditor
          take={editingTake}
          onClose={() => setEditingTake(null)}
          onExported={handleEditedExport}
        />
      )}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {syncOpen && activeProject && (
        <SyncModal
          project={activeProject}
          onClose={() => setSyncOpen(false)}
          onPush={handlePushSync}
          onPull={handlePullSync}
        />
      )}
    </div>
  );
}
