const columns = [
  { name: "Split", ours: true },
  { name: "Mellow", ours: false },
  { name: "Upwork", ours: false },
  { name: "Fiverr", ours: false },
  { name: "Toptal", ours: false },
];

const rows = [
  {
    label: "Total fee (small contract)",
    cells: [
      "< 1%",
      "~ 5%",
      "10% client + 5–10% fl",
      "5.5% + $2.50",
      "7–15%",
    ],
  },
  {
    label: "Custody",
    cells: [
      "Smart contract",
      "Platform",
      "Platform",
      "Platform",
      "Platform",
    ],
  },
  {
    label: "Payout speed",
    cells: [
      "Instant on-chain",
      "Days",
      "5–14 days",
      "7–14 days",
      "Net 30+",
    ],
  },
  {
    label: "Contract review",
    cells: [
      "AI plain-English",
      "Manual",
      "Manual",
      "Manual",
      "Manual",
    ],
  },
  {
    label: "Account freeze risk",
    cells: ["None", "Possible", "Common", "Common", "Possible"],
  },
];

export function Comparison() {
  return (
    <section id="compare" className="lp-section">
      <div className="lp-section-head">
        <span className="lp-section-eyebrow">Comparison</span>
        <h2 className="lp-section-title">
          The first escrow that doesn&apos;t take a cut.
        </h2>
        <p className="lp-section-lead">
          We charge nothing on top. You only pay Solana network fees — typically
          under fifty cents end to end, regardless of contract size.
        </p>
      </div>

      <div className="lp-table-wrap">
        <table className="lp-table">
          <thead>
            <tr>
              <th></th>
              {columns.map((c) => (
                <th
                  key={c.name}
                  className={c.ours ? "lp-table-ours" : undefined}
                  scope="col"
                >
                  {c.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                {r.cells.map((value, i) => (
                  <td
                    key={`${r.label}-${i}`}
                    className={
                      columns[i]?.ours ? "lp-table-ours" : undefined
                    }
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="lp-table-foot">
        Competitor fees from public pricing pages, May 2026. Approximate; verify
        before quoting.
      </p>
    </section>
  );
}
