import Image from "next/image";
import Link from "next/link";

import HeroMockup from "@/components/HeroMockup";
import shotEditor from "@/public/shots/studio-editor.png";
import shotHero from "@/public/shots/studio-hero.png";
import shotTray from "@/public/shots/studio-tray.png";

const FEATURES = [
  {
    title: "Concept in, diagram out",
    body: "Type the idea you're teaching and AI sketches the whiteboard for you: boxes, arrows, and a talk track. Every piece stays draggable.",
  },
  {
    title: "Record in your browser",
    body: "Whiteboard and webcam composited into one clean video. Nothing to install, nothing uploaded; your takes stay on your machine.",
  },
  {
    title: "A teleprompter only you see",
    body: "Your script scrolls over the board while you record. It is never captured in the export.",
  },
  {
    title: "Stage it, then drag it on",
    body: "Prep diagrams in the tray before you hit record, then drag them onto the board as you talk. Progressive reveal without editing.",
  },
  {
    title: "Edit by clicking words",
    body: "Load the transcript, click the first and last word of a flub, cut. Remove every “um” in one click. Insert whiteboard title slides between takes.",
  },
  {
    title: "Every format, packaged",
    body: "16:9, 9:16, and 1:1 exports plus AI hooks, titles, and platform captions ready to paste.",
  },
];

const STEPS = [
  { n: "1", title: "Type the concept", body: "Get a ready-made whiteboard layout and talk track in seconds." },
  { n: "2", title: "Record while you drag", body: "Talk to the camera, pull pieces from the tray, let the prompter carry you." },
  { n: "3", title: "Cut the flubs and post", body: "Transcript-click editing, action slides, and captions for every platform." },
];

// Placeholder quotes for layout only. Replace with real beta feedback
// before this page goes public.
const TESTIMONIALS = [
  {
    quote:
      "I scripted, recorded, and posted a whiteboard explainer in 25 minutes. That used to be an afternoon in a video editor.",
    name: "Maya R.",
    role: "Data science creator · beta",
  },
  {
    quote:
      "The teleprompter plus the tray changed how I record. I stopped memorizing and my takes got shorter and sharper.",
    name: "Devon K.",
    role: "Finance educator · beta",
  },
  {
    quote:
      "Remove filler words is worth the whole app. The 'ums' are gone and nobody can tell where they were.",
    name: "Priya S.",
    role: "Coding instructor · beta",
  },
];

const SHOTS = [
  {
    src: shotTray,
    alt: "Diagram staged in the tray, ready to drag onto the whiteboard",
    caption: "Stage diagrams in the tray, then drag them on while you record.",
  },
  {
    src: shotEditor,
    alt: "The take editor with a cut and an action slide queued",
    caption: "Cut flubs by the word and drop in action slides, right in the browser.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-sm font-bold tracking-tight text-white">
          Sketchcast <span className="font-normal text-zinc-500">Studio</span>
        </span>
        <Link
          href="/studio"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Open the studio
        </Link>
      </nav>

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="grid items-center gap-12 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-4 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
              For creators who teach
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Explain it once.
              <br />
              Post it everywhere.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-zinc-400">
              The whiteboard recording studio for educational content. Type a
              concept, get a diagram, record with your webcam and a
              teleprompter, and walk away with platform-ready video plus the
              hooks and captions to post it.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href="/studio"
                className="rounded-xl bg-indigo-600 px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Open the studio
              </Link>
              <p className="text-xs leading-snug text-zinc-500">
                Free during beta · bring your own AI keys
                <br />
                runs entirely in your browser
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="rounded-md bg-zinc-900 px-2.5 py-1.5">16:9 YouTube</span>
              <span className="rounded-md bg-zinc-900 px-2.5 py-1.5">9:16 Reels · TikTok · Shorts</span>
              <span className="rounded-md bg-zinc-900 px-2.5 py-1.5">1:1 Feed</span>
            </div>
          </div>
          <HeroMockup />
        </section>

        {/* Big product shot */}
        <section className="pb-16">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl">
            <Image
              src={shotHero}
              alt="The Sketchcast studio mid-recording: teleprompter over the board, AI diagram, webcam bubble"
              placeholder="blur"
              priority
              className="w-full"
            />
          </div>
          <p className="mt-3 text-center text-sm text-zinc-500">
            Mid-recording: the prompter carries you, the diagram tells the
            story, and only the board and your camera make the final cut.
          </p>
        </section>

        {/* Secondary shots */}
        <section className="grid gap-6 pb-16 md:grid-cols-2">
          {SHOTS.map((shot) => (
            <figure key={shot.caption}>
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <Image src={shot.src} alt={shot.alt} placeholder="blur" className="w-full" />
              </div>
              <figcaption className="mt-2 text-sm text-zinc-500">{shot.caption}</figcaption>
            </figure>
          ))}
        </section>

        {/* Features */}
        <section className="grid gap-4 border-t border-zinc-800 py-16 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="text-sm font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.body}</p>
            </div>
          ))}
        </section>

        {/* Steps */}
        <section className="border-t border-zinc-800 py-16">
          <h2 className="text-center text-2xl font-bold text-white">Three steps to posted</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Social proof */}
        <section className="border-t border-zinc-800 py-16">
          <h2 className="text-center text-2xl font-bold text-white">
            Made for the way creators actually work
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <blockquote key={t.name} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <p className="text-sm leading-relaxed text-zinc-300">“{t.quote}”</p>
                <footer className="mt-4 text-xs text-zinc-500">
                  <span className="font-semibold text-zinc-300">{t.name}</span> · {t.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-zinc-800 py-16 text-center">
          <h2 className="text-3xl font-bold text-white">Your next explainer is 25 minutes away.</h2>
          <Link
            href="/studio"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Open the studio
          </Link>
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-600">
        Runs in your browser. Your videos never leave your machine until you post them.
      </footer>
    </div>
  );
}
