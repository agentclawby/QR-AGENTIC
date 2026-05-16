import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  SOLANA_AUTH_NONCE_COOKIE,
  SOLANA_AUTH_NONCE_MAX_AGE_SECONDS,
  getSolanaAuthCookieOptions,
} from "@/lib/auth/solana-auth";

export async function GET() {
  const nonce = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + SOLANA_AUTH_NONCE_MAX_AGE_SECONDS * 1000
  ).toISOString();

  const response = NextResponse.json({ nonce, expiresAt });
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(
    SOLANA_AUTH_NONCE_COOKIE,
    nonce,
    getSolanaAuthCookieOptions()
  );

  return response;
}
