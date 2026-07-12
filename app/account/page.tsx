import Link from "next/link";

import AccountDashboard from "@/components/AccountDashboard";

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-bold text-white">Sketchcast <span className="font-normal text-zinc-500">Studio</span></Link>
        <div className="mt-8"><AccountDashboard /></div>
      </div>
    </main>
  );
}
