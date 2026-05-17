import { Keypair } from "@solana/web3.js";

export type TokenLaunchProvider = "pumpportal" | "direct_spl";

export interface PrepareAgentTokenLaunchInput {
  walletPublicKey: string;
  mintPublicKey: string;
  tokenName: string;
  tokenSymbol: string;
  description: string;
  imageDataUrl: string;
  devBuySol: number;
}

const ALLOWED_IMAGE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

export class LaunchImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LaunchImageValidationError";
  }
}

function getEmergnBranding() {
  const website = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return {
    twitter: process.env.NEXT_PUBLIC_EMERGN_X_HANDLE ?? "",
    website,
    createdOn: website,
  };
}

function dataUrlToFile(dataUrl: string, fileName: string) {
  const [meta, base64] = dataUrl.split(",");
  const mimeMatch = meta?.match(/^data:(.+?);base64$/);
  if (!mimeMatch || !base64) {
    throw new LaunchImageValidationError(
      "Token image must be a base64 data URL"
    );
  }

  const mime = mimeMatch[1].toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    throw new LaunchImageValidationError(
      `Token image type is not supported: ${mime}. Allowed: png, jpeg, webp, gif.`
    );
  }

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) {
    throw new LaunchImageValidationError("Token image is empty");
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new LaunchImageValidationError(
      `Token image exceeds ${MAX_IMAGE_BYTES / 1024 / 1024} MB limit`
    );
  }

  return new File([buffer], fileName, { type: mime });
}

async function uploadMetadataAsset(file: File, jwt: string) {
  const formData = new FormData();
  formData.append("network", "public");
  formData.append("file", file);

  const response = await fetch("https://uploads.pinata.cloud/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    console.error("Token metadata asset upload failed:", message || response.statusText);
    throw new Error("Token metadata upload failed");
  }

  const payload = (await response.json()) as { data?: { cid?: string } };
  const cid = payload.data?.cid;
  if (!cid) {
    throw new Error("Token metadata upload returned no CID");
  }

  return `https://ipfs.io/ipfs/${cid}`;
}

async function uploadMetadata(options: {
  jwt: string;
  tokenName: string;
  tokenSymbol: string;
  description: string;
  imageUri: string;
}) {
  const branding = getEmergnBranding();
  const metadata = {
    name: options.tokenName,
    symbol: options.tokenSymbol,
    image: options.imageUri,
    description: options.description,
    twitter: branding.twitter,
    website: branding.website,
    createdOn: branding.createdOn,
  };

  const metadataFile = new File(
    [JSON.stringify(metadata)],
    `${options.tokenSymbol.toLowerCase()}-metadata.json`,
    { type: "application/json" }
  );

  return uploadMetadataAsset(metadataFile, options.jwt);
}

export async function prepareAgentTokenLaunch(
  input: PrepareAgentTokenLaunchInput
) {
  const apiKey = process.env.PUMPPORTAL_API_KEY;
  const metadataJwt = process.env.PINATA_JWT;

  if (!apiKey) {
    throw new Error("Token launch is not configured");
  }

  if (!metadataJwt) {
    throw new Error("Token launch is not configured");
  }

  const imageFile = dataUrlToFile(
    input.imageDataUrl,
    `${input.tokenSymbol.toLowerCase()}-token.png`
  );
  const imageUri = await uploadMetadataAsset(imageFile, metadataJwt);
  const metadataUri = await uploadMetadata({
    jwt: metadataJwt,
    tokenName: input.tokenName,
    tokenSymbol: input.tokenSymbol,
    description: input.description,
    imageUri,
  });

  const response = await fetch("https://pumpportal.fun/api/trade-local", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      publicKey: input.walletPublicKey,
      action: "create",
      tokenMetadata: {
        name: input.tokenName,
        symbol: input.tokenSymbol,
        uri: metadataUri,
      },
      mint: input.mintPublicKey,
      denominatedInSol: "true",
      amount: input.devBuySol,
      slippage: 15,
      priorityFee: 0.00005,
      pool: "pump",
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    console.error("Agent token launch preparation failed:", message || response.statusText);
    throw new Error("Agent token launch preparation failed");
  }

  const arrayBuffer = await response.arrayBuffer();

  return {
    metadataUri,
    serializedTransactionBase64: Buffer.from(arrayBuffer).toString("base64"),
  };
}

export function createTokenLaunchCanaryList() {
  const raw = process.env.TOKEN_LAUNCH_ALLOWLIST?.trim();
  if (!raw || raw === "*") {
    return { open: raw === "*", entries: [] as string[] };
  }

  const entries = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return { open: false, entries };
}

export function isTokenLaunchAllowed(walletAddress: string | null) {
  const allowlist = createTokenLaunchCanaryList();
  if (allowlist.open) return true;
  if (!walletAddress) return false;
  return allowlist.entries.includes(walletAddress);
}

export function generateClientMintSecretKey() {
  return Array.from(Keypair.generate().secretKey);
}
