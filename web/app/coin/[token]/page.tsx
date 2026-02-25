import Link from 'next/link'

function getMode(searchParams: Record<string, string | string[] | undefined>) {
  const m = searchParams.mode
  return (Array.isArray(m) ? m[0] : m) === 'agent' ? 'agent' : 'human'
}

function Tile({ id }: { id: number }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        border: '1px solid #eee',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        opacity: 0.85,
      }}
      title={`Tile ${id}`}
    >
      {id}
    </div>
  )
}

function AgentPanel() {
  return (
    <aside style={{ width: 320, borderLeft: '1px solid #eee', paddingLeft: 16 }}>
      <h3>Agent Panel</h3>
      <p style={{ opacity: 0.75 }}>MVP: agent suggests a move; you still sign the transaction.</p>
      <div style={{ display: 'grid', gap: 10 }}>
        <label>Budget (BNB)
          <input style={{ width: '100%', padding: 8, marginTop: 6 }} placeholder="0.5" />
        </label>
        <label>Max price per tile (BNB)
          <input style={{ width: '100%', padding: 8, marginTop: 6 }} placeholder="0.05" />
        </label>
        <label>Strategy
          <select style={{ width: '100%', padding: 8, marginTop: 6 }} defaultValue="random">
            <option value="random">Random</option>
            <option value="cheapest">Cheapest</option>
            <option value="defend">Defend my tiles</option>
          </select>
        </label>
        <button style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', background: '#111', color: 'white' }}>
          Suggest Move
        </button>
      </div>
    </aside>
  )
}

export default function CoinPage({ params, searchParams }: { params: { token: string }, searchParams: Record<string, string | string[] | undefined> }) {
  const mode = getMode(searchParams)
  const token = params.token

  const tiles = Array.from({ length: 100 }, (_, i) => i)

  return (
    <main style={{ padding: 32, maxWidth: 1120, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 800 }}>Coin</div>
          <div style={{ fontFamily: 'ui-monospace, SFMono-Regular', opacity: 0.7 }}>{token}</div>
          <div style={{ opacity: 0.8 }}>Mode: <b>{mode}</b></div>
        </div>
        <button style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', background: 'white' }}>
          Connect
        </button>
      </header>

      <section style={{ display: 'flex', gap: 16, marginTop: 24 }}>
        <div style={{ flex: 1 }}>
          <h2>Grid (10×10)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 28px)', gap: 6, marginTop: 12 }}>
            {tiles.map((id) => <Tile key={id} id={id} />)}
          </div>

          <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
            <button style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', background: 'white' }}>Takeover</button>
            <button style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #ddd', background: 'white' }}>Claim</button>
          </div>

          <p style={{ opacity: 0.7, marginTop: 14 }}>
            (MVP) This page will read tile owner/price from GridRegistry and execute takeover/claim via wallet.
          </p>

          <Link href={`/play?mode=${mode}`} style={{ textDecoration: 'none' }}>← Back to Play</Link>
        </div>

        {mode === 'agent' ? <AgentPanel /> : null}
      </section>
    </main>
  )
}
