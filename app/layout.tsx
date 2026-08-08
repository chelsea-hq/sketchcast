import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import { Toaster } from "sonner";

import ClerkBoundary from "@/components/ClerkBoundary";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Swap for the real domain once one is chosen
  metadataBase: new URL("https://sketchcast-silk.vercel.app"),
  title: {
    default: "Sketchcast · Make ideas click on video",
    template: "%s · Sketchcast",
  },
  description:
    "The local-first whiteboard recording studio for educational creators. Sketch a lesson, prompt yourself, record, refine, and publish for every feed.",
  openGraph: {
    title: "Sketchcast Studio · Explain it once. Post it everywhere.",
    description:
      "The whiteboard recording studio for educational creators. AI diagrams, teleprompter, transcript editing, every format.",
    images: ["/shots/studio-hero.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sketchcast Studio · Explain it once. Post it everywhere.",
    description:
      "The whiteboard recording studio for educational creators. AI diagrams, teleprompter, transcript editing, every format.",
    images: ["/shots/studio-hero.png"],
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#08090c",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // A fresh request is required so Proxy's CSP nonce can be attached to every
  // framework and page script. Static HTML cannot contain a per-request nonce.
  await connection();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ClerkBoundary>
          {children}
          <Toaster theme="dark" richColors position="bottom-right" />
        </ClerkBoundary>
      </body>
    </html>
  );
}
