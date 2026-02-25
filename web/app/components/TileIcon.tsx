import React from 'react'

type Props = {
  seed: number
  hue: number
  size?: number // pixel size
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export default function TileIcon({ seed, hue, size = 4 }: Props) {
  const rnd = mulberry32(seed)
  const px = Array.from({ length: 81 }, (_, i) => {
    const r = rnd()
    const on = r > 0.58
    const l = 56 + Math.floor(rnd() * 18)
    const s = 92
    return {
      i,
      on,
      style: {
        background: on ? `hsl(${hue} ${s}% ${l}%)` : 'transparent',
        opacity: on ? 0.95 : 0,
        width: size,
        height: size,
        borderRadius: Math.max(1, Math.floor(size / 2)),
      } as React.CSSProperties,
    }
  })

  return (
    <div className="tileIcon" style={{ gridTemplateColumns: `repeat(9, ${size}px)` }}>
      {px.map((p) => (
        <div key={p.i} className="tilePx" style={p.style} />
      ))}
    </div>
  )
}
