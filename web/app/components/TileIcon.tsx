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

const T = (rows: string[]) => rows.join('').split('').map((c) => c === '1')

// 9x9 templates (pixel-cartoon, robots/coins/chips). Avoid letter-like noise.
const TEMPLATES: boolean[][] = [
  // robot face
  T([
    '001111100',
    '011111110',
    '110000011',
    '110110011',
    '110000011',
    '110111011',
    '110000011',
    '011111110',
    '001111100',
  ]),
  // chip
  T([
    '001111100',
    '011111110',
    '011000110',
    '011011110',
    '011011110',
    '011000110',
    '011111110',
    '001111100',
    '000110000',
  ]),
  // coin
  T([
    '000111000',
    '001111100',
    '011111110',
    '011101110',
    '011101110',
    '011111110',
    '001111100',
    '000111000',
    '000010000',
  ]),
  // bnb diamond
  T([
    '000010000',
    '000111000',
    '001111100',
    '011111110',
    '001111100',
    '000111000',
    '000010000',
    '000000000',
    '000010000',
  ]),
  // bolt
  T([
    '000011000',
    '000111000',
    '001110000',
    '011111100',
    '000111110',
    '000011100',
    '000111000',
    '001110000',
    '000000000',
  ]),
]

function rotate90(p: boolean[]) {
  const out = Array(81).fill(false)
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      out[x * 9 + (8 - y)] = p[y * 9 + x]
    }
  }
  return out
}

function maybeFlipX(p: boolean[], flip: boolean) {
  if (!flip) return p
  const out = Array(81).fill(false)
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      out[y * 9 + (8 - x)] = p[y * 9 + x]
    }
  }
  return out
}

export default function TileIcon({ seed, hue, size = 4 }: Props) {
  const rnd = mulberry32(seed)

  // pick a template + small transforms
  let p = TEMPLATES[Math.floor(rnd() * TEMPLATES.length)]
  const turns = Math.floor(rnd() * 4)
  for (let i = 0; i < turns; i++) p = rotate90(p)
  p = maybeFlipX(p, rnd() > 0.5)

  // palette: bright but stable; keep it cartoon
  const s = 92
  const lOn = 62
  const lDim = 42

  // add a few sparkles for variety
  const sparkleCount = 2 + Math.floor(rnd() * 4)
  const sparkles = new Set<number>()
  for (let i = 0; i < sparkleCount; i++) sparkles.add(Math.floor(rnd() * 81))

  const px = Array.from({ length: 81 }, (_, i) => {
    const on = p[i] || sparkles.has(i)
    const isSpark = !p[i] && sparkles.has(i)

    return {
      i,
      style: {
        background: on ? `hsl(${hue} ${s}% ${isSpark ? lDim : lOn}%)` : 'transparent',
        opacity: on ? 0.98 : 0,
        width: size,
        height: size,
        borderRadius: 0, // pixel look
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
