"use client";

import dynamic from "next/dynamic";

const Studio = dynamic(() => import("@/components/Studio"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">
      Loading studio…
    </div>
  ),
});

export default function Home() {
  return <Studio />;
}
