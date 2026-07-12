"use client";

import { useState } from "react";
import Link from "next/link";

import SubscribeButton from "@/components/SubscribeButton";
import { useCreatorCloud } from "@/components/useCreatorCloud";

export default function Pricing() {
  const [yearly, setYearly] = useState(true);
  const { account, loading } = useCreatorCloud();
  const founding = yearly && account.foundingOfferAvailable;

  return (
    <section id="pricing" className="scroll-mt-20 py-16">
      <h2 className="text-center text-3xl font-bold text-zinc-900">
        Start free. Pay only for the hosted conveniences.
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-zinc-500">
        Sketchcast Community stays open source and useful without an account. Creator
        Cloud pays for managed AI, transcription, encrypted storage, and support.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3 text-sm">
        <span className={yearly ? "text-zinc-400" : "font-semibold text-zinc-900"}>Monthly</span>
        <button type="button" role="switch" aria-checked={yearly} aria-label="Toggle yearly billing" onClick={() => setYearly((value) => !value)} className={`relative h-6 w-11 rounded-full transition-colors ${yearly ? "bg-indigo-600" : "bg-zinc-300"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${yearly ? "left-[22px]" : "left-0.5"}`} />
        </button>
        <span className={yearly ? "font-semibold text-zinc-900" : "text-zinc-400"}>Yearly <span className="text-indigo-600">· save $29</span></span>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
        <PlanCard
          name="Community"
          price="$0"
          blurb="The complete local-first studio. No account or credit card."
          features={[
            "Whiteboard, webcam, teleprompter, and exports",
            "Take editor, manual cuts, and action slides",
            "Local projects and Recovery Vault",
            "AI diagrams and post copy with your own keys",
            "3 reusable layouts",
            "MIT licensed and self-hostable",
          ]}
        >
          <Link href="/studio" className="mt-6 block rounded-lg bg-zinc-100 py-2.5 text-center text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-200">
            Open the free studio
          </Link>
        </PlanCard>

        <PlanCard
          name="Creator Cloud"
          price={founding ? "$49/yr" : yearly ? "$79/yr" : "$9/mo"}
          blurb="Skip the API setup and keep your projects moving between devices."
          features={[
            "Everything in Community",
            "100 managed AI generations each month",
            "120 managed transcription minutes each month",
            "End-to-end encrypted project sync",
            "Unlimited reusable layouts",
            "Bring your own keys anytime with no quota",
          ]}
          highlighted
        >
          <SubscribeButton
            interval={founding ? "founding" : yearly ? "annual" : "monthly"}
            account={account}
            loading={loading}
          />
          <p className="mt-2 text-center text-[11px] text-zinc-500">
            {founding
              ? "Founding rate for early members while spots remain."
              : "Ask about the $49/year founding rate while spots remain."}
          </p>
        </PlanCard>
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-zinc-500">
        Creator Cloud checkout will only appear when the hosted account and billing
        services are active. Until then, joining founding access sends a simple email—no
        pretend checkout and no surprise charge.
      </p>
    </section>
  );
}

function PlanCard({ name, price, blurb, features, highlighted = false, children }: { name: string; price: string; blurb: string; features: string[]; highlighted?: boolean; children: React.ReactNode }) {
  return (
    <div className={`relative rounded-2xl border bg-white p-6 ${highlighted ? "border-indigo-600 shadow-xl ring-1 ring-indigo-600" : "border-zinc-200 shadow-sm"}`}>
      {highlighted && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-[11px] font-semibold text-white">Hosted plan</span>}
      <h3 className="text-sm font-semibold text-zinc-900">{name}</h3>
      <p className="mt-3 text-4xl font-bold tabular-nums text-zinc-900">{price}</p>
      <p className="mt-2 text-sm text-zinc-600">{blurb}</p>
      <ul className="mt-4 space-y-2">
        {features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-zinc-600"><span className="text-indigo-600">✓</span>{feature}</li>)}
      </ul>
      {children}
    </div>
  );
}
