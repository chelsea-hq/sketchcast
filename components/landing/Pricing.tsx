"use client";

import { useState } from "react";
import Link from "next/link";

interface Tier {
  name: string;
  monthly: number;
  yearly: number;
  blurb: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    blurb: "The full studio, with your own AI keys.",
    features: [
      "Whiteboard + webcam + teleprompter recording",
      "16:9, 9:16, and 1:1 exports",
      "Take editor: manual cuts + action slides",
      "AI diagrams + copy with your own keys",
      "3 saved templates",
    ],
    cta: "Start free",
  },
  {
    name: "Creator",
    monthly: 9.99,
    yearly: 7.99,
    blurb: "AI included, zero setup. Built to post daily.",
    features: [
      "Everything in Free, no API keys needed",
      "Auto-captions: burned in + SRT file",
      "One-click filler-word removal",
      "Script generator + hook variations",
      "Brand kit: your colors + logo on slides",
      "No watermark, unlimited templates",
    ],
    cta: "Join the waitlist",
    highlight: true,
  },
  {
    name: "Studio",
    monthly: 24.99,
    yearly: 19.99,
    blurb: "For teams, agencies, and client work.",
    features: [
      "Everything in Creator",
      "3 seats",
      "Shared brand kits + template library",
      "White-label exports for clients",
      "Priority support",
    ],
    cta: "Join the waitlist",
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section className="py-16">
      <h2 className="text-center text-3xl font-bold text-zinc-900">
        Simple pricing, when it ships
      </h2>
      <p className="mt-2 text-center text-sm text-zinc-500">
        Planned pricing preview. The beta is free while we build with you.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3 text-sm">
        <span className={yearly ? "text-zinc-400" : "font-semibold text-zinc-900"}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label="Toggle yearly billing"
          onClick={() => setYearly((y) => !y)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            yearly ? "bg-indigo-600" : "bg-zinc-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              yearly ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
        <span className={yearly ? "font-semibold text-zinc-900" : "text-zinc-400"}>
          Yearly <span className="text-indigo-600">· 2 months free</span>
        </span>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-2xl border bg-white p-6 ${
              tier.highlight
                ? "border-indigo-600 shadow-xl ring-1 ring-indigo-600 md:-translate-y-2"
                : "border-zinc-200 shadow-sm"
            }`}
          >
            {tier.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-[11px] font-semibold text-white">
                Most popular
              </span>
            )}
            <h3 className="text-sm font-semibold text-zinc-900">{tier.name}</h3>
            <p className="mt-3 text-4xl font-bold tabular-nums text-zinc-900">
              ${yearly ? tier.yearly : tier.monthly}
              <span className="text-sm font-normal text-zinc-500">/mo</span>
            </p>
            {yearly && tier.monthly > 0 && (
              <p className="text-[11px] text-zinc-500">billed yearly</p>
            )}
            <p className="mt-2 text-sm text-zinc-600">{tier.blurb}</p>
            <ul className="mt-4 space-y-2">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-zinc-600">
                  <span className="text-indigo-600">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/studio"
              className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                tier.highlight
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
