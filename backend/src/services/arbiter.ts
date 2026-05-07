import type { Contract } from "@prisma/client";
import { config } from "../config.js";
import { chain } from "./chain.js";

export interface OnChainResult {
  executed: boolean;
  txSignature: string | null;
  reason: string | null;
}

let arbiterSecret: Uint8Array | null | undefined;

function loadArbiterSecret(): Uint8Array | null {
  if (arbiterSecret !== undefined) return arbiterSecret;
  const raw = config.ARBITER_PRIVATE_KEY;
  if (!raw) {
    arbiterSecret = null;
    return null;
  }
  try {
    if (raw.trim().startsWith("[")) {
      const arr = JSON.parse(raw) as number[];
      arbiterSecret = Uint8Array.from(arr);
      return arbiterSecret;
    }
    arbiterSecret = new Uint8Array(Buffer.from(raw, "base64"));
    return arbiterSecret;
  } catch {
    arbiterSecret = null;
    return null;
  }
}

export async function executeOnChainResolve(
  contract: Contract,
  outcome: "PERFORMER_WON" | "CLIENT_WON" | "INCONCLUSIVE",
): Promise<OnChainResult> {
  if (!config.ARBITER_AUTOEXECUTE) {
    return { executed: false, txSignature: null, reason: "auto-execute disabled" };
  }
  if (outcome === "INCONCLUSIVE") {
    return {
      executed: false,
      txSignature: null,
      reason: "inconclusive outcome — manual review required",
    };
  }
  const secret = loadArbiterSecret();
  if (!secret) {
    return {
      executed: false,
      txSignature: null,
      reason: "ARBITER_PRIVATE_KEY missing or invalid",
    };
  }
  if (!contract.onchainAddress) {
    return {
      executed: false,
      txSignature: null,
      reason: "contract has no on-chain escrow address",
    };
  }
  try {
    const result = await chain.resolveDispute(
      contract.onchainAddress,
      outcome,
      secret,
    );
    return { executed: true, txSignature: result.txSignature, reason: null };
  } catch (err) {
    return {
      executed: false,
      txSignature: null,
      reason: err instanceof Error ? err.message : "chain error",
    };
  }
}
