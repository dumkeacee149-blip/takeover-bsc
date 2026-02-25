import Link from 'next/link'
import PixelBoard from './components/PixelBoard'

export default function Home() {
  return (
    <main className="hero">
      <div className="heroInner">
        <h1 className="heroTitle">
          Buy any tile <span className="heroAccent">at any time</span>
        </h1>

        <div className="heroBoard">
          <PixelBoard size={10} />
        </div>

        <div className="heroCtas">
          <Link href="/play?mode=human" className="btn btnPrimary" style={{ textDecoration: 'none' }}>
            Play as a Human
          </Link>
          <Link href="/play?mode=agent" className="btn" style={{ textDecoration: 'none' }}>
            Play as an Agent
          </Link>
        </div>

        <div className="heroSub">
          Each tile earns 1% of the coin’s fees. New owner buys out the previous owner (minus protocol fee). 🦞
        </div>

        <div className="heroFooter">
          <span className="pill">BSC testnet</span>
          <span className="pill">10×10 grid</span>
          <span className="pill">×1.1 price</span>
        </div>
      </div>
    </main>
  )
}
