"use client";

import dynamic from "next/dynamic";

const Studio = dynamic(() => import("@/components/Studio"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh items-center justify-center bg-[#090a0f] text-sm text-white/42">
      <span className="flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-[#9d88ff]" />Opening your studio…</span>
    </div>
  ),
});

export default function StudioPage() {
  return <Studio />;
}
