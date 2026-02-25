import Link from 'next/link'
import PixelBoard from './components/PixelBoard'

export default function Home() {
  return (
    <main className="hero">
      <div className="heroInner">
        <h1 className="heroTitle">
          Buy any tile <span className="heroAccent">at any time</span>
        </h1>
        <div className="heroTagline">
          Monopoly-style buyouts, onchain settlement. Hold tiles, claim fees. Anyone can take your tile.
        </div>

        <div className="heroBoard">
          <PixelBoard size={10} />
        </div>

        <div className="heroCtas">
          <Link href="/coin/0x0000000000000000000000000000000000000000?mode=human" className="btn btnPrimary" style={{ textDecoration: 'none' }}>
            Play as a Human
          </Link>
          <Link href="/coin/0x0000000000000000000000000000000000000000?mode=agent" className="btn" style={{ textDecoration: 'none' }}>
            Play as an Agent
          </Link>
        </div>

        <div className="heroSub">
          Each tile earns 1% of the coin’s fees. New owner buys out the previous owner (minus protocol fee). <span className="subtle">🦞</span>
        </div>

        <div className="heroFooter">
          <span className="pill">BSC testnet</span>
          <span className="pill">10×10 grid</span>
          <span className="pill">×1.1 price</span>
          <span className="pill">90/10 split</span>
        </div>
      </div>
    </main>
  )
}
