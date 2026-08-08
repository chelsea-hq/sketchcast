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

  if (loading) return <div className="flex min-h-72 items-center justify-center rounded-[28px] border border-white/[0.08] bg-white/[0.035]"><p className="flex items-center gap-2 text-sm text-white/42"><span className="h-2 w-2 animate-pulse rounded-full bg-[#9d88ff]" />Loading your account…</p></div>;

  if (!account.authConfigured) {
    return (
      <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 shadow-2xl sm:p-10">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a995ff]">Hosted convenience</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">Creator Cloud is opening soon</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/48">
          The Community studio is ready now and stays free. Hosted accounts and billing
          have not been activated on this deployment yet.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/studio" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#7657ff] px-5 text-sm font-semibold text-white transition hover:bg-[#8468ff]">
            Open Community Studio
          </Link>
          <a href="mailto:easyroadup@gmail.com?subject=Sketchcast%20Creator%20Cloud%20founding%20access" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white">
            Join founding access
          </a>
        </div>
      </div>
    );
  }

  if (!account.signedIn) {
    return (
      <div className="grid overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.035] shadow-[0_30px_100px_rgba(0,0,0,0.3)] md:grid-cols-[1.15fr_0.85fr]">
        <div className="p-6 sm:p-10">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a995ff]">Creator account</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">Pick up where you left off.</h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-white/48">Sign in to see your plan, managed usage, encrypted sync access, and billing.</p>
        <Link href="/sign-in" className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[#7657ff] px-6 text-sm font-semibold text-white transition hover:bg-[#8468ff]">
          Sign in
        </Link>
        </div>
        <div className="relative min-h-56 border-t border-white/[0.07] bg-[#111218] p-6 md:min-h-full md:border-l md:border-t-0 sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(118,87,255,0.25),transparent_58%)]" aria-hidden />
          <div className="relative space-y-3">
            {[['◆','Recovery Vault','Local autosave stays free'],['↗','Encrypted sync','Optional across devices'],['⌁','Managed usage','Visible monthly limits']].map(([icon,label,detail]) => <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#7657ff]/15 text-[#b6a8ff]">{icon}</span><span><span className="block text-xs font-semibold text-white">{label}</span><span className="mt-0.5 block text-[11px] text-white/35">{detail}</span></span></div>)}
          </div>
        </div>
      </div>
    );
  }

  const aiPercent = Math.min(100, (account.usage.aiGenerations / Math.max(1, account.limits.aiGenerations)) * 100);
  const transcriptMinutes = Math.ceil(account.usage.transcriptionSeconds / 60);
  const transcriptLimit = Math.ceil(account.limits.transcriptionSeconds / 60);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-6 shadow-2xl sm:p-10">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a995ff]">Current plan</p>
        <h1 className="mt-4 text-4xl font-semibold capitalize tracking-[-0.05em] text-white">{account.plan}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/48">
          {account.plan === "creator"
            ? "Managed AI, transcription, encrypted sync, and unlimited layouts are active."
            : "The local-first studio and bring-your-own-key features remain free."}
        </p>
        {account.renewsAt && (
          <p className="mt-3 text-xs text-white/32">Current billing period ends {new Date(account.renewsAt).toLocaleDateString()}.</p>
        )}
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/studio" className="inline-flex min-h-11 items-center rounded-full bg-[#7657ff] px-5 text-sm font-semibold text-white">Open Studio</Link>
          {account.plan === "creator" ? (
            <button type="button" onClick={openPortal} disabled={working} className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white/65 disabled:opacity-60">
              {working ? "Opening…" : "Manage billing"}
            </button>
          ) : (
            <Link href="/#pricing" className="inline-flex min-h-11 items-center rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white/65">Upgrade</Link>
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
    <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.035] p-5">
      <div className="flex items-center justify-between text-sm"><span className="font-semibold text-white">{label}</span><span className="font-mono text-xs text-white/42">{value}</span></div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-[#7657ff]" style={{ width: `${Math.min(100, percent)}%` }} /></div>
      <p className="mt-3 text-xs text-white/32">Resets monthly. Your own provider keys do not count.</p>
    </div>
  );
}
