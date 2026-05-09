# contracts/

Anchor escrow program for the Escros freelance platform — non-custodial,
SOL-only (post-MVP: SPL tokens), arbiter-resolvable.

## Lifecycle

```
              ┌─────────────┐                       ┌──────────────┐
   customer → │ initialize  │ ───────────────────▶ │  Initialized │
              └─────────────┘                       └──────────────┘
                                                          │
              ┌─────────────┐                              ▼
   customer → │   fund      │ ───────────────────▶ │   Funded     │
              └─────────────┘                       └──────────────┘
                                                     │           │
              ┌─────────────┐                        ▼           │
   customer → │  release    │ ───────────────────▶ Completed     │
              └─────────────┘                                     │
                                                                  ▼
              ┌────────────────────┐               ┌──────────────────┐
   arbiter →  │ resolve_dispute    │ ────────────▶ │     Resolved     │
              └────────────────────┘               └──────────────────┘
```

PDA seeds: `["escrow", customer.pubkey, contract_hash[32]]`. The PDA
itself is the vault — no separate ATA, no SPL token (yet). The contract
hash is sha256 of the canonical contract JSON computed by the backend
on `POST /contracts`; storing it on-chain proves the escrow corresponds
to a specific off-chain text without uploading the text itself.

## Layout

```
contracts/
├── Anchor.toml                       Anchor workspace (program ids per cluster)
├── Cargo.toml                        Rust workspace
├── package.json                      pnpm/npm workspace member
├── programs/escrow/
│   ├── Cargo.toml
│   └── src/lib.rs                    `escros_escrow` program
├── scripts/
│   └── bootstrap-keypairs.sh         one-time keypair setup
└── README.md                         this file
```

The compiled IDL lives at `../backend/idl/escros_escrow.json` (committed
hand-written; CI overwrites with the canonical anchor-build output on
each deploy).

## One-time bootstrap

The program needs a deterministic keypair (its pubkey == program id)
and a deploy authority that pays for the .so storage rent. Run the
helper script on a host with the Solana CLI installed:

```sh
./contracts/scripts/bootstrap-keypairs.sh
```

It generates both keypairs in `/tmp/escros-bootstrap/`, patches:

- `programs/escrow/src/lib.rs` `declare_id!()`
- `Anchor.toml` `[programs.localnet]` + `[programs.devnet]`
- `backend/idl/escros_escrow.json` `address`

then prints the JSON byte arrays to paste into GitHub Actions secrets:

- `SOLANA_PROGRAM_KEYPAIR` — program keypair (its pubkey is the program id)
- `SOLANA_DEPLOY_AUTHORITY` — deploy authority wallet (needs ~5 SOL on devnet)

Finally airdrop SOL to the deploy authority:

```sh
solana airdrop 2 <DEPLOY_PUBKEY> -u devnet
solana airdrop 2 <DEPLOY_PUBKEY> -u devnet
solana airdrop 1 <DEPLOY_PUBKEY> -u devnet
```

(Devnet faucet rate-limits to 2 SOL per airdrop with 10 min cooldown,
so allow time to get the full ~5 SOL needed.)

Commit the patched files and trigger the **Anchor Deploy (devnet)**
GitHub Actions workflow. It restores the keypairs, runs `anchor build`,
deploys to devnet, syncs `target/idl/escros_escrow.json` back to
`backend/idl/`, and uploads the `.so` + IDL as workflow artifacts.

## Backend integration

`backend/src/services/chain-solana.ts` implements the `ChainService`
interface against this program. Toggle on:

```sh
# in the prod compose .env
MOCK_CHAIN=false
SOLANA_PROGRAM_ID=<program id from anchor deploy>
ARBITER_PUBLIC_KEY=<arbiter wallet base58>
ARBITER_AUTOEXECUTE=false                 # leave off until tested
```

The backend builds **unsigned** `VersionedTransaction`s (returned base64)
for `initialize`, `fund`, and `release`; the SPA wallet adapter signs
and submits, then POSTs the signature back to:

- `POST /contracts` — initialize tx is returned in the response
- `POST /contracts/:id/fund-tx` — get the unsigned fund instruction
- `POST /contracts/:id/fund` — record the signed+submitted signature
- `POST /contracts/:id/release-tx` — get the unsigned release instruction
- `POST /contracts/:id/approve` — record the signed+submitted signature

`resolveDispute` is the only path the backend signs itself, gated by
`ARBITER_AUTOEXECUTE=true` + a populated `ARBITER_PRIVATE_KEY`.

## Testing

Anchor tests live under `tests/`. Run against a local validator:

```sh
cd contracts
anchor test
```

(Currently no tests committed — add as needed.)

## Mainnet

Not in scope for the hackathon. The compose stack defaults to
`MOCK_CHAIN=true`; flip to devnet for demo, mainnet would need
audited program + multisig deploy authority + real-token vaults.
