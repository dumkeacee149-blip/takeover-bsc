import Link from 'next/link'

function getMode(searchParams: Record<string, string | string[] | undefined>) {
  const m = searchParams.mode
  return (Array.isArray(m) ? m[0] : m) === 'agent' ? 'agent' : 'human'
}

function Tile({ id, variant }: { id: number; variant?: 'none' | 'owned' | 'mine' }) {
  const cls = variant === 'mine' ? 'tile tileMine' : variant === 'owned' ? 'tile tileOwned' : 'tile'
  return (
    <div className={cls} title={`Tile ${id}`}>{id}</div>
  )
}

function AgentPanel() {
  return (
    <aside className="card agentPanel" style={{ width: 360 }}>
      <div className="cardPad">
        <div className="sectionTitle">
          <h3 style={{ margin: 0 }}>Agent Panel</h3>
          <span className="pill">🦞 auto-suggest</span>
        </div>
        <p className="subtle" style={{ marginTop: 0 }}>
          MVP: agent suggests a move; you still sign every transaction.
        </p>

        <div style={{ display: 'grid', gap: 10 }}>
          <label className="subtle">Budget (BNB)
            <input className="btn" style={{ width: '100%', justifyContent: 'flex-start' }} placeholder="0.5" />
          </label>
          <label className="subtle">Max price per tile (BNB)
            <input className="btn" style={{ width: '100%', justifyContent: 'flex-start' }} placeholder="0.05" />
          </label>
          <label className="subtle">Strategy
            <select className="btn" style={{ width: '100%' }} defaultValue="cheapest">
              <option value="cheapest">Cheapest</option>
              <option value="random">Random</option>
              <option value="defend">Defend my tiles</option>
            </select>
          </label>

          <button className="btn btnPrimary" type="button">Suggest Move</button>
          <button className="btn" type="button">Execute (sign tx)</button>
        </div>
      </div>
    </aside>
  )
}

export default function CoinPage({ params, searchParams }: { params: { token: string }, searchParams: Record<string, string | string[] | undefined> }) {
  const mode = getMode(searchParams)
  const token = params.token

  const tiles = Array.from({ length: 100 }, (_, i) => i)

  return (
    <main className="container">
      <div className="sectionTitle">
        <div>
          <h1 style={{ margin: 0 }}>Coin takeover</h1>
          <div className="mono subtle" style={{ marginTop: 6 }}>{token}</div>
          <div className="subtle" style={{ marginTop: 6 }}>Mode: <b>{mode}</b> {mode === 'agent' ? '🤖' : '🧑‍🔧'}</div>
        </div>
        <Link href={`/play?mode=${mode}`} className="btn btnGhost" style={{ textDecoration: 'none' }}>← Back</Link>
      </div>

      <section style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div className="card">
            <div className="cardPad">
              <div className="sectionTitle">
                <h3 style={{ margin: 0 }}>Grid (10×10)</h3>
                <span className="pill"><span className="subtle">tile</span> earns 1%</span>
              </div>

              <div className="tileGrid">
                {tiles.map((id) => {
                  // MVP visuals: sprinkle a few occupied tiles
                  const variant = id % 17 === 0 ? 'mine' : id % 11 === 0 ? 'owned' : 'none'
                  return <Tile key={id} id={id} variant={variant} />
                })}
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btnPrimary" type="button">Takeover</button>
                <button className="btn" type="button">Claim</button>
                <button className="btn btnGhost" type="button">Withdraw buyout</button>
              </div>

              <p className="subtle" style={{ marginTop: 12 }}>
                (MVP) Next step: read owner/price from GridRegistry, execute takeover/claim via wallet.
              </p>
            </div>
          </div>
        </div>

        {mode === 'agent' ? <AgentPanel /> : null}
      </section>
    </main>
  )
}
