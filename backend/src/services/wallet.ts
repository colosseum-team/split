import { PublicKey } from "@solana/web3.js";

export function isValidWallet(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function assertWallet(address: string): string {
  if (!isValidWallet(address)) {
    throw Object.assign(new Error("invalid Solana wallet address"), {
      statusCode: 400,
      code: "INVALID_WALLET",
    });
  }
  return address;
}
