"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const ready =
    account.authConfigured && account.billingConfigured && account.cloudConfigured;

  const startCheckout = async () => {
    if (!ready) {
      window.location.assign(
        "mailto:easyroadup@gmail.com?subject=Sketchcast%20Creator%20Cloud%20early%20access"
      );
      return;
    }
    if (!account.signedIn) {
      router.push("/sign-in?redirect_url=/#pricing");
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
      window.location.assign(data.url);
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
      className="mt-8 block min-h-12 w-full rounded-full bg-[#d8ff6f] px-5 py-3 text-center text-sm font-semibold text-[#111116] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-wait disabled:opacity-60"
    >
      {working
        ? "Opening secure checkout…"
        : ready
          ? "Choose Creator Cloud"
          : "Get Creator updates"}
    </button>
  );
}
