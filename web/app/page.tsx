import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ padding: 32, maxWidth: 920, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>takeover</div>
          <div style={{ opacity: 0.8 }}>Revenue has new management.</div>
        </div>
        <button style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', background: 'white' }}>
          Connect
        </button>
      </header>

      <h2 style={{ marginTop: 40 }}>Each tile earns 1% of the coin&apos;s trading fees</h2>
      <p style={{ opacity: 0.8 }}>
        Claim a tile on any coin, earn fees while you hold it. Anyone can take your tile at any time.
      </p>

      <section style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <Link href="/play?mode=human" style={{ padding: '12px 16px', borderRadius: 12, background: '#111', color: 'white', textDecoration: 'none' }}>
          Play as a Human
        </Link>
        <Link href="/play?mode=agent" style={{ padding: '12px 16px', borderRadius: 12, background: 'white', border: '1px solid #ddd', color: '#111', textDecoration: 'none' }}>
          Play as an Agent
        </Link>
        <Link href="/how-it-works" style={{ padding: '12px 16px', borderRadius: 12, background: 'white', border: '1px solid #ddd', color: '#111', textDecoration: 'none' }}>
          How it works
        </Link>
      </section>

      <section style={{ marginTop: 48 }}>
        <h3>Latest Rewards</h3>
        <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 16, opacity: 0.8 }}>
          (MVP) Will show recent protocol fee deposits / claims once contracts are deployed.
        </div>
      </section>

      <footer style={{ marginTop: 64, opacity: 0.7, fontSize: 13 }}>
        <div>Network: BSC (Testnet first)</div>
      </footer>
    </main>
  )
}
