const steps = [
  {
    n: "01",
    title: "Draft",
    body: "Describe the job in one sentence. AI generates a plain-English contract both sides can actually read.",
  },
  {
    n: "02",
    title: "Fund",
    body: "Client locks the agreed amount into a Solana escrow account. Funds are visible on-chain; nobody can touch them until both sides agree.",
  },
  {
    n: "03",
    title: "Release",
    body: "When the client confirms delivery, the contract automatically pays the freelancer. No support ticket, no waiting period.",
  },
];

export function HowItWorks() {
  return (
    <section id="about" className="lp-section">
      <div className="lp-section-head">
        <span className="lp-section-eyebrow">How it works</span>
        <h2 className="lp-section-title">
          Three steps from handshake to payout.
        </h2>
        <p className="lp-section-lead">
          No platform between you and your money. The smart contract holds the
          funds and follows the agreement to the letter.
        </p>
      </div>

      <div className="lp-grid-3">
        {steps.map((s) => (
          <article key={s.n} className="lp-step">
            <div className="lp-step-num">{s.n}</div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
