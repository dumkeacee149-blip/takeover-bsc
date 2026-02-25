export const metadata = {
  title: 'takeover-bsc',
  description: 'BSC Takeover-style grid game',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'ui-sans-serif, system-ui' }}>{children}</body>
    </html>
  )
}
