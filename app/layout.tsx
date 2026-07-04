import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

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
  title: "Sketchcast Studio",
  description:
    "Whiteboard + webcam + teleprompter recording studio for educational creators. Type a concept, get a diagram, record, and export for every platform.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <Toaster theme="dark" richColors position="bottom-right" />
      </body>
    </html>
  );
}
