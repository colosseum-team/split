//! Escros — non-custodial freelance escrow on Solana.
//!
//! Lifecycle (lamports SOL only — SPL token support is a post-MVP follow-up):
//!
//!   `initialize` ── customer creates a per-contract escrow PDA carrying
//!                   the contract hash + agreed amount + parties. The PDA
//!                   itself is the vault; no separate ATA is needed.
//!   `fund`       ── customer transfers `amount` lamports from their
//!                   wallet into the escrow PDA. State -> Funded.
//!   `release`    ── customer signs a release; PDA lamports flow to the
//!                   performer. State -> Completed.
//!   `resolve_dispute` ─ arbiter (PDA's stored `arbiter` key) chooses
//!                       performer or customer; lamports flow accordingly.
//!                       State -> Resolved.
//!
//! The hash field is sha256 of the canonical contract JSON the backend
//! computes at `POST /contracts`; we store it on-chain as juridical proof
//! that the on-chain escrow corresponds to the off-chain text.
//!
//! Authority model is deliberately simple: the customer alone can release;
//! either party can open a dispute (off-chain, indexed by the backend); the
//! arbiter — a wallet whose pubkey is baked into the PDA on init — calls
//! `resolve_dispute` with the verdict. There is no time-lock yet; that's
//! a v2 feature once the basic flow is bullet-proof on devnet.

use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("9BQEARFHXQo3vpSwfcsRwYwbrbvfJ6XR52i5DzYyLWZA");

#[program]
pub mod escros_escrow {
    use super::*;

    /// Customer creates the escrow PDA. No funds move yet — that's `fund`.
    pub fn initialize(
        ctx: Context<Initialize>,
        contract_hash: [u8; 32],
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, EscrowError::ZeroAmount);

        let escrow = &mut ctx.accounts.escrow;
        escrow.customer = ctx.accounts.customer.key();
        escrow.performer = ctx.accounts.performer.key();
        escrow.arbiter = ctx.accounts.arbiter.key();
        escrow.contract_hash = contract_hash;
        escrow.amount = amount;
        escrow.state = EscrowState::Initialized;
        escrow.bump = ctx.bumps.escrow;
        Ok(())
    }

    /// Customer transfers `amount` lamports into the escrow PDA. The PDA is
    /// the vault — no SPL token account, no separate ATA. Once funded the
    /// PDA carries rent-exempt minimum + escrow.amount; `release` and
    /// `resolve_dispute` move only the `amount` portion, leaving the PDA
    /// closeable later (post-MVP).
    pub fn fund(ctx: Context<Fund>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(
            escrow.state == EscrowState::Initialized,
            EscrowError::WrongState
        );
        require_keys_eq!(
            ctx.accounts.customer.key(),
            escrow.customer,
            EscrowError::Unauthorized
        );

        let cpi = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.customer.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
            },
        );
        system_program::transfer(cpi, escrow.amount)?;

        escrow.state = EscrowState::Funded;
        Ok(())
    }

    /// Customer signs to release escrow funds to the performer.
    pub fn release(ctx: Context<Settle>) -> Result<()> {
        // Snapshot the fields we need (state, customer, performer, amount)
        // BEFORE taking &mut on the account — Rust's borrow checker forbids
        // simultaneous &mut and &T borrows of the same Account, and
        // move_lamports needs a fresh AccountInfo of the escrow.
        let state = ctx.accounts.escrow.state;
        let customer = ctx.accounts.escrow.customer;
        let performer = ctx.accounts.escrow.performer;
        let amount = ctx.accounts.escrow.amount;

        require!(state == EscrowState::Funded, EscrowError::WrongState);
        require_keys_eq!(
            ctx.accounts.signer.key(),
            customer,
            EscrowError::Unauthorized
        );
        require_keys_eq!(
            ctx.accounts.recipient.key(),
            performer,
            EscrowError::WrongRecipient
        );

        move_lamports(
            &ctx.accounts.escrow.to_account_info(),
            &ctx.accounts.recipient.to_account_info(),
            amount,
        )?;
        ctx.accounts.escrow.state = EscrowState::Completed;
        Ok(())
    }

    /// Arbiter resolves an open dispute. Outcome decides who receives the
    /// escrowed lamports. The off-chain dispute brief (QVAC verdict, human
    /// review, etc.) is auditable through the contract_hash + the arbiter
    /// signature on this transaction.
    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        outcome: DisputeOutcome,
    ) -> Result<()> {
        let state = ctx.accounts.escrow.state;
        let arbiter = ctx.accounts.escrow.arbiter;
        let performer = ctx.accounts.escrow.performer;
        let customer = ctx.accounts.escrow.customer;
        let amount = ctx.accounts.escrow.amount;

        require!(
            matches!(state, EscrowState::Funded | EscrowState::Disputed),
            EscrowError::WrongState
        );
        require_keys_eq!(
            ctx.accounts.arbiter.key(),
            arbiter,
            EscrowError::Unauthorized
        );

        let target_key = match outcome {
            DisputeOutcome::PerformerWon => performer,
            DisputeOutcome::CustomerWon => customer,
        };
        require_keys_eq!(
            ctx.accounts.recipient.key(),
            target_key,
            EscrowError::WrongRecipient
        );

        move_lamports(
            &ctx.accounts.escrow.to_account_info(),
            &ctx.accounts.recipient.to_account_info(),
            amount,
        )?;
        ctx.accounts.escrow.state = EscrowState::Resolved;
        ctx.accounts.escrow.dispute_outcome = Some(outcome);
        Ok(())
    }
}

/// PDA-aware lamport move. The escrow account is owned by this program, so
/// we may mutate its lamports directly; the recipient is a System Program
/// account, also writable.
fn move_lamports<'info>(
    from: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    let from_balance = from.lamports();
    require!(from_balance >= amount, EscrowError::InsufficientFunds);
    **from.try_borrow_mut_lamports()? = from_balance.checked_sub(amount).unwrap();
    **to.try_borrow_mut_lamports()? = to
        .lamports()
        .checked_add(amount)
        .ok_or(EscrowError::Overflow)?;
    Ok(())
}

// ─── Account contexts ────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(contract_hash: [u8; 32])]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = customer,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [b"escrow", customer.key().as_ref(), contract_hash.as_ref()],
        bump,
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub customer: Signer<'info>,

    /// Performer wallet — only the pubkey is stored on the account; the
    /// performer doesn't need to sign init.
    /// CHECK: only the pubkey is read.
    pub performer: AccountInfo<'info>,

    /// Arbiter wallet — fixed at init time; required to call
    /// `resolve_dispute` later. Pass the same key the off-chain backend
    /// uses for `ARBITER_PUBLIC_KEY`.
    /// CHECK: only the pubkey is read.
    pub arbiter: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Fund<'info> {
    #[account(
        mut,
        seeds = [b"escrow", customer.key().as_ref(), escrow.contract_hash.as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub customer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Settle<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.customer.as_ref(), escrow.contract_hash.as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,

    /// Customer signs `release`. We don't enforce signer here at the
    /// account-context level because Anchor would require `mut` for that;
    /// the program code does the customer-key check explicitly.
    #[account(mut)]
    pub signer: Signer<'info>,

    /// Recipient: must equal `escrow.performer` (verified in handler).
    /// CHECK: write target only — no data is read.
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.customer.as_ref(), escrow.contract_hash.as_ref()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,

    pub arbiter: Signer<'info>,

    /// CHECK: must equal escrow.performer or escrow.customer per outcome.
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
}

// ─── State ───────────────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub customer: Pubkey,
    pub performer: Pubkey,
    pub arbiter: Pubkey,
    pub contract_hash: [u8; 32],
    pub amount: u64,
    pub state: EscrowState,
    pub dispute_outcome: Option<DisputeOutcome>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum EscrowState {
    Initialized,
    Funded,
    Completed,
    Disputed,
    Resolved,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum DisputeOutcome {
    PerformerWon,
    CustomerWon,
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum EscrowError {
    #[msg("escrow amount must be > 0")]
    ZeroAmount,
    #[msg("escrow is not in the expected state for this instruction")]
    WrongState,
    #[msg("signer is not authorised for this instruction")]
    Unauthorized,
    #[msg("recipient does not match the address recorded on the escrow")]
    WrongRecipient,
    #[msg("escrow PDA balance is below the recorded amount (was it funded?)")]
    InsufficientFunds,
    #[msg("lamport arithmetic overflowed")]
    Overflow,
}
