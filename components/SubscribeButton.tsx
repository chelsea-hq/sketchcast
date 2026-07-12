"use client";

import { useState } from "react";
import { toast } from "sonner";

import type {
  BillingInterval,
  CreatorCloudAccount,
} from "@/lib/creator-cloud-types";

export default function SubscribeButton({
  interval,
  account,
  loading,
}: {
  interval: BillingInterval;
  account: CreatorCloudAccount;
  loading: boolean;
}) {
  const [working, setWorking] = useState(false);
  const ready =
    account.authConfigured && account.billingConfigured && account.cloudConfigured;

  const startCheckout = async () => {
    if (!ready) {
      window.location.href =
        "mailto:easyroadup@gmail.com?subject=Sketchcast%20Creator%20Cloud%20founding%20access";
      return;
    }
    if (!account.signedIn) {
      window.location.href = "/sign-in?redirect_url=/#pricing";
      return;
    }
    setWorking(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
      setWorking(false);
    }
  };

  return (
    <button
      type="button"
      onClick={startCheckout}
      disabled={loading || working}
      className="mt-6 block w-full rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60"
    >
      {working
        ? "Opening secure checkout…"
        : ready
          ? "Choose Creator Cloud"
          : "Join founding access"}
    </button>
  );
}
