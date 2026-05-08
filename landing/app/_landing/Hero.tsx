import { CtaButton } from './CtaButton'

const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL ?? 'https://github.com/colosseum-team/split'

export function Hero() {
  return (
    <section id="top" className="lp-hero">
      <div className="lp-hero-inner">
        <span className="lp-eyebrow">
          <span className="lp-eyebrow-dot" aria-hidden="true" />
          Built on Solana
        </span>

        <h1 className="lp-headline">Freelance contracts that pay themselves.</h1>

        <p className="lp-subhead">
          Non-custodial escrow for clients and freelancers. Lock funds in a Solana smart contract,
          release them on delivery, pay fractions of a cent in fees. No middleman.
        </p>

        <div className="lp-hero-actions">
          <CtaButton size="lg">Try the demo →</CtaButton>
          <a
            className="lp-cta ghost lg"
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>

        <div className="lp-trust-strip" aria-label="Why it's different">
          <span className="lp-pill">
            <strong>&lt; $0.50</strong> total fees
          </span>
          <span className="lp-pill">
            <strong>Funds in escrow</strong>, not on a platform
          </span>
          <span className="lp-pill">
            <strong>AI-drafted</strong> contracts in plain English
          </span>
        </div>
      </div>
    </section>
  )
}
