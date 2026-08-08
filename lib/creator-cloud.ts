import "server-only";

import { Redis } from "@upstash/redis";

import { authConfigured, hostedUserId } from "./hosted-auth";
import {
  COMMUNITY_LIMITS,
  CREATOR_LIMITS,
  type CreatorCloudAccount,
  type CreatorCloudUsage,
  type SketchcastPlan,
} from "./creator-cloud-types";
import { isActiveSubscription } from "./entitlements";
import { configuredAppUrl } from "./app-url";
import { stripeCredentialsConfigured } from "./provider-environment";

export interface SubscriptionRecord {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  priceId: string | null;
  renewsAt: string | null;
  stripeEventCreated: number;
  updatedAt: string;
}

type UsageMetric = keyof CreatorCloudUsage;

let redisClient: Redis | null | undefined;

export function cloudStoreConfigured(): boolean {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
      (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
  );
}

export function billingConfigured(): boolean {
  return Boolean(
    stripeCredentialsConfigured() &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.STRIPE_PRICE_CREATOR_MONTHLY &&
      process.env.STRIPE_PRICE_CREATOR_ANNUAL &&
      configuredAppUrl()
  );
}

export function syncRequiresCreator(): boolean {
  return process.env.SKETCHCAST_REQUIRE_SYNC_SUBSCRIPTION === "true";
}

function redis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

function subscriptionKey(userId: string): string {
  return `sketchcast:subscription:${userId}`;
}

function customerKey(customerId: string): string {
  return `sketchcast:customer:${customerId}`;
}

function subscriptionEventKey(userId: string): string {
  return `sketchcast:subscription-event:${userId}`;
}

function usageKey(userId: string, now = new Date()): string {
  return `sketchcast:usage:${userId}:${now.toISOString().slice(0, 7)}`;
}

function globalUsageKey(now = new Date()): string {
  return `sketchcast:usage:global:${now.toISOString().slice(0, 7)}`;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function globalUsageLimit(metric: UsageMetric): number {
  return metric === "aiGenerations"
    ? positiveInteger(process.env.SKETCHCAST_GLOBAL_AI_MONTHLY_LIMIT, 5_000)
    : positiveInteger(
        process.env.SKETCHCAST_GLOBAL_TRANSCRIPTION_SECONDS_MONTHLY_LIMIT,
        100 * 60 * 60
      );
}

export async function getSubscription(
  userId: string
): Promise<SubscriptionRecord | null> {
  const store = redis();
  if (!store) return null;
  return store.get<SubscriptionRecord>(subscriptionKey(userId));
}

export async function saveSubscription(record: SubscriptionRecord): Promise<void> {
  const store = redis();
  if (!store) throw new Error("Creator Cloud storage is not configured");
  const result = await store.eval<
    [string, string, number],
    number
  >(
    `
local currentEvent = tonumber(redis.call("GET", KEYS[3]) or "0")
local incomingEvent = tonumber(ARGV[3])
if currentEvent > incomingEvent then
  return 0
end
redis.call("SET", KEYS[1], ARGV[1])
redis.call("SET", KEYS[2], ARGV[2])
redis.call("SET", KEYS[3], incomingEvent)
return 1
`,
    [
      subscriptionKey(record.userId),
      customerKey(record.stripeCustomerId),
      subscriptionEventKey(record.userId),
    ],
    [JSON.stringify(record), record.userId, record.stripeEventCreated]
  );
  if (result === 0) {
    console.warn(`Ignored out-of-order Stripe event for ${record.userId}`);
  }
}

export async function userIdForCustomer(customerId: string): Promise<string | null> {
  const store = redis();
  if (!store) return null;
  return store.get<string>(customerKey(customerId));
}

export async function getPlan(userId: string | null): Promise<SketchcastPlan> {
  if (!userId) return "community";
  try {
    const subscription = await getSubscription(userId);
    return isActiveSubscription(subscription?.status) ? "creator" : "community";
  } catch (error) {
    console.error("Creator Cloud entitlement lookup failed closed", error);
    return "community";
  }
}

export async function getUsage(userId: string): Promise<CreatorCloudUsage> {
  const store = redis();
  if (!store) return { aiGenerations: 0, transcriptionSeconds: 0 };
  try {
    const result = await store.hmget<Record<string, number | null>>(
      usageKey(userId),
      "aiGenerations",
      "transcriptionSeconds"
    );
    return {
      aiGenerations: Number(result?.aiGenerations ?? 0),
      transcriptionSeconds: Number(result?.transcriptionSeconds ?? 0),
    };
  } catch (error) {
    console.error("Creator Cloud usage lookup failed", error);
    return { aiGenerations: 0, transcriptionSeconds: 0 };
  }
}

const RESERVE_USAGE_SCRIPT = `
local current = tonumber(redis.call("HGET", KEYS[1], ARGV[1]) or "0")
local globalCurrent = tonumber(redis.call("HGET", KEYS[2], ARGV[1]) or "0")
local amount = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local globalLimit = tonumber(ARGV[4])
if current + amount > limit then
  return {0, current, globalCurrent, 1}
end
if globalCurrent + amount > globalLimit then
  return {0, current, globalCurrent, 2}
end
local next = redis.call("HINCRBY", KEYS[1], ARGV[1], amount)
local globalNext = redis.call("HINCRBY", KEYS[2], ARGV[1], amount)
redis.call("EXPIRE", KEYS[1], tonumber(ARGV[5]))
redis.call("EXPIRE", KEYS[2], tonumber(ARGV[5]))
return {1, next, globalNext, 0}
`;

export async function reserveUsage(
  userId: string,
  metric: UsageMetric,
  amount: number,
  limit: number
): Promise<{
  allowed: boolean;
  used: number;
  globalUsed: number;
  reason: "user" | "global" | "store" | null;
}> {
  const store = redis();
  if (!store) {
    return { allowed: false, used: 0, globalUsed: 0, reason: "store" };
  }
  const safeAmount = Math.max(1, Math.ceil(amount));
  const result = await store.eval<
    [string, number, number, number, number],
    [number, number, number, number]
  >(
    RESERVE_USAGE_SCRIPT,
    [usageKey(userId), globalUsageKey()],
    [
      metric,
      safeAmount,
      limit,
      globalUsageLimit(metric),
      40 * 24 * 60 * 60,
    ]
  );
  const reason = result[3] === 1 ? "user" : result[3] === 2 ? "global" : null;
  return {
    allowed: result[0] === 1,
    used: Number(result[1]),
    globalUsed: Number(result[2]),
    reason,
  };
}

export async function creatorEntitlement(): Promise<{
  userId: string | null;
  plan: SketchcastPlan;
}> {
  const userId = await hostedUserId();
  return { userId, plan: await getPlan(userId) };
}

export async function accountSummary(): Promise<CreatorCloudAccount> {
  const userId = await hostedUserId();
  let subscription: SubscriptionRecord | null = null;
  if (userId) {
    try {
      subscription = await getSubscription(userId);
    } catch (error) {
      console.error("Creator Cloud account lookup failed closed", error);
    }
  }
  const plan = isActiveSubscription(subscription?.status) ? "creator" : "community";
  return {
    authConfigured: authConfigured(),
    billingConfigured: billingConfigured(),
    cloudConfigured: cloudStoreConfigured(),
    syncRequiresCreator: syncRequiresCreator(),
    signedIn: Boolean(userId),
    plan,
    subscriptionStatus: subscription?.status ?? null,
    renewsAt: subscription?.renewsAt ?? null,
    usage: userId
      ? await getUsage(userId)
      : { aiGenerations: 0, transcriptionSeconds: 0 },
    limits: plan === "creator" ? CREATOR_LIMITS : COMMUNITY_LIMITS,
  };
}
