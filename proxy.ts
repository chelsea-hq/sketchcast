import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import {
  buildContentSecurityPolicy,
  clerkFrontendOrigin,
} from "@/lib/content-security-policy";
import { clerkCredentialsConfigured } from "@/lib/provider-environment";

const clerkConfigured = clerkCredentialsConfigured();
const clerkOrigin = clerkConfigured
  ? clerkFrontendOrigin(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  : null;

function withContentSecurityPolicy(request: NextRequest): NextResponse {
  const nonce = btoa(crypto.randomUUID());
  const policy = buildContentSecurityPolicy({
    nonce,
    clerkOrigin,
    production: process.env.NODE_ENV === "production",
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

const withClerk = clerkMiddleware((_auth, request) =>
  withContentSecurityPolicy(request)
);

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!clerkConfigured) {
    return withContentSecurityPolicy(request);
  }
  return withClerk(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
