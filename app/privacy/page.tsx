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
        <p className="text-zinc-500">Effective July 3, 2026 · Beta</p>

        <h2 className="pt-2 text-base font-semibold text-white">The short version</h2>
        <p>
          Sketchcast runs in your browser. We don't have user accounts, we
          don't run analytics or ad trackers, and we don't store your videos,
          scripts, templates, or API keys on our servers.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">What stays on your device</h2>
        <p>
          Your recordings live in your browser's memory until you download
          them. Your saved templates and API keys live in your browser's local
          storage on your machine. None of these are transmitted to us for
          storage.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">What leaves your device, and when</h2>
        <p>
          Three features send data out, each only when you use it. (1) AI
          generation: when you generate a diagram or social copy, your concept
          text and script pass through our server to the AI provider you chose
          (Anthropic, OpenAI, OpenRouter, or Google), authenticated with your
          own API key. We forward your key with that request and do not store
          or log it. (2) Transcripts: when you click "Load transcript," the
          audio of that take is sent through our server to Deepgram to be
          transcribed, then discarded. (3) Hosting: our host (Vercel) keeps
          standard, short-lived request logs such as IP address and user
          agent, as virtually every website's infrastructure does.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">Third-party AI providers</h2>
        <p>
          Content you send to an AI provider is handled under that provider's
          own terms and privacy policy, tied to your API key and account with
          them. Check their policies for how they handle API data.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">Children</h2>
        <p>Sketchcast is not directed at children under 13.</p>

        <h2 className="pt-2 text-base font-semibold text-white">Changes and contact</h2>
        <p>
          We'll update this page as the product evolves (for example, if
          accounts or analytics are ever added, this policy will say so
          first). Questions: easyroadup@gmail.com.
        </p>
      </div>
    </div>
  );
}
