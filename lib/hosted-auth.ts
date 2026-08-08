import "server-only";

import { clerkCredentialsConfigured } from "./provider-environment";

export function authConfigured(): boolean {
  return clerkCredentialsConfigured();
}
export async function hostedUserId(): Promise<string | null> {
  if (!authConfigured()) return null;
  try {
    const { auth } = await import("@clerk/nextjs/server");
    return (await auth()).userId;
  } catch (error) {
    console.error("Could not read the hosted account session", error);
    return null;
  }
}

export async function hostedUserEmail(): Promise<string | null> {
  if (!authConfigured()) return null;
  try {
    const { currentUser } = await import("@clerk/nextjs/server");
    const user = await currentUser();
    return user?.primaryEmailAddress?.emailAddress ?? null;
  } catch (error) {
    console.error("Could not read the hosted account email", error);
    return null;
  }
}
