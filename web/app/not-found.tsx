import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="container">
      <div className="card">
        <div className="cardPad">
          <div className="h2">404</div>
          <h1 className="h1" style={{ fontSize: 38 }}>This tile isn’t here 🦞</h1>
          <p className="subtle">Try heading back and taking over something real.</p>
          <Link href="/" className="btn btnPrimary" style={{ textDecoration: 'none', marginTop: 10 }}>Back home</Link>
        </div>
      </div>
    </main>
  )
}
