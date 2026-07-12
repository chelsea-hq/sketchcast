"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { useCreatorCloud } from "./useCreatorCloud";

export default function AccountDashboard() {
  const { account, loading } = useCreatorCloud();
  const [working, setWorking] = useState(false);

  const openPortal = async () => {
    setWorking(true);
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? "Billing portal failed");
      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Billing portal failed");
      setWorking(false);
    }
  };

  if (loading) return <p className="text-sm text-zinc-400">Loading your account…</p>;

  if (!account.authConfigured) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-2xl font-bold text-white">Creator Cloud is opening soon</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
          The Community studio is ready now and stays free. Hosted accounts and billing
          have not been activated on this deployment yet.
        </p>
        <div className="mt-5 flex gap-3">
          <Link href="/studio" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            Open Community Studio
          </Link>
          <a href="mailto:easyroadup@gmail.com?subject=Sketchcast%20Creator%20Cloud%20founding%20access" className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200">
            Join founding access
          </a>
        </div>
      </div>
    );
  }

  if (!account.signedIn) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="text-2xl font-bold text-white">Your Sketchcast account</h1>
        <p className="mt-3 text-sm text-zinc-400">Sign in to see your plan, usage, and billing.</p>
        <Link href="/sign-in" className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
          Sign in
        </Link>
      </div>
    );
  }

  const aiPercent = Math.min(100, (account.usage.aiGenerations / Math.max(1, account.limits.aiGenerations)) * 100);
  const transcriptMinutes = Math.ceil(account.usage.transcriptionSeconds / 60);
  const transcriptLimit = Math.ceil(account.limits.transcriptionSeconds / 60);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Current plan</p>
        <h1 className="mt-2 text-3xl font-bold capitalize text-white">{account.plan}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {account.plan === "creator"
            ? "Managed AI, transcription, encrypted sync, and unlimited layouts are active."
            : "The local-first studio and bring-your-own-key features remain free."}
        </p>
        {account.renewsAt && (
          <p className="mt-2 text-xs text-zinc-500">Current billing period ends {new Date(account.renewsAt).toLocaleDateString()}.</p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/studio" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Open Studio</Link>
          {account.plan === "creator" ? (
            <button type="button" onClick={openPortal} disabled={working} className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200 disabled:opacity-60">
              {working ? "Opening…" : "Manage billing"}
            </button>
          ) : (
            <Link href="/#pricing" className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-200">Upgrade</Link>
          )}
        </div>
      </div>

      {account.plan === "creator" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <UsageCard label="Managed AI" value={`${account.usage.aiGenerations} / ${account.limits.aiGenerations}`} percent={aiPercent} />
          <UsageCard label="Transcription" value={`${transcriptMinutes} / ${transcriptLimit} min`} percent={(transcriptMinutes / Math.max(1, transcriptLimit)) * 100} />
        </div>
      )}
    </div>
  );
}
function UsageCard({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between text-sm"><span className="font-semibold text-white">{label}</span><span className="text-zinc-400">{value}</span></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, percent)}%` }} /></div>
      <p className="mt-2 text-xs text-zinc-500">Resets monthly. Your own provider keys do not count.</p>
    </div>
  );
}
