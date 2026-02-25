import Link from 'next/link'

const ROWS = Array.from({ length: 12 }, (_, i) => ({
  rank: i + 1,
  name: `0x${(Math.random().toString(16) + '0000000000000000').slice(2, 10)}…${(Math.random().toString(16) + '000000').slice(2, 6)}`,
  fees: (Math.random() * 2.5).toFixed(3),
  tiles: Math.floor(Math.random() * 18) + 1,
}))

export default function Leaderboard() {
  return (
    <main className="container">
      <div className="sectionTitle">
        <div>
          <h1 style={{ margin: 0 }}>Leaderboard</h1>
          <div className="subtle">Top tile owners by claimed fees (MVP mock)</div>
        </div>
        <Link href="/" className="btn btnGhost" style={{ textDecoration: 'none' }}>← Back</Link>
      </div>

      <div className="card">
        <div className="cardPad">
          <div className="list">
            {ROWS.map((r) => (
              <div key={r.rank} className="item">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="pill" style={{ width: 56, justifyContent: 'center' }}>#{r.rank}</div>
                  <div>
                    <div style={{ fontWeight: 900 }} className="mono">{r.name}</div>
                    <div className="subtle">Tiles: {r.tiles}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900 }}>{r.fees} BNB</div>
                  <div className="subtle">claimed</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
