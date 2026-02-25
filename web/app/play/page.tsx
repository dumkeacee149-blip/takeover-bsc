import Link from 'next/link'

function getMode(searchParams: Record<string, string | string[] | undefined>) {
  const m = searchParams.mode
  return (Array.isArray(m) ? m[0] : m) === 'agent' ? 'agent' : 'human'
}

// MVP: hardcoded coins list (replace with onchain list later)
const COINS = [
  {
    name: 'Example Coin (test)',
    address: '0x0000000000000000000000000000000000000000',
    note: 'Deploy contracts + initCoin for a real token address later.'
  },
]

export default function Play({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const mode = getMode(searchParams)
  return (
    <main className="container">
      <div className="sectionTitle">
        <div>
          <h1 style={{ margin: 0 }}>Play</h1>
          <div className="subtle">Mode: <b>{mode}</b> {mode === 'agent' ? '🤖' : '🧑‍🔧'}</div>
        </div>
        <Link href="/" className="btn btnGhost" style={{ textDecoration: 'none' }}>← Back</Link>
      </div>

      <div className="card">
        <div className="cardPad">
          <div className="subtle" style={{ marginBottom: 10 }}>
            Pick a coin to take over tiles. This is a thin shell today; onchain indexing comes next.
          </div>
          <div className="list">
            {COINS.map((c) => (
              <Link
                key={c.address}
                href={`/coin/${c.address}?mode=${mode}`}
                className="item"
                style={{ textDecoration: 'none' }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>{c.name}</div>
                  <div className="mono subtle" style={{ marginTop: 4 }}>{c.address}</div>
                  <div className="subtle" style={{ marginTop: 6 }}>{c.note}</div>
                </div>
                <div className="pill">Open</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="footer">🦞 Tip: in Agent mode, we’ll suggest moves; you always sign.</div>
    </main>
  )
}
