import Image from "next/image";
import Link from "next/link";

import Pricing from "@/components/landing/Pricing";
import Reveal from "@/components/landing/Reveal";
import shotEditor from "@/public/shots/studio-editor.png";
import shotHero from "@/public/shots/studio-hero.png";
import shotTray from "@/public/shots/studio-tray.png";

const WORKFLOW = [
  {
    number: "01",
    title: "Sketch the idea",
    body: "Start with a blank board or turn one sentence into an editable diagram and talk track.",
  },
  {
    number: "02",
    title: "Record the lesson",
    body: "Keep your webcam, whiteboard, and private teleprompter in one focused recording space.",
  },
  {
    number: "03",
    title: "Refine the take",
    body: "Cut a flub by selecting words, remove filler, and add action slides without a second editor.",
  },
  {
    number: "04",
    title: "Publish everywhere",
    body: "Reframe for landscape, vertical, or square and leave with hooks and post copy ready.",
  },
];

const FAQ = [
  {
    q: "Do my videos get uploaded anywhere?",
    a: "No. Recording, editing, and export happen in your browser, and video takes stay in your local Recovery Vault. Optional encrypted sync never includes video.",
  },
  {
    q: "Do I need my own API keys?",
    a: "No key is required for the core studio. Offline diagrams and copy still work. If you want provider-powered AI, bring a separate spend-capped key; it stays in session storage by default and is never persisted by our server.",
  },
  {
    q: "Can I work from my phone?",
    a: "Yes for reviewing projects, drafting scripts, generating diagrams, and preparing layouts. Desktop Chrome or Edge remains the recommended recording environment.",
  },
  {
    q: "Will viewers see the teleprompter or tool panels?",
    a: "Never. Only the recorded whiteboard area and your webcam bubble are composited into the export. Everything else is backstage.",
  },
  {
    q: "What happens if I refresh or close the tab?",
    a: "Your active board, script, layouts, and takes autosave to the local Recovery Vault on your device. You can also opt into encrypted project sync when it is available on your plan.",
  },
];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#7657ff] shadow-[0_0_30px_rgba(118,87,255,0.35)]">
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16.5 9 7l4 7 2.5-4L20 17" />
          <path d="M4 20h16" />
        </svg>
      </span>
      <span className="text-sm font-semibold tracking-[-0.02em] text-white">
        Sketchcast{!compact && <span className="font-normal text-white/45"> Studio</span>}
      </span>
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 10 4 4 8-9" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="landing-shell min-h-screen overflow-hidden bg-[#08090c] text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-[#08090c]/80 backdrop-blur-xl">
        <nav aria-label="Primary" className="mx-auto flex h-[68px] max-w-[1360px] items-center px-5 sm:px-8">
          <Link href="/" aria-label="Sketchcast home">
            <BrandMark />
          </Link>
          <div className="ml-12 hidden items-center gap-7 text-sm text-white/55 lg:flex">
            <a href="#workflow" className="transition hover:text-white">Workflow</a>
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#privacy-first" className="transition hover:text-white">Privacy</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link href="/account" className="hidden min-h-11 items-center rounded-full px-4 text-sm font-medium text-white/65 transition hover:bg-white/[0.06] hover:text-white sm:inline-flex">
              Account
            </Link>
            <Link href="/studio" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#0a0a0d] transition hover:bg-[#dfff7a] sm:px-5">
              Open studio <ArrowIcon />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative isolate px-5 pb-20 pt-32 sm:px-8 sm:pt-40 lg:pb-28 lg:pt-44">
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
            <div className="absolute left-1/2 top-[-28rem] h-[52rem] w-[52rem] -translate-x-1/2 rounded-full bg-[#7657ff]/20 blur-[140px]" />
            <div className="absolute right-[-12rem] top-[14rem] h-[30rem] w-[30rem] rounded-full bg-[#cbff67]/[0.07] blur-[110px]" />
            <div className="landing-grid absolute inset-0 opacity-35" />
          </div>

          <div className="mx-auto grid max-w-[1360px] items-center gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12 xl:gap-20">
            <div className="relative z-10 max-w-2xl">
              <p className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#9b86ff]/25 bg-[#7657ff]/10 px-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[#b8aaff]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#cbff67] shadow-[0_0_12px_#cbff67]" />
                Local-first creator studio
              </p>
              <h1 className="mt-7 max-w-[760px] text-balance text-[clamp(3.25rem,8vw,7.15rem)] font-semibold leading-[0.92] tracking-[-0.07em] text-white lg:text-[clamp(4.7rem,6vw,7.15rem)]">
                Make ideas
                <span className="block text-white/38">click on video.</span>
              </h1>
              <p className="mt-7 max-w-xl text-pretty text-base leading-7 text-white/58 sm:text-lg sm:leading-8">
                Sketch the lesson, prompt yourself, record the take, and reshape it for every feed—without handing over your footage or your keys.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/studio" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#7657ff] px-6 text-sm font-semibold text-white shadow-[0_16px_50px_rgba(118,87,255,0.28)] transition hover:-translate-y-0.5 hover:bg-[#8468ff]">
                  Start creating free <ArrowIcon />
                </Link>
                <a href="#workflow" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] px-6 text-sm font-medium text-white/72 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white">
                  See how it works
                </a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/42">
                {[
                  "No account required",
                  "Videos stay local",
                  "MIT open source",
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <span className="text-[#cbff67]"><CheckIcon /></span>{item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[820px] lg:mx-0">
              <div className="absolute -inset-5 -z-10 rounded-[36px] bg-gradient-to-br from-[#7657ff]/22 via-transparent to-[#cbff67]/10 blur-2xl" aria-hidden />
              <div className="overflow-hidden rounded-[22px] border border-white/12 bg-[#12131a] shadow-[0_45px_120px_rgba(0,0,0,0.48)] sm:rounded-[30px]">
                <div className="flex h-11 items-center border-b border-white/[0.07] px-4 sm:h-12 sm:px-5">
                  <span className="flex gap-1.5" aria-hidden>
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  </span>
                  <span className="mx-auto rounded-full bg-white/[0.055] px-4 py-1 font-mono text-[9px] text-white/32 sm:text-[10px]">sketchcast.app/studio</span>
                </div>
                <Image src={shotHero} alt="Sketchcast Studio showing a whiteboard diagram, private teleprompter, and webcam recording bubble" priority placeholder="blur" className="h-auto w-full" sizes="(max-width: 1024px) 100vw, 58vw" />
              </div>
              <div className="absolute -left-3 top-[22%] hidden items-center gap-2 rounded-2xl border border-white/10 bg-[#171821]/90 px-3.5 py-3 text-xs font-medium text-white shadow-2xl backdrop-blur-xl sm:flex lg:-left-8">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">◆</span>
                Recovery Vault on
              </div>
              <div className="absolute -bottom-5 right-3 hidden rounded-2xl border border-white/10 bg-[#171821]/90 p-3.5 shadow-2xl backdrop-blur-xl sm:block lg:-right-7">
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/35">One take, every feed</p>
                <div className="mt-2 flex gap-1.5 text-[10px] font-semibold text-white/80">
                  <span className="rounded-md bg-white/[0.07] px-2 py-1">16:9</span>
                  <span className="rounded-md bg-[#7657ff] px-2 py-1 text-white">9:16</span>
                  <span className="rounded-md bg-white/[0.07] px-2 py-1">1:1</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-16 flex max-w-[1360px] flex-col gap-4 border-t border-white/[0.07] pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between lg:mt-24">
            <span className="font-mono uppercase tracking-[0.16em]">Built for people who teach</span>
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-medium text-white/52">
              <span>YouTube</span><span>TikTok</span><span>Reels</span><span>Shorts</span><span>LinkedIn</span>
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-[#f3f3ed] px-5 py-24 text-[#111116] sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1280px]">
            <Reveal>
              <div className="grid gap-8 border-b border-black/10 pb-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f52ee]">The Sketchcast workflow</p>
                <h2 className="max-w-4xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                  From a thought in your head to a lesson in their feed.
                </h2>
              </div>
            </Reveal>

            <div className="grid divide-y divide-black/10 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
              {WORKFLOW.map((step, index) => (
                <Reveal key={step.number} delay={index * 80} className="h-full">
                  <article className="group h-full py-8 lg:px-7 lg:py-10 first:lg:pl-0 last:lg:pr-0">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-[#6f52ee]">{step.number}</span>
                      <span className="h-2 w-2 rounded-full bg-black/10 transition group-hover:bg-[#6f52ee]" />
                    </div>
                    <h3 className="mt-10 text-xl font-semibold tracking-[-0.03em]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-black/55">{step.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="bg-[#f3f3ed] px-5 pb-24 text-[#111116] sm:px-8 sm:pb-32">
          <div className="mx-auto grid max-w-[1280px] gap-5 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <article className="h-full overflow-hidden rounded-[28px] bg-[#111116] p-5 text-white sm:p-8">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#b4a3ff]">Prepare without presenting</p>
                    <h3 className="mt-3 max-w-lg text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Stage the story before you hit record.</h3>
                  </div>
                  <span className="hidden rounded-full border border-white/10 px-3 py-1 text-[10px] text-white/40 sm:block">Backstage tray</span>
                </div>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/52">Build diagrams, scripts, and reusable layouts offstage. Drag them onto the board only when the moment is right.</p>
                <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-black">
                  <Image src={shotTray} alt="Sketchcast backstage tray with a diagram ready to drag onto the whiteboard" placeholder="blur" className="w-full" sizes="(max-width: 1024px) 100vw, 58vw" />
                </div>
              </article>
            </Reveal>

            <Reveal delay={100} className="lg:col-span-5">
              <article className="flex h-full flex-col overflow-hidden rounded-[28px] bg-[#d8ff6f] p-5 sm:p-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/50">Edit by meaning</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Cut the stumble. Keep the thought.</h3>
                <p className="mt-4 text-sm leading-6 text-black/58">Select words to remove a flub, clear filler, and add a crisp title card—without learning a timeline.</p>
                <div className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-black shadow-[0_24px_70px_rgba(29,33,16,0.24)] lg:mt-auto">
                  <Image src={shotEditor} alt="Sketchcast take editor with a transcript cut and action slide" placeholder="blur" className="w-full" sizes="(max-width: 1024px) 100vw, 42vw" />
                </div>
              </article>
            </Reveal>

            <Reveal className="lg:col-span-5">
              <article className="h-full rounded-[28px] border border-black/10 bg-white p-6 sm:p-8">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#7657ff]/10 text-[#6f52ee]">
                  <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 5 6v5c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/></svg>
                </span>
                <h3 className="mt-7 text-3xl font-semibold tracking-[-0.04em]">Local by default. Recoverable by design.</h3>
                <p className="mt-4 text-sm leading-6 text-black/55">Your footage stays on your device. Boards, scripts, layouts, and takes recover locally after a refresh. Optional project sync is encrypted before upload.</p>
              </article>
            </Reveal>

            <Reveal delay={100} className="lg:col-span-7">
              <article className="grid h-full gap-8 rounded-[28px] bg-[#7657ff] p-6 text-white sm:p-8 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">Bring your own intelligence</p>
                  <h3 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Use the AI you trust—or use none at all.</h3>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">Offline fallbacks keep the studio useful. Optional provider keys stay in session storage by default and can be revoked on your terms.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[10px] text-white/68">
                  {['Anthropic','OpenAI','Gemini','OpenRouter'].map((provider) => <span key={provider} className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-2 text-center">{provider}</span>)}
                </div>
              </article>
            </Reveal>
          </div>
        </section>

        <section id="privacy-first" className="relative overflow-hidden border-y border-white/[0.07] bg-[#0d0e13] px-5 py-24 sm:px-8 sm:py-32">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(118,87,255,0.18),transparent_66%)]" aria-hidden />
          <div className="relative mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a995ff]">Open source where it matters</p>
              <h2 className="mt-5 max-w-2xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl">A creator tool that doesn’t need custody of your work.</h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/52">Sketchcast Community is MIT licensed, useful without an account, and safe to self-host. Hosted convenience stays optional—not a lock-in strategy.</p>
              <a href="https://github.com/chelsea-hq/sketchcast" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                View the public repo <ArrowIcon />
              </a>
            </Reveal>
            <Reveal delay={120}>
              <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-3 sm:p-5">
                {[
                  ["Recording", "Never leaves your browser until you export"],
                  ["Recovery Vault", "Autosaves projects and takes on this device"],
                  ["Provider keys", "Session-only by default; never persisted server-side"],
                  ["Cloud sync", "Encrypted in your browser before upload"],
                ].map(([label, detail], index) => (
                  <div key={label} className={`grid gap-2 px-3 py-5 sm:grid-cols-[150px_1fr] sm:px-5 ${index ? 'border-t border-white/[0.07]' : ''}`}>
                    <span className="text-sm font-semibold text-white">{label}</span>
                    <span className="text-sm leading-6 text-white/45">{detail}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="bg-[#f3f3ed] px-5 text-[#111116] sm:px-8">
          <div className="mx-auto max-w-[1280px]">
            <Pricing />
          </div>
        </section>

        <section className="bg-[#f3f3ed] px-5 pb-24 text-[#111116] sm:px-8 sm:pb-32">
          <div className="mx-auto max-w-[900px] border-t border-black/10 pt-20">
            <div className="grid gap-8 md:grid-cols-[0.65fr_1.35fr]">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f52ee]">FAQ</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">The honest answers.</h2>
              </div>
              <div className="divide-y divide-black/10 border-y border-black/10">
                {FAQ.map((item) => (
                  <details key={item.q} className="group py-5">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-6 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-black/10 text-lg font-normal transition group-open:rotate-45 group-open:bg-[#7657ff] group-open:text-white">+</span>
                    </summary>
                    <p className="max-w-2xl pb-2 pr-10 text-sm leading-6 text-black/55">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#7657ff] px-5 py-24 text-center sm:px-8 sm:py-28">
          <div className="pointer-events-none absolute inset-0 landing-grid opacity-20" aria-hidden />
          <div className="relative mx-auto max-w-4xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">Your knowledge deserves a clearer canvas</p>
            <h2 className="mt-5 text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-7xl">Open the studio. Make the idea visible.</h2>
            <Link href="/studio" className="mt-9 inline-flex min-h-13 items-center gap-2 rounded-full bg-[#d8ff6f] px-7 text-sm font-semibold text-[#111116] shadow-[0_20px_60px_rgba(24,18,56,0.25)] transition hover:-translate-y-0.5 hover:bg-white">
              Start creating free <ArrowIcon />
            </Link>
            <p className="mt-4 text-xs text-white/50">No account · no install · no upload</p>
          </div>
        </section>
      </main>

      <footer className="bg-[#08090c] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-8 border-t border-white/[0.07] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <BrandMark compact />
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/42">
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
            <a href="https://github.com/chelsea-hq/sketchcast" className="transition hover:text-white">GitHub</a>
          </div>
          <p className="text-xs text-white/28">Your videos stay yours.</p>
        </div>
      </footer>
    </div>
  );
}
