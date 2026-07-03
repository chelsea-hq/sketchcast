"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

import Board from "./Board";
import RecordBar, { type RecState } from "./RecordBar";
import SidePanel from "./SidePanel";
import Teleprompter, { type PrompterSettings } from "./Teleprompter";
import WebcamBubble from "./WebcamBubble";
import type { Take } from "./panels/TakesPanel";
import {
  applyTemplateScene,
  captureTemplateScene,
  insertMermaidIntoScene,
} from "@/lib/board-actions";
import {
  FORMATS,
  defaultWebcamLayout,
  type FormatKey,
  type WebcamCorner,
  type WebcamLayout,
} from "@/lib/formats";
import { SessionRecorder } from "@/lib/recorder";
import {
  deleteTemplate,
  listTemplates,
  saveTemplate,
  type SketchTemplate,
} from "@/lib/templates";

const CORNER_ORDER: WebcamCorner[] = ["br", "bl", "tl", "tr"];

export default function Studio() {
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
  const [stage, setStage] = useState({ w: 960, h: 540 });
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

  // Keep a ref in sync so the recorder reads live webcam layout every frame
  useEffect(() => {
    webcamRef.current = webcamLive;
  });

  // Fit the stage to the available space while holding the export aspect ratio
  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el) return;
    const spec = FORMATS[format];
    const update = () => {
      const rect = el.getBoundingClientRect();
      const pad = 28;
      const scale = Math.min(
        (rect.width - pad) / spec.width,
        (rect.height - pad) / spec.height
      );
      setStage({
        w: Math.max(240, Math.floor(spec.width * scale)),
        h: Math.max(240, Math.floor(spec.height * scale)),
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [format]);

  useEffect(() => {
    if (recState !== "recording") return;
    const timer = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recState]);

  // Takes are in-memory blobs; warn before a reload/close throws them away
  useEffect(() => {
    if (takes.length === 0 && recState === "idle") return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [takes.length, recState]);

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
          setTakes((prev) => [
            {
              id: `take_${Date.now()}`,
              url,
              filename: `sketchcast-${result.format.replace(":", "x")}-${stamp}.${result.extension}`,
              sizeMB: result.blob.size / (1024 * 1024),
              seconds: result.durationMs / 1000,
              format: result.format,
            },
            ...prev,
          ]);
          setRecState("idle");
          toast.success("Take saved. Preview and download it in the Takes tab.");
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
        await insertMermaidIntoScene(api, mermaid);
        return true;
      } catch (error) {
        console.error(error);
        toast.error("That diagram didn't parse cleanly. Regenerate and try again.");
        return false;
      }
    },
    [api]
  );

  const handleSaveTemplate = (name: string) => {
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
    setTakes((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((t) => t.id !== id);
    });
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center gap-3 border-b border-zinc-800 px-4 py-2.5">
        <h1 className="text-sm font-bold tracking-tight text-white">
          Sketchcast <span className="font-normal text-zinc-500">Studio</span>
        </h1>
        <p className="hidden text-[11px] text-zinc-500 md:block">
          Whiteboard + webcam + teleprompter, recorded right in your browser.
          Paste or drag images straight onto the board.
        </p>
        <div className="ml-auto flex items-center gap-1.5 text-[11px]">
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
        <aside className="w-[340px] shrink-0 overflow-hidden border-r border-zinc-800 p-3">
          <SidePanel
            onInsert={insertMermaid}
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
            takes={takes}
            onDeleteTake={handleDeleteTake}
          />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div
            ref={boardWrapRef}
            className="relative flex min-h-0 flex-1 items-center justify-center bg-zinc-900"
          >
            <div
              ref={stageRef}
              className="relative overflow-hidden rounded-lg bg-white shadow-2xl"
              style={{ width: stage.w, height: stage.h }}
            >
              <Board onApiReady={setApi} />
              <WebcamBubble
                stream={stream}
                layout={webcamLive}
                stageW={stage.w}
                stageH={stage.h}
                videoRef={videoRef}
                onCycleCorner={cycleCorner}
              />
              <Teleprompter
                script={script}
                settings={prompter}
                onChange={(patch) => setPrompter((p) => ({ ...p, ...patch }))}
              />
              {recState !== "idle" && (
                <div className="absolute bottom-3 right-3 z-40 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">
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
    </div>
  );
}
