import { billingConfigured, getSubscription } from "@/lib/creator-cloud";
import { hostedUserId } from "@/lib/hosted-auth";
import { appUrl, stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!billingConfigured()) {
    return Response.json({ error: "Billing is not configured" }, { status: 503 });
  }
  const userId = await hostedUserId();
  if (!userId) return Response.json({ error: "Sign in first" }, { status: 401 });
  const subscription = await getSubscription(userId);
  if (!subscription?.stripeCustomerId) {
    return Response.json({ error: "No billing account found" }, { status: 404 });
  }
  const session = await stripe().billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appUrl(request)}/account`,
  });
  return Response.json({ url: session.url });
}
