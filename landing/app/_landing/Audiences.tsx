const audiences = [
  {
    title: "For Clients",
    tag: "Founders · Agencies · Indie hackers",
    sub: "You hire freelancers and want delivery before money leaves your account — without paying 10–20% to a middleman.",
    pains: [
      "Paying upfront feels risky",
      "Upwork-style fees eat 10–15% of your budget",
      "Contracts are walls of legalese nobody reads",
    ],
    wins: [
      "Funds stay yours until you confirm delivery",
      "≈ $0.40 in total fees on a $5,000 contract",
      "Plain-English AI-drafted terms in 30 seconds",
    ],
  },
  {
    title: "For Freelancers",
    tag: "Designers · Developers · Writers",
    sub: "You do the work and want payment to be a guarantee, not a negotiation — without losing 10–20% off the top.",
    pains: [
      "Chasing invoices for weeks after delivery",
      "Platforms can freeze your account or balance",
      "5–20% taken off the top before you see a cent",
    ],
    wins: [
      "Payment guaranteed by the chain, not a company",
      "Keep 99%+ of the contract value",
      "Withdraw to your own wallet, instantly",
    ],
  },
];

export function Audiences() {
  return (
    <section id="audience" className="lp-section">
      <div className="lp-section-head">
        <span className="lp-section-eyebrow">Who it's for</span>
        <h2 className="lp-section-title">
          Both sides finally on the same side.
        </h2>
        <p className="lp-section-lead">
          The escrow contract is the only intermediary — and it can't take a
          cut, freeze accounts, or change the rules mid-deal.
        </p>
      </div>

      <div className="lp-grid-2">
        {audiences.map((a) => (
          <article key={a.title} className="lp-audience-card">
            <div className="lp-audience-head">
              <h3>{a.title}</h3>
            </div>
            <div className="lp-audience-tag" style={{ marginBottom: 6 }}>
              {a.tag}
            </div>
            <p className="lp-audience-sub">{a.sub}</p>

            <div className="lp-audience-list-title">Pains today</div>
            <ul className="lp-audience-list lp-list-pain">
              {a.pains.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>

            <div className="lp-audience-list-title">What you get</div>
            <ul className="lp-audience-list lp-list-win">
              {a.wins.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
