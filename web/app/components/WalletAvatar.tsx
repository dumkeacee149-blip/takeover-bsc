'use client'

import TileIcon from './TileIcon'

function seedFromAddress(addr?: string) {
  if (!addr) return 1
  // take last 8 hex chars for stable seed
  const hex = addr.toLowerCase().replace(/^0x/, '')
  const tail = hex.slice(-8)
  const n = parseInt(tail || '1', 16)
  return Number.isFinite(n) ? n : 1
}

export default function WalletAvatar({ address, size = 34, hue }: { address?: string; size?: number; hue?: number }) {
  const seed = seedFromAddress(address)
  const h = hue ?? (seed * 41) % 360
  // TileIcon size here means pixel size (not css px), keep small and let container scale
  const iconSize = 3
  return (
    <div
      className="walletAvatar"
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}
      title={address}
    >
      <div style={{ transform: 'scale(1.05)', transformOrigin: 'center', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <TileIcon seed={seed} hue={h} size={iconSize} />
      </div>
    </div>
  )
}
