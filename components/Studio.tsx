"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import Board from "./Board";
import ProjectSwitcher from "./ProjectSwitcher";
import RecordBar, { type RecState } from "./RecordBar";
import SettingsModal from "./SettingsModal";
import SidePanel, { TAB_LABELS, ToolIcon, type Tab } from "./SidePanel";
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
  const router = useRouter();
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
          onClick: () => router.push("/#pricing"),
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
    <div className="studio-shell flex h-dvh flex-col overflow-hidden bg-[#090a0f] text-zinc-100">
      <header className="relative z-30 flex min-h-14 shrink-0 items-center gap-2 border-b border-white/[0.07] bg-[#0b0c11]/95 px-2.5 backdrop-blur-xl sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          aria-label="Open creator tools"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.045] text-white/70 transition hover:bg-white/[0.08] hover:text-white md:hidden"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round"><path d="M4 5h12M4 10h12M4 15h12" /></svg>
        </button>
        <h1 className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-[-0.02em] text-white">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#7657ff] shadow-[0_0_22px_rgba(118,87,255,0.28)]">
            <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16.5 9 7l4 7 2.5-4L20 17"/><path d="M4 20h16"/></svg>
          </span>
          <span className="hidden sm:inline">Sketchcast <span className="font-normal text-white/35">Studio</span></span>
        </h1>
        <span className="mx-1 hidden h-5 w-px bg-white/[0.08] sm:block" aria-hidden />
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
        <div className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px] sm:gap-2">
          <Link
            href="/account"
            className="hidden min-h-9 items-center rounded-full border border-white/[0.07] bg-white/[0.04] px-3 font-medium text-white/55 transition hover:bg-white/[0.08] hover:text-white lg:inline-flex"
          >
            {account.plan === "creator" ? "Creator account" : "Account"}
          </Link>
          <span
            className={`hidden min-h-9 items-center gap-1.5 rounded-full px-3 xl:flex ${
              recoveryReady
                ? "bg-emerald-400/[0.08] text-emerald-300"
                : "bg-white/[0.04] text-white/35"
            }`}
            title="Your active board, script, layout, and takes recover locally on this device"
          >
            <span className="text-[10px]">◆</span>
            {recoveryReady ? "Recovery Vault on" : "Opening vault…"}
          </span>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.045] px-2.5 text-xs font-medium text-white/65 transition hover:bg-white/[0.08] hover:text-white sm:h-9 sm:rounded-full sm:px-3"
            aria-label="Provider keys and settings"
          >
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="2.5"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4"/></svg>
            <span className="hidden sm:inline">Keys</span>
          </button>
          <span className="hidden min-h-9 items-center gap-2 rounded-full border border-white/[0.06] px-3 text-white/35 sm:flex">
            <span className={`h-2 w-2 rounded-full ${recState !== "idle" ? "animate-pulse bg-red-500" : stream ? "bg-emerald-400" : "bg-white/20"}`} />
            {recState !== "idle" ? "Recording" : stream ? "Live" : "Ready"}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {panelOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setPanelOpen(false)}
          />
        )}
        <aside
          className={`${
            panelOpen ? "translate-y-0" : "pointer-events-none translate-y-[120%]"
          } fixed inset-x-2 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex h-[min(70dvh,620px)] shrink-0 transform flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#111218] shadow-[0_30px_100px_rgba(0,0,0,0.65)] transition-transform duration-300 md:pointer-events-auto md:static md:z-auto md:h-auto md:w-[330px] md:translate-y-0 md:rounded-none md:border-y-0 md:border-l-0 md:border-r md:border-white/[0.07] md:bg-[#0d0e13] md:shadow-none md:transition-none xl:w-[350px]`}
        >
          <div className="flex min-h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-4 md:hidden">
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="text-[#9d88ff]"><ToolIcon tab={panelTab} /></span>
              {TAB_LABELS[panelTab]}
            </span>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label="Close creator tools"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-white/55 transition hover:bg-white/[0.1] hover:text-white"
            >
              <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round"><path d="m5 5 10 10M15 5 5 15"/></svg>
            </button>
          </div>
          <div className="min-h-0 flex-1 p-4 md:p-3">
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
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col pb-[calc(4.65rem+env(safe-area-inset-bottom))] md:pb-0">
          <div
            ref={boardWrapRef}
            className="relative min-h-0 flex-1 bg-[#090a0f] p-2 sm:p-3"
          >
            <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-black/10 bg-white/90 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-black/55 shadow-sm backdrop-blur md:hidden">
              Prep mode
            </div>
            <div
              ref={stageRef}
              className="relative h-full w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.32)]"
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

      <nav aria-label="Creator tools" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#0b0c11]/95 px-2 pt-1.5 pb-[calc(0.35rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setPanelTab(key);
                setPanelOpen(true);
              }}
              aria-label={`Open ${TAB_LABELS[key]} tools`}
              aria-current={panelOpen && panelTab === key ? "page" : undefined}
              className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition ${panelOpen && panelTab === key ? "bg-[#7657ff] text-white" : "text-white/42 hover:bg-white/[0.06] hover:text-white"}`}
            >
              <ToolIcon tab={key} />
              <span>{TAB_LABELS[key]}</span>
              {key === "takes" && takes.length > 0 && <span className="absolute right-2 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[8px] text-white">{takes.length}</span>}
            </button>
          ))}
        </div>
      </nav>

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
