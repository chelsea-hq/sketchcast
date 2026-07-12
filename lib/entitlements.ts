import type { SketchcastPlan } from "./creator-cloud-types";

export function isActiveSubscription(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}
export function planForSubscription(status: string | null | undefined): SketchcastPlan {
  return isActiveSubscription(status) ? "creator" : "community";
}
