import crypto from "node:crypto";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { prisma } from "./prisma.js";

const NONCE_TTL_MS = 5 * 60 * 1000;

export function nonceMessage(nonce: string): string {
  return `Sign in to split.\nNonce: ${nonce}`;
}

export async function issueNonce(walletAddress: string): Promise<{
  nonce: string;
  message: string;
  expiresAt: Date;
}> {
  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS);
  await prisma.nonce.upsert({
    where: { walletAddress },
    create: { walletAddress, nonce, expiresAt },
    update: { nonce, expiresAt },
  });
  return { nonce, message: nonceMessage(nonce), expiresAt };
}

export async function consumeNonce(walletAddress: string): Promise<string | null> {
  const row = await prisma.nonce.findUnique({ where: { walletAddress } });
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.nonce.delete({ where: { walletAddress } }).catch(() => undefined);
    return null;
  }
  await prisma.nonce.delete({ where: { walletAddress } });
  return row.nonce;
}

export function verifySignature(
  walletAddress: string,
  message: string,
  signatureBase58: string,
): boolean {
  try {
    const pubkey = new PublicKey(walletAddress).toBytes();
    const signature = bs58.decode(signatureBase58);
    const messageBytes = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(messageBytes, signature, pubkey);
  } catch {
    return false;
  }
}
