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
  // Keep /play for future discovery, but default to direct entry.
  const defaultCoin = COINS[0]?.address || '0x0000000000000000000000000000000000000000'
  return (
    <main className="container">
      <div className="card">
        <div className="cardPad">
          <div className="sectionTitle">
            <div>
              <h1 style={{ margin: 0 }}>Play</h1>
              <div className="subtle">Direct entry (no extra jump). Mode: <b>{mode}</b></div>
            </div>
            <Link href={`/coin/${defaultCoin}?mode=${mode}`} className="btn btnPrimary" style={{ textDecoration: 'none' }}>
              Enter
            </Link>
          </div>
          <div className="subtle">We’ll bring back coin discovery here once onchain indexing is wired.</div>
        </div>
      </div>
      <div className="footer">🦞</div>
    </main>
  )
}
