import './globals.css'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Providers from './providers'
import NetworkBanner from './components/NetworkBanner'

const WalletButton = dynamic(() => import('./components/WalletButton'), { ssr: false })

export const metadata = {
  title: 'takeover-bsc',
  description: 'BSC Takeover-style grid game',
}

function Nav() {
  return (
    <div className="nav">
      <NetworkBanner />
      <div className="navInner">
        <Link href="/" className="navBrand" aria-label="takeover-bsc">
          <span className="logoDots" aria-hidden="true" />
          <span className="logoText">takeover<span className="logoDot">.bsc</span></span>
        </Link>

        <div className="navLinks">
          <Link href="/coin/0x0000000000000000000000000000000000000000?mode=human" className="navLink">Play</Link>
          <Link href="/leaderboard" className="navLink">Leaderboard</Link>
          <Link href="/how-it-works" className="navLink">How it Works</Link>
        </div>

        <WalletButton />
      </div>
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  )
}
