"use client";

import { useCallback, useEffect, useState } from "react";

import {
  COMMUNITY_LIMITS,
  type CreatorCloudAccount,
} from "@/lib/creator-cloud-types";

const DEFAULT_ACCOUNT: CreatorCloudAccount = {
  authConfigured: false,
  billingConfigured: false,
  cloudConfigured: false,
  syncRequiresCreator: false,
  signedIn: false,
  plan: "community",
  subscriptionStatus: null,
  renewsAt: null,
  usage: { aiGenerations: 0, transcriptionSeconds: 0 },
  limits: COMMUNITY_LIMITS,
};

export function useCreatorCloud() {
  const [account, setAccount] = useState(DEFAULT_ACCOUNT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/account", { cache: "no-store" });
      if (response.ok) setAccount((await response.json()) as CreatorCloudAccount);
    } catch (error) {
      console.error("Could not load Creator Cloud account", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/account", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.ok) setAccount((await response.json()) as CreatorCloudAccount);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Could not load Creator Cloud account", error);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return { account, loading, refresh };
}
