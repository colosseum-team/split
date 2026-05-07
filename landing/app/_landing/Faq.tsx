const faq = [
  {
    q: "Is this real money or a demo?",
    a: "The MVP runs on Solana devnet with stub wallets — no real funds at risk. Mainnet launch ships in Q3 2026.",
  },
  {
    q: "Do I need a Solana wallet?",
    a: "For the demo, no — we provide stub wallets so you can walk through the entire flow in 60 seconds. For mainnet, yes (Phantom or Backpack).",
  },
  {
    q: "What if the client never confirms delivery?",
    a: "A built-in dispute window auto-releases or refunds based on a configurable timeout, so funds never get stuck.",
  },
  {
    q: "How much does it actually cost?",
    a: "A typical $1k–$10k contract costs under $0.50 in total Solana network fees, end to end. There is no platform fee on top.",
  },
  {
    q: "Who holds the money?",
    a: "Nobody. Funds sit in an on-chain program-derived account that only the contract logic can move. We can't touch it; the chain enforces the agreement.",
  },
  {
    q: "Can I read the smart contract code?",
    a: "Yes — fully open source. Repository link is in the footer.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="lp-section">
      <div className="lp-section-head">
        <span className="lp-section-eyebrow">FAQ</span>
        <h2 className="lp-section-title">Questions, answered.</h2>
      </div>

      <div className="lp-faq">
        {faq.map((item) => (
          <details key={item.q} className="lp-faq-item">
            <summary className="lp-faq-q">{item.q}</summary>
            <p className="lp-faq-a">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
