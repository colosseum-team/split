/**
 * Real on-chain ChainService for the Escros escrow Anchor program.
 *
 * Build philosophy: backend never holds user funds. It builds *unsigned*
 * VersionedTransactions, base64-encodes them, and the frontend wallet
 * adapter signs and submits. The backend then indexes the resulting
 * signature when the user calls /contracts/:id/fund or /approve.
 *
 * The arbiter dispute path is the one exception: when ARBITER_AUTOEXECUTE
 * is on, the backend itself signs and submits ResolveDispute using the
 * configured ARBITER_PRIVATE_KEY. That key is the same pubkey that was
 * baked into the escrow PDA at init time.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  type Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import anchorPkg from '@coral-xyz/anchor'
import type { Idl, Wallet, Program as ProgramType } from '@coral-xyz/anchor'
// @coral-xyz/anchor publishes as CommonJS; in ESM consumers we must default-
// import the namespace and pluck the symbols out, otherwise Node 22 throws
// "Named export 'BN' not found" at module instantiation. Types still come
// in as named-type-imports (zero runtime cost).
const { AnchorProvider, BN, Program } = anchorPkg
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { config } from '../config.js'
import type {
  BuildTxResult,
  ChainService,
  CreateEscrowParams,
  ResolveDisputeResult,
} from './chain.js'

const ESCROW_SEED = Buffer.from('escrow')

/**
 * Lazily load the IDL JSON committed under backend/idl/. The CI build
 * overwrites this file post-anchor-build with the canonical IDL, but the
 * hand-written copy is good enough to construct instructions for
 * `initialize`, `fund`, `release`, `resolve_dispute` and matches the
 * shape of `programs/escrow/src/lib.rs`.
 */
function loadIdl(programId: PublicKey): Idl {
  const here = dirname(fileURLToPath(import.meta.url))
  // services/ → src/ → backend/ → backend/idl/
  const idlPath = resolve(here, '../../idl/escros_escrow.json')
  const raw = readFileSync(idlPath, 'utf8')
  const idl = JSON.parse(raw) as Idl & { address?: string }
  return { ...idl, address: programId.toBase58() } as Idl
}

/** Read-only signer used to satisfy AnchorProvider; backend never sends with it. */
class ReadOnlyWallet implements Wallet {
  readonly payer: Keypair
  constructor(public publicKey: PublicKey) {
    this.payer = Keypair.generate() // placeholder — not used
  }
  async signTransaction<T extends Transaction | VersionedTransaction>(_tx: T): Promise<T> {
    throw new Error('ReadOnlyWallet cannot sign — backend builds unsigned txs only')
  }
  async signAllTransactions<T extends Transaction | VersionedTransaction>(
    _txs: T[],
  ): Promise<T[]> {
    throw new Error('ReadOnlyWallet cannot sign — backend builds unsigned txs only')
  }
}

function decodeContractHash(hex: string): Buffer {
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(`contractHash must be a 32-byte hex string; got ${hex.length} chars`)
  }
  return Buffer.from(hex, 'hex')
}

function deriveEscrowPda(
  programId: PublicKey,
  customer: PublicKey,
  contractHash: Buffer,
): { pda: PublicKey; bump: number } {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [ESCROW_SEED, customer.toBuffer(), contractHash],
    programId,
  )
  return { pda, bump }
}

import type { TransactionInstruction } from '@solana/web3.js'

async function buildVersionedTx(
  connection: Connection,
  payer: PublicKey,
  ix: TransactionInstruction,
): Promise<VersionedTransaction> {
  const { blockhash } = await connection.getLatestBlockhash('confirmed')
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions: [ix],
  }).compileToV0Message()
  return new VersionedTransaction(message)
}

function loadArbiterKeypair(secret: string): Keypair {
  if (secret.trim().startsWith('[')) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret)))
  }
  return Keypair.fromSecretKey(Buffer.from(secret, 'base64'))
}

export class SolanaChain implements ChainService {
  readonly mode = 'solana' as const

  private readonly connection: Connection
  private readonly programId: PublicKey
  private readonly arbiterPubkey: PublicKey
  private programInstance: ProgramType | null = null

  constructor() {
    if (!config.SOLANA_PROGRAM_ID) {
      throw new Error('SOLANA_PROGRAM_ID is required when MOCK_CHAIN=false')
    }
    if (!config.ARBITER_PUBLIC_KEY) {
      throw new Error('ARBITER_PUBLIC_KEY is required when MOCK_CHAIN=false')
    }
    this.connection = new Connection(config.SOLANA_RPC_URL, 'confirmed')
    this.programId = new PublicKey(config.SOLANA_PROGRAM_ID)
    this.arbiterPubkey = new PublicKey(config.ARBITER_PUBLIC_KEY)
  }

  /**
   * Anchor's typed `Program` requires a generated IDL TS type; we use a
   * hand-rolled JSON IDL here so we cast to `any` on the methods proxy
   * to call instructions by name. Once the CI build emits the real IDL
   * + .ts the cast can be removed.
   */
  private program(payer: PublicKey): ProgramType {
    if (this.programInstance) return this.programInstance
    const provider = new AnchorProvider(
      this.connection,
      new ReadOnlyWallet(payer),
      AnchorProvider.defaultOptions(),
    )
    const idl = loadIdl(this.programId)
    this.programInstance = new Program(idl, provider)
    return this.programInstance
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private methods(payer: PublicKey): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.program(payer).methods as any)
  }

  async buildCreateEscrowTx(params: CreateEscrowParams): Promise<BuildTxResult> {
    if (!params.assignee) {
      throw new Error('SolanaChain.buildCreateEscrowTx requires a performer wallet (assignee)')
    }
    const customer = new PublicKey(params.customer)
    const performer = new PublicKey(params.assignee)
    const contractHash = decodeContractHash(params.contractHash)
    const { pda } = deriveEscrowPda(this.programId, customer, contractHash)

    const ix = await this.methods(customer)
      .initialize(Array.from(contractHash), new BN(params.amount.toString()))
      .accounts({
        escrow: pda,
        customer,
        performer,
        arbiter: this.arbiterPubkey,
        systemProgram: SystemProgram.programId,
      })
      .instruction()

    const tx = await buildVersionedTx(this.connection, customer, ix)
    return {
      tx: Buffer.from(tx.serialize()).toString('base64'),
      escrowAddress: pda.toBase58(),
    }
  }

  async buildFundTx(escrowAddress: string, signer: string): Promise<{ tx: string }> {
    const customer = new PublicKey(signer)
    const escrow = new PublicKey(escrowAddress)
    const ix = await this.methods(customer)
      .fund()
      .accounts({
        escrow,
        customer,
        systemProgram: SystemProgram.programId,
      })
      .instruction()
    const tx = await buildVersionedTx(this.connection, customer, ix)
    return { tx: Buffer.from(tx.serialize()).toString('base64') }
  }

  async buildApproveTx(escrowAddress: string, signer: string): Promise<{ tx: string }> {
    const customer = new PublicKey(signer)
    const escrow = new PublicKey(escrowAddress)

    // Fetch the escrow PDA to learn the performer pubkey — we need it as
    // the recipient on `release`. Anchor exposes typed account fetch.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accountClient = (this.program(customer).account as any).escrow
    const escrowAccount = (await accountClient.fetch(escrow)) as { performer: PublicKey }

    const ix = await this.methods(customer)
      .release()
      .accounts({
        escrow,
        signer: customer,
        recipient: escrowAccount.performer,
      })
      .instruction()
    const tx = await buildVersionedTx(this.connection, customer, ix)
    return { tx: Buffer.from(tx.serialize()).toString('base64') }
  }

  async verifyTxSignature(signature: string): Promise<boolean> {
    try {
      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      })
      if (!tx) return false
      if (tx.meta?.err) return false
      // Confirm the transaction touched the escrow program — defends
      // against signatures from unrelated transactions.
      const programIdStr = this.programId.toBase58()
      const keys = tx.transaction.message
        .getAccountKeys({ accountKeysFromLookups: tx.meta?.loadedAddresses ?? undefined })
        .keySegments()
        .flat()
      return keys.some((k) => k.toBase58() === programIdStr)
    } catch {
      return false
    }
  }

  async resolveDispute(
    escrowAddress: string,
    verdict: 'PERFORMER_WON' | 'CLIENT_WON',
    arbiterSecretKey: Uint8Array,
  ): Promise<ResolveDisputeResult> {
    const arbiter = Keypair.fromSecretKey(arbiterSecretKey)
    const escrow = new PublicKey(escrowAddress)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accountClient = (this.program(arbiter.publicKey).account as any).escrow
    const account = (await accountClient.fetch(escrow)) as {
      performer: PublicKey
      customer: PublicKey
    }
    const recipient =
      verdict === 'PERFORMER_WON' ? account.performer : account.customer

    const outcome =
      verdict === 'PERFORMER_WON' ? { performerWon: {} } : { customerWon: {} }

    const ix = await this.methods(arbiter.publicKey)
      .resolveDispute(outcome)
      .accounts({
        escrow,
        arbiter: arbiter.publicKey,
        recipient,
      })
      .instruction()

    const { blockhash } = await this.connection.getLatestBlockhash('confirmed')
    const message = new TransactionMessage({
      payerKey: arbiter.publicKey,
      recentBlockhash: blockhash,
      instructions: [ix],
    }).compileToV0Message()
    const tx = new VersionedTransaction(message)
    tx.sign([arbiter])

    const txSignature = await this.connection.sendTransaction(tx, { skipPreflight: false })
    await this.connection.confirmTransaction(
      { signature: txSignature, blockhash, lastValidBlockHeight: (await this.connection.getLatestBlockhash()).lastValidBlockHeight },
      'confirmed',
    )
    return { txSignature }
  }
}

// Re-export the loadArbiterKeypair helper for service/arbiter.ts consumption
// without forcing it to know about Solana types.
export { loadArbiterKeypair }
