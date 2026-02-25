import Link from 'next/link'

export default function HowItWorks() {
  return (
    <main style={{ padding: 32, maxWidth: 920, margin: '0 auto' }}>
      <h1>How it works</h1>
      <p style={{ opacity: 0.85 }}>
        This is a Takeover-style grid game on BSC.
      </p>
      <ol style={{ lineHeight: 1.8 }}>
        <li>Each coin has a 10×10 grid (100 tiles).</li>
        <li>You can takeover any tile by paying the current takeover price.</li>
        <li>When a tile is taken, the previous owner is bought out (compensation credited onchain).</li>
        <li>A protocol fee is routed into a rewards vault and distributed equally per tile (1% each).</li>
        <li>Tile owners can claim accumulated rewards at any time.</li>
      </ol>
      <p style={{ opacity: 0.75 }}>
        Note: MVP ships with a rewards-pool model first for fast launch; we can later upgrade to route real trading fees.
      </p>
      <Link href="/" style={{ textDecoration: 'none' }}>← Back</Link>
    </main>
  )
}
