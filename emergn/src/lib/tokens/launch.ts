import { Keypair } from "@solana/web3.js";

export type TokenLaunchProvider = "pumpportal" | "direct_spl";

export interface PreparePumpPortalLaunchInput {
  walletPublicKey: string;
  mintPublicKey: string;
  tokenName: string;
  tokenSymbol: string;
  description: string;
  website?: string;
  twitter?: string;
  telegram?: string;
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
      `Unsupported image type: ${mime}. Allowed: png, jpeg, webp, gif.`
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

async function uploadToPinata(file: File, pinataJwt: string) {
  const formData = new FormData();
  formData.append("network", "public");
  formData.append("file", file);

  const response = await fetch("https://uploads.pinata.cloud/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJwt}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Pinata upload failed: ${message || response.statusText}`);
  }

  const payload = (await response.json()) as { data?: { cid?: string } };
  const cid = payload.data?.cid;
  if (!cid) {
    throw new Error("Pinata upload did not return a CID");
  }

  return `https://ipfs.io/ipfs/${cid}`;
}

async function uploadMetadata(options: {
  pinataJwt: string;
  tokenName: string;
  tokenSymbol: string;
  description: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  imageUri: string;
}) {
  const metadata = {
    name: options.tokenName,
    symbol: options.tokenSymbol,
    image: options.imageUri,
    description: options.description,
    twitter: options.twitter ?? "",
    telegram: options.telegram ?? "",
    website: options.website ?? "",
  };

  const metadataFile = new File(
    [JSON.stringify(metadata)],
    `${options.tokenSymbol.toLowerCase()}-metadata.json`,
    { type: "application/json" }
  );

  return uploadToPinata(metadataFile, options.pinataJwt);
}

export async function preparePumpPortalLaunch(
  input: PreparePumpPortalLaunchInput
) {
  const apiKey = process.env.PUMPPORTAL_API_KEY;
  const pinataJwt = process.env.PINATA_JWT;

  if (!apiKey) {
    throw new Error("PUMPPORTAL_API_KEY is not configured");
  }

  if (!pinataJwt) {
    throw new Error("PINATA_JWT is not configured");
  }

  const imageFile = dataUrlToFile(
    input.imageDataUrl,
    `${input.tokenSymbol.toLowerCase()}-token.png`
  );
  const imageUri = await uploadToPinata(imageFile, pinataJwt);
  const metadataUri = await uploadMetadata({
    pinataJwt,
    tokenName: input.tokenName,
    tokenSymbol: input.tokenSymbol,
    description: input.description,
    website: input.website,
    twitter: input.twitter,
    telegram: input.telegram,
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
    throw new Error(`PumpPortal prepare failed: ${message || response.statusText}`);
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
