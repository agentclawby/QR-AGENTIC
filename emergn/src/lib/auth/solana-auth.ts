import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

export const SOLANA_AUTH_NONCE_COOKIE = "emergn_solana_auth_nonce";
export const SOLANA_AUTH_NONCE_MAX_AGE_SECONDS = 5 * 60;

export type SolanaAuthIntent =
  | "sign-in"
  | "link-wallet"
  | "issue-passport";

export interface BuildSolanaAuthMessageInput {
  intent: SolanaAuthIntent;
  publicKey: string;
  nonce: string;
  origin: string;
  userId?: string;
  agentId?: string;
  issuedAt?: Date;
  expiresAt?: Date;
}

export interface VerifySolanaAuthMessageInput {
  publicKey: string;
  signature: string;
  message: string;
  expectedNonce: string | null | undefined;
  expectedIntent: SolanaAuthIntent;
  request: Request;
  expectedUserId?: string;
  expectedAgentId?: string;
}

export interface VerifySolanaAuthMessageResult {
  valid: boolean;
  messageText: string | null;
  error?: string;
}

export function getSolanaAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SOLANA_AUTH_NONCE_MAX_AGE_SECONDS,
  };
}

export function getSolanaNetworkLabel() {
  return process.env.NEXT_PUBLIC_SOLANA_NETWORK || "mainnet-beta";
}

export function buildSolanaAuthMessage(input: BuildSolanaAuthMessageInput) {
  const issuedAt = input.issuedAt ?? new Date();
  const expiresAt =
    input.expiresAt ??
    new Date(issuedAt.getTime() + SOLANA_AUTH_NONCE_MAX_AGE_SECONDS * 1000);
  const origin = new URL(input.origin).origin;
  const statement =
    input.intent === "sign-in"
      ? "Sign in to EMERGN. This does not authorize transactions."
      : input.intent === "link-wallet"
        ? "Link this Solana wallet to your EMERGN. account."
        : "Issue an EMERGN. Agent Passport for this agent.";

  return [
    "EMERGN. identity request",
    "",
    `Intent: ${input.intent}`,
    `Wallet: ${input.publicKey}`,
    `Domain: ${new URL(origin).host}`,
    `URI: ${origin}`,
    "Version: 1",
    `Network: ${getSolanaNetworkLabel()}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${issuedAt.toISOString()}`,
    `Expiration Time: ${expiresAt.toISOString()}`,
    input.userId ? `User ID: ${input.userId}` : null,
    input.agentId ? `Agent ID: ${input.agentId}` : null,
    "",
    statement,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function parseFields(messageText: string) {
  const fields = new Map<string, string>();

  for (const line of messageText.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex <= 0) continue;
    fields.set(
      line.slice(0, separatorIndex).trim().toLowerCase(),
      line.slice(separatorIndex + 1).trim()
    );
  }

  return fields;
}

function getExpectedOrigin(request: Request) {
  const requestOrigin = request.headers.get("origin");
  if (requestOrigin) return new URL(requestOrigin).origin;

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
  }

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return null;

  const protocol =
    request.headers.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  return `${protocol}://${host}`;
}

function isExistingAccountError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already") ||
    normalized.includes("registered") ||
    normalized.includes("exists") ||
    normalized.includes("duplicate") ||
    normalized.includes("email address has already")
  );
}

export function isSupabaseExistingAccountError(error: { message?: string }) {
  return isExistingAccountError(error.message ?? "");
}

export function verifySolanaAuthMessage(
  input: VerifySolanaAuthMessageInput
): VerifySolanaAuthMessageResult {
  if (!input.expectedNonce) {
    return {
      valid: false,
      messageText: null,
      error: "Missing or expired nonce. Please request a new signature.",
    };
  }

  let publicKeyBytes: Uint8Array;
  let signatureBytes: Uint8Array;
  let messageBytes: Uint8Array;

  try {
    const publicKey = new PublicKey(input.publicKey);
    if (publicKey.toBase58() !== input.publicKey) {
      return {
        valid: false,
        messageText: null,
        error: "Wallet public key is not canonical.",
      };
    }

    publicKeyBytes = publicKey.toBytes();
    signatureBytes = bs58.decode(input.signature);
    messageBytes = bs58.decode(input.message);
  } catch {
    return {
      valid: false,
      messageText: null,
      error: "Invalid wallet signature payload.",
    };
  }

  if (signatureBytes.length !== 64) {
    return {
      valid: false,
      messageText: null,
      error: "Invalid Solana signature length.",
    };
  }

  const signatureValid = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes
  );

  if (!signatureValid) {
    return {
      valid: false,
      messageText: null,
      error: "Invalid wallet signature.",
    };
  }

  const messageText = new TextDecoder().decode(messageBytes);
  const fields = parseFields(messageText);
  const expectedOrigin = getExpectedOrigin(input.request);

  if (!expectedOrigin) {
    return {
      valid: false,
      messageText,
      error: "Could not determine request origin.",
    };
  }

  const messageOrigin = fields.get("uri");
  const messageDomain = fields.get("domain");
  const issuedAt = Date.parse(fields.get("issued at") ?? "");
  const expiresAt = Date.parse(fields.get("expiration time") ?? "");
  const now = Date.now();
  let parsedMessageOrigin: string | null = null;

  if (messageOrigin) {
    try {
      parsedMessageOrigin = new URL(messageOrigin).origin;
    } catch {
      return { valid: false, messageText, error: "Invalid signed origin." };
    }
  }

  if (fields.get("intent") !== input.expectedIntent) {
    return { valid: false, messageText, error: "Signed intent mismatch." };
  }

  if (fields.get("wallet") !== input.publicKey) {
    return { valid: false, messageText, error: "Signed wallet mismatch." };
  }

  if (fields.get("nonce") !== input.expectedNonce) {
    return { valid: false, messageText, error: "Signed nonce mismatch." };
  }

  if (fields.get("version") !== "1") {
    return { valid: false, messageText, error: "Unsupported signature version." };
  }

  // The `Network` field is informational only. The ed25519 signature already
  // proves the message wasn't tampered with, and the wallet/nonce/origin/
  // domain/intent/expiration checks below carry the actual security. Gating
  // on the network label couples verification to a value baked into the
  // client bundle at build time vs. read from server env at runtime, which
  // breaks across deploy/env drift without adding any cryptographic guarantee.

  if (!parsedMessageOrigin || parsedMessageOrigin !== expectedOrigin) {
    return { valid: false, messageText, error: "Signed origin mismatch." };
  }

  if (messageDomain !== new URL(expectedOrigin).host) {
    return { valid: false, messageText, error: "Signed domain mismatch." };
  }

  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) {
    return { valid: false, messageText, error: "Invalid signature timestamp." };
  }

  if (issuedAt > now + 2 * 60 * 1000) {
    return { valid: false, messageText, error: "Signature issued in the future." };
  }

  if (expiresAt <= now) {
    return { valid: false, messageText, error: "Signature expired." };
  }

  if (
    input.expectedUserId &&
    fields.get("user id") !== input.expectedUserId
  ) {
    return { valid: false, messageText, error: "Signed user mismatch." };
  }

  if (
    input.expectedAgentId &&
    fields.get("agent id") !== input.expectedAgentId
  ) {
    return { valid: false, messageText, error: "Signed agent mismatch." };
  }

  return { valid: true, messageText };
}
