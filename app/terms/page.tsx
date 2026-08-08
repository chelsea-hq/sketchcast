import Link from "next/link";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f3f3ed] px-5 py-8 text-black/62 sm:px-8 sm:py-12">
      <article className="mx-auto max-w-3xl space-y-7 rounded-[28px] border border-black/10 bg-white p-6 text-[15px] leading-7 shadow-[0_30px_90px_rgba(17,17,22,0.06)] sm:p-10">
        <Link href="/" className="inline-flex min-h-10 items-center rounded-full border border-black/10 px-4 text-xs font-semibold text-[#6f52ee] transition hover:bg-[#7657ff] hover:text-white">
          ← Sketchcast Studio
        </Link>
        <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[#111116] sm:text-5xl">Terms of Service</h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-black/35">Effective July 12, 2026</p>

        <h2 className="pt-3 text-lg font-semibold tracking-[-0.02em] text-[#111116]">Beta software</h2>
        <p>
          Sketchcast Community and Creator Cloud are pre-release software provided as-is, without
          warranties of any kind. Features may change, break, or disappear
          while we build. Download takes you care about; recordings are not
          recoverable by us. Locally stored takes can still be lost if browser
          storage is cleared.
        </p>

        <h2 className="pt-3 text-lg font-semibold tracking-[-0.02em] text-[#111116]">Your content</h2>
        <p>
          Everything you create with Sketchcast (recordings, boards, scripts,
          exports) is yours. We claim no rights to it. If you choose cloud
          sync, your browser encrypts project data before upload and we store
          only ciphertext. Recordings are not included in cloud sync.
        </p>

        <h2 className="pt-3 text-lg font-semibold tracking-[-0.02em] text-[#111116]">Recovery codes</h2>
        <p>
          Your cloud-sync recovery code is the encryption key. We do not receive
          or store it and cannot reset or recover it. Anyone who obtains the code
          may be able to decrypt that cloud project, so keep it private.
        </p>

        <h2 className="pt-3 text-lg font-semibold tracking-[-0.02em] text-[#111116]">Your API keys and costs</h2>
        <p>
          Bring-your-own-key features call AI providers using your keys and
          your accounts. You’re responsible for the usage costs those calls
          incur and for complying with each provider’s terms. We recommend
          creating a dedicated key for Sketchcast and setting a spend limit in
          your provider’s console.
        </p>

        <h2 className="pt-3 text-lg font-semibold tracking-[-0.02em] text-[#111116]">Creator Cloud billing</h2>
        <p>
          Paid subscriptions renew automatically at the interval and price shown
          at checkout until canceled. You can cancel through the account billing
          portal; access continues through the paid billing period unless Stripe
          indicates otherwise. Managed usage allowances reset monthly and do not
          roll over. Provider availability and reasonable limits may change as
          costs and the product evolve; material changes will be disclosed before
          they apply to a renewal.
        </p>

        <h2 className="pt-3 text-lg font-semibold tracking-[-0.02em] text-[#111116]">Acceptable use</h2>
        <p>
          Don’t use Sketchcast to create content that’s illegal or that
          violates the policies of the AI providers your keys belong to. Don’t
          attempt to disrupt, overload, or reverse the service’s security
          measures.
        </p>

        <h2 className="pt-3 text-lg font-semibold tracking-[-0.02em] text-[#111116]">Liability</h2>
        <p>
          To the maximum extent permitted by law, Sketchcast and its creator
          are not liable for any indirect, incidental, or consequential
          damages arising from use of the service, including lost recordings or
          API costs. Total liability is limited to the amount you paid for the
          service during the twelve months before the claim.
        </p>

        <h2 className="pt-3 text-lg font-semibold tracking-[-0.02em] text-[#111116]">Changes and contact</h2>
        <p>
          These terms may be updated as the product evolves;
          continued use after changes means acceptance. Questions:
          easyroadup@gmail.com.
        </p>
      </article>
    </div>
  );
}
