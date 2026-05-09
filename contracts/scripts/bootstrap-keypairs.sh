#!/usr/bin/env bash
# One-time bootstrap: generate the program keypair + deploy authority,
# patch declare_id!(), Anchor.toml, and the IDL with the new program id,
# and print the JSON byte arrays the user must paste into GitHub secrets.
#
# Re-run is safe — refuses to overwrite existing keypair files.

set -euo pipefail

if ! command -v solana-keygen >/dev/null; then
  echo "solana-keygen not found — install Solana CLI first:"
  echo "  sh -c \"\$(curl -sSfL https://release.solana.com/v1.18.18/install)\""
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP_DIR="${TMPDIR:-/tmp}/escros-bootstrap"
mkdir -p "$TMP_DIR"

PROGRAM_KP="$TMP_DIR/escros-program.json"
DEPLOY_KP="$TMP_DIR/escros-deploy.json"

if [ -f "$PROGRAM_KP" ] || [ -f "$DEPLOY_KP" ]; then
  echo "Keypairs already exist at $TMP_DIR — refusing to overwrite."
  echo "Delete them manually if you really want a fresh start."
  exit 1
fi

echo "→ Generating program keypair (its pubkey == program id)..."
solana-keygen new -o "$PROGRAM_KP" --no-bip39-passphrase --silent
PROGRAM_ID="$(solana-keygen pubkey "$PROGRAM_KP")"

echo "→ Generating deploy authority keypair..."
solana-keygen new -o "$DEPLOY_KP" --no-bip39-passphrase --silent
DEPLOY_PUBKEY="$(solana-keygen pubkey "$DEPLOY_KP")"

echo "→ Patching declare_id!() in programs/escrow/src/lib.rs..."
sed -i.bak -E "s|declare_id!\(\"[^\"]+\"\)|declare_id!(\"$PROGRAM_ID\")|" \
  "$ROOT/programs/escrow/src/lib.rs"
rm "$ROOT/programs/escrow/src/lib.rs.bak"

echo "→ Patching Anchor.toml [programs.localnet] + [programs.devnet]..."
sed -i.bak -E "s|escros_escrow = \"[^\"]+\"|escros_escrow = \"$PROGRAM_ID\"|" \
  "$ROOT/Anchor.toml"
rm "$ROOT/Anchor.toml.bak"

IDL_PATH="$ROOT/../backend/idl/escros_escrow.json"
if [ -f "$IDL_PATH" ]; then
  echo "→ Patching backend/idl/escros_escrow.json#address..."
  node -e "
    const fs = require('fs');
    const path = '$IDL_PATH';
    const idl = JSON.parse(fs.readFileSync(path, 'utf8'));
    idl.address = '$PROGRAM_ID';
    fs.writeFileSync(path, JSON.stringify(idl, null, 2) + '\n');
  "
fi

cat <<EOF

================================================================
Bootstrap complete.

Program ID:        $PROGRAM_ID
Deploy authority:  $DEPLOY_PUBKEY

Next steps:
  1. Fund the deploy authority on devnet (~5 SOL needed for first deploy):
     solana airdrop 2 $DEPLOY_PUBKEY -u devnet
     solana airdrop 2 $DEPLOY_PUBKEY -u devnet
     solana airdrop 1 $DEPLOY_PUBKEY -u devnet

  2. Add these as GitHub Actions repo secrets
     (Settings → Secrets and variables → Actions → New secret):

     SOLANA_PROGRAM_KEYPAIR
        $(cat "$PROGRAM_KP")

     SOLANA_DEPLOY_AUTHORITY
        $(cat "$DEPLOY_KP")

  3. Set the backend env (compose .env on the prod host):
     SOLANA_PROGRAM_ID=$PROGRAM_ID
     ARBITER_PUBLIC_KEY=<your arbiter pubkey>
     # Once you flip MOCK_CHAIN=false the backend will refuse to start
     # without these.

  4. Commit + push the patched files (lib.rs, Anchor.toml, IDL).

  5. Run the "Anchor Deploy (devnet)" GitHub Actions workflow.

The keypair files are still in $TMP_DIR; delete them after you've
saved the secrets, or store them somewhere safe yourself.
================================================================
EOF
