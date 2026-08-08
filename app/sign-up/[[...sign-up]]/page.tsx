import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { clerkCredentialsConfigured } from "@/lib/provider-environment";

export default function SignUpPage() {
  if (!clerkCredentialsConfigured()) {
    return <Unavailable />;
  }
  return <AuthShell mode="sign up"><SignUp /></AuthShell>;
}
function Unavailable() {
  return <AuthShell mode="sign up"><div className="w-full max-w-sm rounded-[28px] border border-white/[0.08] bg-white/[0.04] p-8 text-center"><h2 className="text-2xl font-semibold tracking-[-0.04em]">Creator Cloud is opening soon</h2><p className="mt-3 text-sm leading-6 text-white/45">The free Community studio is available now.</p><Link href="/studio" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#7657ff] px-5 text-sm font-semibold text-white">Open Studio</Link></div></AuthShell>;
}
