/**
 * CSS-animated miniature of the studio for the landing hero. Pure CSS
 * keyframes (defined in globals.css), no client JS, loops forever.
 */
export default function HeroMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-8 rounded-[2.5rem] bg-indigo-600/20 blur-3xl" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          </span>
          <span className="text-[10px] font-medium text-zinc-500">
            Sketchcast Studio · 16:9
          </span>
          <span className="ml-auto flex items-center gap-1 text-[9px] font-bold text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            REC 00:37
          </span>
        </div>

        {/* Stage */}
        <div className="relative m-3 overflow-hidden rounded-lg bg-white" style={{ aspectRatio: "16 / 9" }}>
          {/* Teleprompter strip: creator-only */}
          <div className="absolute inset-x-0 top-0 z-10 h-[30%] overflow-hidden bg-zinc-950/75 px-4 pt-1.5 backdrop-blur-[2px]">
            <p className="text-[7px] font-bold tracking-wide text-emerald-400">
              PROMPTER · NOT RECORDED
            </p>
            <div className="sc-scroll mt-0.5 text-[10px] leading-4 text-white/90">
              <p>
                Here&rsquo;s why compound interest feels slow, and then suddenly
                isn&rsquo;t. Watch the board while I show you the snowball.
                Most people quit right before the curve bends. Here&rsquo;s why
                compound interest feels slow, and then suddenly isn&rsquo;t.
                Watch the board while I show you the snowball. Most people quit
                right before the curve bends.
              </p>
            </div>
          </div>

          {/* Diagram pieces popping in */}
          <div className="sc-pop-a absolute left-[6%] top-[46%] rounded-md border-2 border-zinc-800 bg-white px-2 py-1.5 text-[9px] font-semibold text-zinc-800">
            Deposit monthly
          </div>
          <svg className="sc-arrow-1 absolute left-[29%] top-[49%] h-3 w-[8%] text-zinc-800" viewBox="0 0 40 12" fill="none" aria-hidden>
            <path d="M1 6h32m0 0-6-4m6 4-6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="sc-pop-b absolute left-[38%] top-[46%] rounded-md border-2 border-zinc-800 bg-white px-2 py-1.5 text-[9px] font-semibold text-zinc-800">
            Interest compounds
          </div>
          <svg className="sc-arrow-2 absolute left-[65%] top-[49%] h-3 w-[8%] text-zinc-800" viewBox="0 0 40 12" fill="none" aria-hidden>
            <path d="M1 6h32m0 0-6-4m6 4-6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="sc-pop-c absolute left-[74%] top-[46%] rounded-md border-2 border-zinc-800 bg-white px-2 py-1.5 text-[9px] font-semibold text-zinc-800">
            It snowballs
          </div>

          {/* Webcam bubble */}
          <div className="absolute bottom-2 right-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl shadow-lg ring-2 ring-white" aria-hidden>
            🧑🏽‍🏫
          </div>
        </div>

        {/* Record bar mimic */}
        <div className="flex items-center gap-2 border-t border-zinc-800 px-3 py-2" aria-hidden>
          <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[9px] font-bold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            Stop &amp; save
          </span>
          <span className="rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">16:9</span>
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">9:16</span>
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">1:1</span>
          <span className="ml-auto rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300">
            Prompter
          </span>
        </div>
      </div>
    </div>
  );
}
