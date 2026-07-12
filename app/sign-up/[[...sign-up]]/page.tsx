import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <Unavailable />;
  }
  return <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6"><SignUp /></main>;
}
function Unavailable() {
  return <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-center text-zinc-100"><div><h1 className="text-2xl font-bold">Creator Cloud is opening soon</h1><p className="mt-3 text-sm text-zinc-400">The free Community studio is available now.</p><Link href="/studio" className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Open Studio</Link></div></main>;
}
