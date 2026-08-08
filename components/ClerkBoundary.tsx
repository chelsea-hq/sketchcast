import { ClerkProvider } from "@clerk/nextjs";

import { clerkCredentialsConfigured } from "@/lib/provider-environment";

export default function ClerkBoundary({ children }: { children: React.ReactNode }) {
  if (!clerkCredentialsConfigured()) {
    return children;
  }
  return <ClerkProvider dynamic>{children}</ClerkProvider>;
}
