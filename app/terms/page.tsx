import Link from "next/link";

export const metadata = {
  title: "Terms of Service · Sketchcast Studio",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-16 text-zinc-300">
      <div className="mx-auto max-w-2xl space-y-6 text-sm leading-relaxed">
        <Link href="/" className="text-indigo-400 hover:text-indigo-300">
          ← Sketchcast Studio
        </Link>
        <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
        <p className="text-zinc-500">Effective July 11, 2026 · Beta</p>

        <h2 className="pt-2 text-base font-semibold text-white">Beta software</h2>
        <p>
          Sketchcast Studio is free beta software provided as-is, without
          warranties of any kind. Features may change, break, or disappear
          while we build. Download takes you care about; recordings are not
          recoverable by us. Locally stored takes can still be lost if browser
          storage is cleared.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">Your content</h2>
        <p>
          Everything you create with Sketchcast (recordings, boards, scripts,
          exports) is yours. We claim no rights to it. If you choose cloud
          sync, your browser encrypts project data before upload and we store
          only ciphertext. Recordings are not included in cloud sync.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">Recovery codes</h2>
        <p>
          Your cloud-sync recovery code is the encryption key. We do not receive
          or store it and cannot reset or recover it. Anyone who obtains the code
          may be able to decrypt that cloud project, so keep it private.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">Your API keys and costs</h2>
        <p>
          Bring-your-own-key features call AI providers using your keys and
          your accounts. You’re responsible for the usage costs those calls
          incur and for complying with each provider’s terms. We recommend
          creating a dedicated key for Sketchcast and setting a spend limit in
          your provider’s console.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">Acceptable use</h2>
        <p>
          Don’t use Sketchcast to create content that’s illegal or that
          violates the policies of the AI providers your keys belong to. Don’t
          attempt to disrupt, overload, or reverse the service’s security
          measures.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">Liability</h2>
        <p>
          To the maximum extent permitted by law, Sketchcast and its creator
          are not liable for any indirect, incidental, or consequential
          damages arising from use of the beta, including lost recordings or
          API costs. Total liability is limited to the amount you paid for the
          service, which during the free beta is zero.
        </p>

        <h2 className="pt-2 text-base font-semibold text-white">Changes and contact</h2>
        <p>
          These terms may be updated as the product moves out of beta;
          continued use after changes means acceptance. Questions:
          easyroadup@gmail.com.
        </p>
      </div>
    </div>
  );
}
