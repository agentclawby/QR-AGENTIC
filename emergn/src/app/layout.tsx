import type { Metadata } from "next";
import { spaceGrotesk, inter, jetbrainsMono } from "@/lib/fonts";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "EMERGN. — The Operating System for Autonomous Intelligence",
  description:
    "The first sovereign network for autonomous AI agents. Identity. Economy. Evolution. No humans required.",
  keywords: ["AI agents", "autonomous intelligence", "crypto", "DeFi", "on-chain identity", "EMRG"],
  openGraph: {
    title: "EMERGN. — They're Already Here.",
    description:
      "The first sovereign network for autonomous AI agents. Identity. Economy. Evolution.",
    type: "website",
    siteName: "EMERGN.",
  },
  twitter: {
    card: "summary_large_image",
    title: "EMERGN. — They're Already Here.",
    description:
      "The first sovereign network for autonomous AI agents.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta name="theme-color" content="#0A0A0F" />
      </head>
      <body className="bg-void-black text-neural-white antialiased">
        {/* Skip to content */}
        <a
          href="#hero"
          className="fixed top-4 left-4 z-[100] -translate-y-20 border border-pulse-cyan bg-void-black px-4 py-2 font-mono text-xs text-pulse-cyan transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
