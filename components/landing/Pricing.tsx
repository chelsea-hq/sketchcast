"use client";

import { useState } from "react";
import Link from "next/link";

import SubscribeButton from "@/components/SubscribeButton";
import { useCreatorCloud } from "@/components/useCreatorCloud";
import { creatorOffer } from "@/lib/creator-pricing";
import type { BillingInterval } from "@/lib/creator-cloud-types";

const communityFeatures = [
  "Whiteboard, webcam, teleprompter, and exports",
  "Take editor, transcript cuts, and action slides",
  "Local projects and the Recovery Vault",
  "AI diagrams and copy with your own keys",
  "Three reusable layouts",
  "MIT licensed and self-hostable",
];

const creatorFeatures = [
  "Everything in Community",
  "30 managed AI generations each month",
  "60 transcription minutes each month",
  "End-to-end encrypted project sync",
  "Unlimited reusable layouts",
  "Bring your own keys anytime with no quota",
];

function Check() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className="mt-0.5 h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3.5 9 3.3 3.3 7.7-7.6" />
    </svg>
  );
}

export default function Pricing() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const { account, loading } = useCreatorCloud();
  const offer = creatorOffer(interval);

  return (
    <section id="pricing" className="scroll-mt-24 py-24 sm:py-32">
      <div className="grid gap-8 border-b border-black/10 pb-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6f52ee]">Simple by design</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">Start local.<br />Add cloud when it helps.</h2>
        </div>
        <div className="flex flex-col gap-5 lg:items-end">
          <p className="max-w-2xl text-sm leading-6 text-black/55 lg:text-right">
            Community is a real product, not a trial. Creator Cloud funds hosted convenience while the local-first studio stays open.
          </p>
          <div className="inline-flex w-fit items-center rounded-full border border-black/10 bg-white p-1 text-xs font-semibold">
            <button type="button" aria-pressed={interval === "monthly"} onClick={() => setInterval("monthly")} className={`min-h-10 rounded-full px-4 transition ${interval === "monthly" ? "bg-[#111116] text-white" : "text-black/45 hover:text-black"}`}>Monthly</button>
            <button type="button" aria-pressed={interval === "annual"} onClick={() => setInterval("annual")} className={`min-h-10 rounded-full px-4 transition ${interval === "annual" ? "bg-[#111116] text-white" : "text-black/45 hover:text-black"}`}>
              Yearly <span className={interval === "annual" ? "text-[#d8ff6f]" : "text-[#6f52ee]"}>· save $21</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <PlanCard
          eyebrow="Open source"
          name="Community"
          price="$0"
          cadence="forever"
          blurb="The complete local-first studio. No account, no credit card, no artificial project limit."
          features={communityFeatures}
        >
          <Link href="/studio" className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-black/10 bg-[#111116] px-5 text-sm font-semibold text-white transition hover:bg-[#7657ff]">
            Open the free studio
          </Link>
        </PlanCard>

        <PlanCard
          eyebrow="Hosted convenience"
          name="Creator Cloud"
          price={offer.displayPrice}
          cadence={offer.cadence}
          blurb="For creators who want encrypted continuity and managed services without API setup."
          features={creatorFeatures}
          highlighted
        >
          <p className="mt-6 text-center text-xs font-medium text-white/55">{offer.billingNote}</p>
          <SubscribeButton interval={interval} account={account} loading={loading} />
          <p className="mt-3 text-center text-[11px] leading-5 text-white/42">
            Early-access pricing. Your own provider keys never count against managed limits.
          </p>
        </PlanCard>
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-5 text-black/42">
        Checkout appears only when hosted accounts and billing are configured. Until then, the interest path sends an email—never a pretend purchase or surprise charge.
      </p>
    </section>
  );
}

function PlanCard({ eyebrow, name, price, cadence, blurb, features, highlighted = false, children }: { eyebrow: string; name: string; price: string; cadence: string; blurb: string; features: string[]; highlighted?: boolean; children: React.ReactNode }) {
  return (
    <article className={`relative overflow-hidden rounded-[28px] p-6 sm:p-8 ${highlighted ? "bg-[#111116] text-white shadow-[0_30px_90px_rgba(17,17,22,0.18)]" : "border border-black/10 bg-white text-[#111116]"}`}>
      {highlighted && <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#7657ff]/35 blur-[80px]" aria-hidden />}
      <div className="relative">
        <p className={`font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${highlighted ? "text-[#b6a8ff]" : "text-[#6f52ee]"}`}>{eyebrow}</p>
        <div className="mt-5 flex items-start justify-between gap-4">
          <h3 className="text-2xl font-semibold tracking-[-0.04em]">{name}</h3>
          {highlighted && <span className="rounded-full bg-[#d8ff6f] px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#111116]">Early access</span>}
        </div>
        <p className="mt-8 flex items-end gap-2">
          <span className="text-6xl font-semibold tracking-[-0.065em]">{price}</span>
          <span className={`pb-2 text-sm ${highlighted ? "text-white/42" : "text-black/42"}`}>{cadence}</span>
        </p>
        <p className={`mt-5 max-w-lg text-sm leading-6 ${highlighted ? "text-white/55" : "text-black/55"}`}>{blurb}</p>
        <ul className={`mt-8 space-y-3 border-t pt-7 ${highlighted ? "border-white/10" : "border-black/10"}`}>
          {features.map((feature) => (
            <li key={feature} className={`flex gap-2.5 text-sm ${highlighted ? "text-white/68" : "text-black/62"}`}>
              <span className={highlighted ? "text-[#d8ff6f]" : "text-[#6f52ee]"}><Check /></span>{feature}
            </li>
          ))}
        </ul>
        {children}
      </div>
    </article>
  );
}
