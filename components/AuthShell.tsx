import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthShell({ mode, children }: { mode: "sign in" | "sign up"; children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090c] px-5 py-6 text-white sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute left-[-12rem] top-[-14rem] h-[42rem] w-[42rem] rounded-full bg-[#7657ff]/22 blur-[130px]" aria-hidden />
      <div className="relative mx-auto max-w-6xl">
        <nav className="flex items-center justify-between border-b border-white/[0.07] pb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-[-0.02em] text-white">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#7657ff]">
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16.5 9 7l4 7 2.5-4L20 17"/><path d="M4 20h16"/></svg>
            </span>
            Sketchcast <span className="font-normal text-white/35">Studio</span>
          </Link>
          <Link href="/studio" className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-white/65 transition hover:bg-white/[0.08] hover:text-white">Use Community free</Link>
        </nav>
        <div className="grid min-h-[calc(100vh-7.5rem)] items-center gap-12 py-10 lg:grid-cols-[1fr_auto] lg:py-16">
          <div className="max-w-xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a995ff]">Creator Cloud · {mode}</p>
            <h1 className="mt-5 text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-7xl">Your studio stays local. Your progress can travel.</h1>
            <p className="mt-6 max-w-lg text-sm leading-6 text-white/48">Use an account only when you want hosted convenience. The Community studio, local Recovery Vault, and bring-your-own-key workflow remain available without signing in.</p>
            <div className="mt-8 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/38">
              <span className="rounded-full border border-white/[0.08] px-3 py-2">Encrypted sync</span>
              <span className="rounded-full border border-white/[0.08] px-3 py-2">Visible quotas</span>
              <span className="rounded-full border border-white/[0.08] px-3 py-2">Cancel anytime</span>
            </div>
          </div>
          <div className="flex min-w-0 justify-center lg:min-w-[430px]">{children}</div>
        </div>
      </div>
    </main>
  );
}
