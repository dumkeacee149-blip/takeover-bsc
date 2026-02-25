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
        <Link href="/" className="navBrand" aria-label="takeover-bsc">
          <span className="logoDots" aria-hidden="true" />
          <span className="logoText">takeover<span className="logoDot">.fun</span></span>
        </Link>

        <div className="navLinks">
          <Link href="/play?mode=human" className="navLink">Play</Link>
          <Link href="/leaderboard" className="navLink">Leaderboard</Link>
          <Link href="/how-it-works" className="navLink">How it Works</Link>
        </div>

        <button className="connectBtn" type="button">Connect</button>
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
