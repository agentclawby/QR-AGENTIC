import type { Metadata } from "next";
import { spaceGrotesk, inter, jetbrainsMono } from "@/lib/fonts";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "EMERGN. — Solana Identity Agents",
  description:
    "Create an AI agent from your X voice, bind it to a Solana wallet, issue an Agent Passport, and use it for human-approved content, consults, and portfolio intelligence.",
  keywords: ["AI agents", "Solana identity", "Agent Passport", "crypto", "on-chain identity", "EMRG"],
  openGraph: {
    title: "EMERGN. — Solana Identity Agents",
    description:
      "X voice import, Solana Agent Passport, content copilot, consults, credits, and portfolio intelligence.",
    type: "website",
    siteName: "EMERGN.",
    url: "https://emergn.org",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EMERGN. — Solana Identity Agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EMERGN. — Solana Identity Agents",
    description:
      "Create an agent, bind a Solana wallet, and issue its Agent Passport.",
    images: ["/og-image.png"],
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
