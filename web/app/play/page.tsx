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
  },
]

export default function Play({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const mode = getMode(searchParams)
  return (
    <main style={{ padding: 32, maxWidth: 920, margin: '0 auto' }}>
      <h1>Play</h1>
      <p style={{ opacity: 0.8 }}>Mode: <b>{mode}</b></p>

      <div style={{ display: 'grid', gap: 12 }}>
        {COINS.map((c) => (
          <Link
            key={c.address}
            href={`/coin/${c.address}?mode=${mode}`}
            style={{ padding: 16, borderRadius: 12, border: '1px solid #eee', textDecoration: 'none', color: '#111' }}
          >
            <div style={{ fontWeight: 700 }}>{c.name}</div>
            <div style={{ fontFamily: 'ui-monospace, SFMono-Regular', opacity: 0.7 }}>{c.address}</div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <Link href="/" style={{ textDecoration: 'none' }}>← Back</Link>
      </div>
    </main>
  )
}
