import { CtaButton } from './CtaButton'

const milestones = [
  {
    when: 'Now (MVP)',
    title: 'Devnet escrow',
    desc: 'Demo wallets, AI contract drafts, end-to-end flow on Solana devnet.',
    now: true,
  },
  {
    when: 'Q3 2026',
    title: 'Mainnet launch',
    desc: 'Real Solana wallet adapters — Phantom, Backpack — and production deploy.',
    now: false,
  },
  {
    when: 'Q4 2026',
    title: 'USDC + milestones',
    desc: 'Stablecoin support and milestone-based releases for longer engagements.',
    now: false,
  },
  {
    when: '2027',
    title: 'Disputes & reputation',
    desc: 'On-chain dispute resolution and reputation NFTs portable across platforms.',
    now: false,
  },
]

export function Roadmap() {
  return (
    <section id="roadmap" className="lp-section">
      <div className="lp-section-head">
        <span className="lp-section-eyebrow">Roadmap</span>
        <h2 className="lp-section-title">From hackathon to standard.</h2>
        <p className="lp-section-lead">
          We&apos;re shipping the smallest thing that pays a freelancer. Then stablecoins, then
          milestones, then reputation that travels with you.
        </p>
      </div>

      <div className="lp-roadmap">
        {milestones.map((m) => (
          <div key={m.when} className={`lp-roadmap-item${m.now ? ' now' : ''}`}>
            <div className="lp-roadmap-when">{m.when}</div>
            <h3 className="lp-roadmap-title">{m.title}</h3>
            <p className="lp-roadmap-desc">{m.desc}</p>
          </div>
        ))}
      </div>

      <div className="lp-final">
        <div className="lp-final-card">
          <h2 className="lp-section-title" style={{ marginBottom: 12 }}>
            Try it before mainnet ships.
          </h2>
          <p
            className="lp-section-lead"
            style={{ marginBottom: 24, maxWidth: 540, marginInline: 'auto' }}
          >
            The full flow runs on Solana devnet right now — no wallet install, no real funds, just
            the experience.
          </p>
          <CtaButton size="lg">Open the demo →</CtaButton>
        </div>
      </div>
    </section>
  )
}
