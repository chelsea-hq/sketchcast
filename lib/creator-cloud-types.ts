export type SketchcastPlan = "community" | "creator";
export type BillingInterval = "monthly" | "annual" | "founding";

export interface CreatorCloudUsage {
  aiGenerations: number;
  transcriptionSeconds: number;
}

export interface CreatorCloudLimits {
  aiGenerations: number;
  transcriptionSeconds: number;
  templates: number | null;
}

export interface CreatorCloudAccount {
  authConfigured: boolean;
  billingConfigured: boolean;
  cloudConfigured: boolean;
  syncRequiresCreator: boolean;
  signedIn: boolean;
  plan: SketchcastPlan;
  subscriptionStatus: string | null;
  renewsAt: string | null;
  usage: CreatorCloudUsage;
  limits: CreatorCloudLimits;
}

export const COMMUNITY_LIMITS: CreatorCloudLimits = {
  aiGenerations: 0,
  transcriptionSeconds: 0,
  templates: 3,
};

export const CREATOR_LIMITS: CreatorCloudLimits = {
  aiGenerations: 100,
  transcriptionSeconds: 120 * 60,
  templates: null,
};
