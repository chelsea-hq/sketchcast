import Image from "next/image";
import Link from "next/link";

import Counters from "@/components/landing/Counters";
import PinnedTriplet from "@/components/landing/PinnedTriplet";
import Pricing from "@/components/landing/Pricing";
import ScrollHero from "@/components/landing/ScrollHero";
import shotEditor from "@/public/shots/studio-editor.png";
import shotHero from "@/public/shots/studio-hero.png";
import shotTray from "@/public/shots/studio-tray.png";

const FEATURES = [
  {
    title: "Concept in, diagram out",
    body: "Type the idea you're teaching and AI sketches the whiteboard: boxes, arrows, and a talk track. Every piece stays draggable.",
  },
  {
    title: "A teleprompter only you see",
    body: "Your script scrolls over the board while you record. It is never captured in the export.",
  },
  {
    title: "Stage it, then drag it on",
    body: "Prep diagrams in the tray before you hit record, then drag them onto the board as you talk.",
  },
  {
    title: "Edit by clicking words",
    body: "Load the transcript, click the first and last word of a flub, cut. Remove every “um” in one click.",
  },
  {
    title: "Action slides",
    body: "Drop whiteboard-style title cards between takes without opening a video editor.",
  },
  {
    title: "Hooks + captions included",
    body: "AI writes your hooks, titles, and platform descriptions the moment the take is done.",
  },
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

const FAQ = [
  {
    q: "Do my videos get uploaded anywhere?",
    a: "No. Recording, editing, and export all happen in your browser. A take only leaves your machine when you download it and post it yourself. Audio is sent to Deepgram only if you click “Load transcript,” and only that audio.",
  },
  {
    q: "Do I need my own API keys?",
    a: "During the free beta, yes: paste an Anthropic key (diagrams, hooks, captions) and optionally a Deepgram key (transcripts) under ⚙ Keys. They stay in your browser. The planned Creator tier includes AI without any keys.",
  },
  {
    q: "Which browsers work best?",
    a: "Chrome and Edge on desktop give the best recording quality (mp4 where supported). Safari support for in-browser recording is limited. Mobile works for browsing and drafting; record on a desktop.",
  },
  {
    q: "Will viewers see my teleprompter or the tray?",
    a: "Never. Only the whiteboard and your webcam bubble are composited into the export. The prompter and the tray are interface, visible only to you.",
  },
  {
    q: "Can I edit out mistakes?",
    a: "Yes. Open any take in the editor: mark cuts manually, or load the transcript and cut by clicking words. One click removes filler words. You can also insert whiteboard-style title slides.",
  },
];

export default function Home() {
  return (
    <div className="bg-zinc-950 text-zinc-100">
      <nav className="absolute inset-x-0 top-0 z-40 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-sm font-bold tracking-tight text-white">
          Sketchcast <span className="font-normal text-zinc-500">Studio</span>
        </span>
        <Link
          href="/studio"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Start free
        </Link>
      </nav>

      {/* Cinematic scroll-scrub hero: the studio assembles from particles */}
      <ScrollHero />

      {/* Pinned triple reveal */}
      <PinnedTriplet />

      {/* Dark fades to white */}
      <div className="h-40 bg-gradient-to-b from-zinc-950 to-white" aria-hidden />

      <main className="bg-white text-zinc-900">
        <div className="mx-auto max-w-6xl px-6">
          <Counters />

          <p className="pb-14 text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">
            Made for · YouTube · TikTok · Reels · Shorts · LinkedIn
          </p>

          {/* Product shot in a browser frame */}
          <section className="pb-16">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-100 px-4 py-2.5">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="h-3 w-3 rounded-full bg-zinc-300" />
                  <span className="h-3 w-3 rounded-full bg-zinc-300" />
                  <span className="h-3 w-3 rounded-full bg-zinc-300" />
                </span>
                <span className="mx-auto rounded-md bg-white px-8 py-1 text-xs text-zinc-400">
                  sketchcast.app/studio
                </span>
              </div>
              <Image
                src={shotHero}
                alt="The Sketchcast studio mid-recording: teleprompter over the board, AI diagram, webcam bubble"
                placeholder="blur"
                className="w-full"
              />
            </div>
            <p className="mt-3 text-center text-sm text-zinc-500">
              Mid-recording: the prompter carries you, the diagram tells the
              story, and only the board and your camera make the final cut.
            </p>
          </section>

          <section className="grid gap-6 pb-16 md:grid-cols-2">
            <figure>
              <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-lg">
                <Image
                  src={shotTray}
                  alt="Diagram staged in the tray, ready to drag onto the whiteboard"
                  placeholder="blur"
                  className="w-full"
                />
              </div>
              <figcaption className="mt-2 text-sm text-zinc-500">
                Stage diagrams in the tray, then drag them on while you record.
              </figcaption>
            </figure>
            <figure>
              <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-lg">
                <Image
                  src={shotEditor}
                  alt="The take editor with a cut and an action slide queued"
                  placeholder="blur"
                  className="w-full"
                />
              </div>
              <figcaption className="mt-2 text-sm text-zinc-500">
                Cut flubs by the word and drop in action slides, right in the browser.
              </figcaption>
            </figure>
          </section>

          <section className="grid gap-4 border-t border-zinc-200 py-16 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-sm font-semibold text-zinc-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.body}</p>
              </div>
            ))}
          </section>

          <section className="border-t border-zinc-200 py-16">
            <h2 className="text-center text-3xl font-bold text-zinc-900">
              Made for the way creators actually work
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <blockquote
                  key={t.name}
                  className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-sm leading-relaxed text-zinc-700">“{t.quote}”</p>
                  <footer className="mt-4 text-xs text-zinc-500">
                    <span className="font-semibold text-zinc-800">{t.name}</span> · {t.role}
                  </footer>
                </blockquote>
              ))}
            </div>
          </section>

          <div className="border-t border-zinc-200">
            <Pricing />
          </div>

          <section className="border-t border-zinc-200 py-16">
            <h2 className="text-center text-3xl font-bold text-zinc-900">Questions</h2>
            <div className="mx-auto mt-8 max-w-2xl space-y-2">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-zinc-200 bg-white px-5 py-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-zinc-900 [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="ml-4 text-indigo-600 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Final CTA back in the dark */}
      <section className="bg-gradient-to-b from-white to-zinc-950 pt-40" aria-hidden />
      <section className="bg-zinc-950 pb-20 text-center">
        <h2 className="text-3xl font-bold text-white md:text-4xl">
          Your next explainer is 25 minutes away.
        </h2>
        <Link
          href="/studio"
          className="mt-7 inline-block rounded-xl bg-indigo-600 px-9 py-3.5 text-base font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Start free
        </Link>
        <p className="mt-4 text-xs text-zinc-500">
          Free during beta · bring your own AI keys · nothing to install
        </p>
      </section>

      <footer className="border-t border-zinc-800 bg-zinc-950 py-8 text-center text-xs text-zinc-600">
        Runs in your browser. Your videos never leave your machine until you post them.
      </footer>
    </div>
  );
}
