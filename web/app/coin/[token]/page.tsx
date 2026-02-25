'use client'

import Link from 'next/link'
import TileIcon from '../../components/TileIcon'

function getMode(searchParams: Record<string, string | string[] | undefined>) {
  const m = searchParams.mode
  return (Array.isArray(m) ? m[0] : m) === 'agent' ? 'agent' : 'human'
}

function BoardTile({ id, variant, selected, onSelect }: { id: number; variant?: 'none' | 'owned' | 'mine'; selected?: boolean; onSelect?: (id:number)=>void }) {
  const cls = variant === 'mine' ? 'boardTile boardTileMine' : variant === 'owned' ? 'boardTile boardTileOwned' : 'boardTile'
  const hue = (id * 37) % 360
  return (
    <button
      className={selected ? cls + ' boardTileSelected' : cls}
      onClick={() => onSelect?.(id)}
      type="button"
      title={`Tile ${id}`}
    >
      <TileIcon seed={1337 + id * 97} hue={hue} size={3} />
    </button>
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
  const selectedTile = 22

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

      <section className="coinLayout">
        <div className="boardCol">
          <div className="boardTitleRow">
            <h3 style={{ margin: 0 }}>Buy any tile</h3>
            <span className="pill">tile earns 1%</span>
          </div>

          <div className="boardWrap">
            <div className="board">
              {tiles.map((id) => {
                const variant = id % 17 === 0 ? 'mine' : id % 11 === 0 ? 'owned' : 'none'
                return (
                  <BoardTile
                    key={id}
                    id={id}
                    variant={variant}
                    selected={id === selectedTile}
                  />
                )
              })}
            </div>
            <div className="boardGlow" aria-hidden="true" />
          </div>
        </div>

        <aside className="card infoCol">
          <div className="cardPad">
            <div className="sectionTitle">
              <h3 style={{ margin: 0 }}>Tile #{selectedTile}</h3>
              <span className="pill"><span className="subtle">MVP</span></span>
            </div>
            <div className="list">
              <div className="item"><div className="subtle">Owner</div><div className="mono">0x…</div></div>
              <div className="item"><div className="subtle">Price</div><div><b>0.012</b> BNB</div></div>
              <div className="item"><div className="subtle">Claimable</div><div><b>0.000</b> BNB</div></div>
              <div className="item"><div className="subtle">Buyout</div><div className="subtle">90% to prev owner</div></div>
            </div>
            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              <button className="btn btnPrimary" type="button">Takeover</button>
              <button className="btn" type="button">Claim fees</button>
              <button className="btn btnGhost" type="button">Withdraw buyout</button>
            </div>
            <div className="footer">🦞 Agent mode adds an auto-suggest panel.</div>
          </div>
        </aside>

        {mode === 'agent' ? <div className="agentCol"><AgentPanel /></div> : null}
      </section>
    </main>
  )
}
