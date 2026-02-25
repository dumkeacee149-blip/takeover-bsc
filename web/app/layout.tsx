import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'takeover-bsc',
  description: 'BSC Takeover-style grid game',
}

function Nav() {
  return (
    <div className="nav">
      <div className="navInner">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="brand" aria-label="takeover-bsc">
            <div className="brandMark" />
            <div className="brandText">
              <div>takeover <span className="subtle">🦞</span></div>
              <small>Revenue has new management</small>
            </div>
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="pill"><span className="subtle">BSC</span> testnet</span>
          <button className="btn btnGhost" type="button">Connect</button>
        </div>
      </div>
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  )
}
