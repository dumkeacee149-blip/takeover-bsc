import Link from 'next/link'

export default function HowItWorks() {
  return (
    <main className="container">
      <div className="card">
        <div className="cardPad">
          <div className="h2">Rules</div>
          <h1 className="h1" style={{ fontSize: 38 }}>How it works 🦞</h1>
          <p className="subtle" style={{ lineHeight: 1.7 }}>
            Inspired by takeover.fun. Monopoly-style buyouts, with onchain accounting.
          </p>

          <ol style={{ lineHeight: 1.9 }}>
            <li>Each coin has a <b>10×10</b> grid (100 tiles).</li>
            <li>You can takeover any tile by paying its current price.</li>
            <li>When a tile is taken, the previous owner is bought out: <b>90%</b> credited to them (withdrawable).</li>
            <li>A <b>10%</b> protocol fee flows into a rewards vault and is distributed equally per tile (1% each).</li>
            <li>Tile owners can claim accumulated rewards at any time.</li>
          </ol>

          <div className="footer">
            MVP ships with a rewards-pool model first for fast launch. Later we can route real trading fees.
          </div>

          <div style={{ marginTop: 14 }}>
            <Link href="/" className="btn btnGhost" style={{ textDecoration: 'none' }}>← Back</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
