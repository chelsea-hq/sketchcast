import Link from "next/link";

import AccountDashboard from "@/components/AccountDashboard";

export default function AccountPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090c] px-5 py-6 text-white sm:px-8 sm:py-8">
      <div className="pointer-events-none absolute left-1/2 top-[-24rem] h-[48rem] w-[48rem] -translate-x-1/2 rounded-full bg-[#7657ff]/18 blur-[130px]" aria-hidden />
      <div className="relative mx-auto max-w-4xl">
        <nav aria-label="Account navigation" className="flex items-center justify-between border-b border-white/[0.07] pb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-[-0.02em] text-white">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#7657ff]">
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 16.5 9 7l4 7 2.5-4L20 17"/><path d="M4 20h16"/></svg>
            </span>
            Sketchcast <span className="font-normal text-white/35">Studio</span>
          </Link>
          <Link href="/studio" className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-white/65 transition hover:bg-white/[0.08] hover:text-white">Open studio</Link>
        </nav>
        <div className="py-12 sm:py-16"><AccountDashboard /></div>
      </div>
    </main>
  );
}
