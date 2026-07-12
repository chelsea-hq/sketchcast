import Link from "next/link";

export const metadata = {
  title: "Privacy Policy · Sketchcast Studio",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-300">
      <div className="mx-auto max-w-2xl space-y-6 text-sm leading-relaxed">
        <Link href="/" className="text-indigo-400 hover:text-indigo-300">
          ← Sketchcast Studio
        </Link>
        <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
        <p className="text-zinc-500">Effective July 12, 2026</p>

        <h2 className="pt-2 text-base font-semibold text-white">The short version</h2>
        <p>
          Sketchcast is local-first. We don’t run ad trackers, and we never
          store your videos or API keys on our servers. Optional Creator Cloud
          accounts store only the minimum account, billing, and usage metadata
          needed to provide paid services. Cloud sync stores project data only
          after it is encrypted in your browser with a recovery code we do not know.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">What stays on your device</h2>
        <p>
          Your named projects, recordings, saved templates, and API keys live
          in browser storage on your machine. Recordings are kept in the local
          Recovery Vault until you delete them or clear browser storage. Video
          takes and API keys are never included in cloud sync.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">What leaves your device, and when</h2>
        <p>
          Four product features send data out, each only when you use it. (1) AI
          generation: when you generate a diagram or social copy, your concept
          text and script pass through our server to the AI provider you chose
          (Anthropic, OpenAI, OpenRouter, or Google), authenticated with your
          own API key or the managed Creator Cloud allowance. We forward a
          browser-supplied key with that request and do not store or log it.
          (2) Transcripts: when you click “Load transcript,” the
          audio of that take is sent through our server to Deepgram to be
          transcribed, then discarded. (3) Encrypted cloud sync: when you click
          Push, your browser encrypts the active project’s board, script,
          format, and webcam layout using AES-GCM. Vercel Blob stores the
          ciphertext. The recovery code never leaves your browser, and without
          it neither we nor Vercel can read the project. (4) Hosting: our host (Vercel) keeps
          standard, short-lived request logs such as IP address and user
          agent, as virtually every website’s infrastructure does.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">Accounts and billing</h2>
        <p>
          If you create a Creator Cloud account, Clerk processes your identity
          and session. Stripe processes checkout and payment details; Sketchcast
          does not receive full card numbers. We store your Clerk user identifier,
          Stripe customer and subscription identifiers, subscription status,
          renewal date, and monthly AI/transcription counters in Upstash. We use
          this data only to provide the account, enforce limits, and support billing.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">Third-party AI providers</h2>
        <p>
          Content you send to an AI provider is handled under that provider’s
          own terms and privacy policy, tied to your API key and account with
          them. Check their policies for how they handle API data.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">Children</h2>
        <p>Sketchcast is not directed at children under 13.</p>

        <h2 className="pt-2 text-base font-semibold text-white">Changes and contact</h2>
        <p>
          We’ll update this page as the product evolves. You can request account
          deletion or ask privacy questions at easyroadup@gmail.com.
        </p>
      </div>
    </div>
  );
}
