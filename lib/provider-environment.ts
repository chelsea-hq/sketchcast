interface ProviderEnvironment {
  NODE_ENV?: string;
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
  CLERK_SECRET_KEY?: string;
  STRIPE_SECRET_KEY?: string;
}

function isProduction(environment: ProviderEnvironment): boolean {
  return environment.NODE_ENV === "production";
}

export function clerkCredentialsConfigured(
  environment: ProviderEnvironment = process.env
): boolean {
  const publishableKey = environment.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = environment.CLERK_SECRET_KEY;
  if (!publishableKey || !secretKey) return false;
  if (!isProduction(environment)) return true;
  return publishableKey.startsWith("pk_live_") && secretKey.startsWith("sk_live_");
}

export function stripeCredentialsConfigured(
  environment: ProviderEnvironment = process.env
): boolean {
  const secretKey = environment.STRIPE_SECRET_KEY;
  if (!secretKey) return false;
  if (!isProduction(environment)) return true;
  return secretKey.startsWith("sk_live_");
}
