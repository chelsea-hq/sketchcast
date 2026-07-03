import Link from "next/link";

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

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
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

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-16 text-center md:py-24">
          <p className="mb-4 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
            For creators who teach
          </p>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-white md:text-5xl">
            Explain it once. Post it everywhere.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
            The whiteboard recording studio for educational content. Type a
            concept, get a diagram, record with your webcam and a teleprompter,
            and walk away with platform-ready video plus the hooks and captions
            to post it.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/studio"
              className="rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Open the studio
            </Link>
            <p className="text-xs text-zinc-500">
              Free during beta · bring your own AI keys · runs entirely in your
              browser
            </p>
          </div>
          <div className="mt-10 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <span className="rounded-md bg-zinc-900 px-2.5 py-1.5">16:9 YouTube</span>
            <span className="rounded-md bg-zinc-900 px-2.5 py-1.5">9:16 Reels · TikTok · Shorts</span>
            <span className="rounded-md bg-zinc-900 px-2.5 py-1.5">1:1 Feed</span>
          </div>
        </section>

        <section className="grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <h3 className="text-sm font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.body}</p>
            </div>
          ))}
        </section>

        <section className="border-t border-zinc-800 py-16">
          <h2 className="text-center text-2xl font-bold text-white">
            Three steps to posted
          </h2>
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
      </main>

      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-600">
        Runs in your browser. Your videos never leave your machine until you
        post them.
      </footer>
    </div>
  );
}
