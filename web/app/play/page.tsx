import Link from 'next/link'

function getMode(searchParams: Record<string, string | string[] | undefined>) {
  const m = searchParams.mode
  return (Array.isArray(m) ? m[0] : m) === 'agent' ? 'agent' : 'human'
}

type Coin = {
  name: string
  symbol: string
  address: string
  blurb: string
}

// MVP: hardcoded coins list (replace with onchain list later)
const COINS: Coin[] = [
  {
    name: 'Example Coin',
    symbol: 'EX',
    address: '0x0000000000000000000000000000000000000000',
    blurb: 'MVP coin. Deploy contracts + initCoin for a real token address later.',
  },
  {
    name: 'BNB Test Token',
    symbol: 'tBNB',
    address: '0x0000000000000000000000000000000000000000',
    blurb: 'Placeholder for testnet demo.',
  },
]

function CoinCard({ coin, mode }: { coin: Coin; mode: string }) {
  return (
    <Link href={`/coin/${coin.address}?mode=${mode}`} className="coinCard" style={{ textDecoration: 'none' }}>
      <div className="coinHead">
        <div className="coinBadge" aria-hidden="true">{coin.symbol}</div>
        <div>
          <div className="coinName">{coin.name}</div>
          <div className="mono subtle" style={{ fontSize: 12 }}>{coin.address}</div>
        </div>
      </div>
      <div className="coinBlurb subtle">{coin.blurb}</div>
      <div className="coinMeta">
        <span className="pill">10×10</span>
        <span className="pill">×1.1 price</span>
        <span className="pill">1%/tile</span>
      </div>
      <div className="coinCta">Enter →</div>
    </Link>
  )
}

export default function Play({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const mode = getMode(searchParams)

  return (
    <main className="container">
      <div className="playTop">
        <div>
          <h1 style={{ margin: 0 }}>Play</h1>
          <div className="subtle">
            Mode: <b>{mode}</b> {mode === 'agent' ? '🤖' : '🧑‍🔧'} — buy out tiles, earn fees, get taken over.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href={`/coin/${COINS[0]?.address || '0x0'}?mode=human`} className="btn btnGhost" style={{ textDecoration: 'none' }}>
            Human
          </Link>
          <Link href={`/coin/${COINS[0]?.address || '0x0'}?mode=agent`} className="btn btnGhost" style={{ textDecoration: 'none' }}>
            Agent
          </Link>
        </div>
      </div>

      <div className="playGrid">
        <section className="card">
          <div className="cardPad">
            <div className="sectionTitle">
              <h3 style={{ margin: 0 }}>Coins</h3>
              <span className="pill"><span className="subtle">MVP</span></span>
            </div>

            <div className="coins">
              {COINS.map((c) => (
                <CoinCard key={c.name + c.symbol} coin={c} mode={mode} />
              ))}
            </div>
          </div>
        </section>

        <aside className="card">
          <div className="cardPad">
            <div className="sectionTitle">
              <h3 style={{ margin: 0 }}>Latest Rewards</h3>
              <span className="pill"><span className="subtle">soon</span></span>
            </div>
            <div className="list">
              <div className="item">
                <div>
                  <div style={{ fontWeight: 900 }}>No rewards yet</div>
                  <div className="subtle">No events yet. Takeover a tile, then claim fees to populate this feed.</div>
                </div>
                <div className="mono subtle">—</div>
              </div>
            </div>

            <div style={{ marginTop: 14 }} className="subtle">
              🦞 Tip: Agent mode suggests moves, but you always sign.
            </div>
          </div>
        </aside>
      </div>

      <div className="footer">takeover.bsc • inspired by takeover.fun</div>
    </main>
  )
}
