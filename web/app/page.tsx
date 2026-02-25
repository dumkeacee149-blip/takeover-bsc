import Link from 'next/link'

export default function Home() {
  return (
    <main className="container">
      <div className="grid2">
        <section className="card">
          <div className="cardPad">
            <div className="h2">Takeover on BSC</div>
            <h1 className="h1">Each tile earns <span style={{ color: 'var(--accent2)' }}>1%</span> of the coin’s trading fees</h1>
            <p className="subtle" style={{ fontSize: 16, lineHeight: 1.6 }}>
              Monopoly vibes, onchain settlement. Buy out a tile, earn protocol fees while you hold it.
              Anyone can take your tile at any time.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
              <Link href="/play?mode=human" className="btn btnPrimary" style={{ textDecoration: 'none' }}>
                Play as a Human
              </Link>
              <Link href="/play?mode=agent" className="btn" style={{ textDecoration: 'none' }}>
                Play as an Agent
              </Link>
              <Link href="/how-it-works" className="btn btnGhost" style={{ textDecoration: 'none' }}>
                How it works
              </Link>
            </div>

            <div className="kpiRow">
              <div className="kpi">10×10<span>grid</span></div>
              <div className="kpi">×1.1<span>price</span></div>
              <div className="kpi">90/10<span>split</span></div>
              <div className="kpi">🦞<span>pinch fees</span></div>
            </div>

            <div className="footer">
              MVP ships with a rewards-pool model first (fast launch). Later we route real trading fees.
            </div>
          </div>
        </section>

        <aside className="card">
          <div className="cardPad">
            <div className="sectionTitle">
              <h3 style={{ margin: 0 }}>Latest Rewards</h3>
              <span className="pill"><span className="subtle">MVP</span></span>
            </div>
            <div className="list">
              <div className="item">
                <div>
                  <div style={{ fontWeight: 800 }}>No onchain rewards yet</div>
                  <div className="subtle" style={{ marginTop: 4 }}>Deploy contracts to BSC testnet to populate this feed.</div>
                </div>
                <div className="mono subtle">—</div>
              </div>
            </div>

            <div style={{ marginTop: 16 }} className="subtle">
              Tip: Use <b>Agent</b> mode to auto-suggest takeovers. You still sign every tx.
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
