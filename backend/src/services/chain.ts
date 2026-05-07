import { nanoid } from "nanoid";
import { config } from "../config.js";

export interface CreateEscrowParams {
  contractId: string;
  customer: string;
  assignee: string | null;
  amount: bigint;
  currency: string;
  contractHash: string;
}

export interface BuildTxResult {
  tx: string;
  escrowAddress: string;
}

export interface ResolveDisputeResult {
  txSignature: string;
}

export interface ChainService {
  readonly mode: "mock" | "solana";

  buildCreateEscrowTx(params: CreateEscrowParams): Promise<BuildTxResult>;
  buildFundTx(escrowAddress: string, signer: string): Promise<{ tx: string }>;
  buildApproveTx(escrowAddress: string, signer: string): Promise<{ tx: string }>;
  verifyTxSignature(signature: string): Promise<boolean>;

  resolveDispute(
    escrowAddress: string,
    verdict: "PERFORMER_WON" | "CLIENT_WON",
    arbiterSecretKey: Uint8Array,
  ): Promise<ResolveDisputeResult>;
}

interface MockEscrow {
  pda: string;
  customer: string;
  assignee: string | null;
  amount: bigint;
  contractHash: string;
  status: "initialized" | "funded" | "completed" | "resolved";
}

class MockChain implements ChainService {
  readonly mode = "mock" as const;
  private escrows = new Map<string, MockEscrow>();

  async buildCreateEscrowTx(params: CreateEscrowParams): Promise<BuildTxResult> {
    const pda = `mockPda_${nanoid(11)}`;
    this.escrows.set(pda, {
      pda,
      customer: params.customer,
      assignee: params.assignee,
      amount: params.amount,
      contractHash: params.contractHash,
      status: "initialized",
    });
    return { tx: `mockTx_create_${nanoid(8)}`, escrowAddress: pda };
  }

  async buildFundTx(escrowAddress: string): Promise<{ tx: string }> {
    const e = this.escrows.get(escrowAddress);
    if (e) e.status = "funded";
    return { tx: `mockTx_fund_${nanoid(8)}` };
  }

  async buildApproveTx(escrowAddress: string): Promise<{ tx: string }> {
    const e = this.escrows.get(escrowAddress);
    if (e) e.status = "completed";
    return { tx: `mockTx_approve_${nanoid(8)}` };
  }

  async verifyTxSignature(signature: string): Promise<boolean> {
    return signature.startsWith("mockTx_") || signature.length > 40;
  }

  async resolveDispute(
    escrowAddress: string,
    _verdict: "PERFORMER_WON" | "CLIENT_WON",
    _arbiterSecretKey: Uint8Array,
  ): Promise<ResolveDisputeResult> {
    const e = this.escrows.get(escrowAddress);
    if (e) e.status = "resolved";
    return { txSignature: `mockTx_resolve_${nanoid(8)}` };
  }
}

class SolanaChainStub implements ChainService {
  readonly mode = "solana" as const;
  async buildCreateEscrowTx(): Promise<BuildTxResult> {
    throw notImplemented("buildCreateEscrowTx");
  }
  async buildFundTx(): Promise<{ tx: string }> {
    throw notImplemented("buildFundTx");
  }
  async buildApproveTx(): Promise<{ tx: string }> {
    throw notImplemented("buildApproveTx");
  }
  async verifyTxSignature(): Promise<boolean> {
    throw notImplemented("verifyTxSignature");
  }
  async resolveDispute(): Promise<ResolveDisputeResult> {
    throw notImplemented("resolveDispute");
  }
}

function notImplemented(method: string) {
  return Object.assign(
    new Error(
      `SolanaChain.${method} not implemented yet — wire up Anchor IDL when contracts/ workspace ships`,
    ),
    { statusCode: 501 },
  );
}

export const chain: ChainService = config.MOCK_CHAIN
  ? new MockChain()
  : new SolanaChainStub();
