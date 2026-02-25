type Tile = {
  seed: number
  hue: number
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function TileIcon({ seed, hue }: Tile) {
  const rnd = mulberry32(seed)
  // 9x9 pixels
  const px = Array.from({ length: 81 }, (_, i) => {
    // sparse pattern
    const r = rnd()
    const on = r > 0.58
    const a = on ? 0.95 : 0
    // slightly vary brightness
    const l = 58 + Math.floor(rnd() * 16)
    const s = 92
    return {
      i,
      on,
      style: {
        background: on ? `hsl(${hue} ${s}% ${l}%)` : 'transparent',
        opacity: a,
      } as React.CSSProperties,
    }
  })

  return (
    <div className="tileIcon">
      {px.map((p) => (
        <div key={p.i} className="tilePx" style={p.style} />
      ))}
    </div>
  )
}

export default function PixelBoard({ size = 10 }: { size?: number }) {
  const tiles: Tile[] = Array.from({ length: size * size }, (_, i) => ({
    seed: 1337 + i * 97,
    hue: (i * 37) % 360,
  }))

  return (
    <div className="boardWrap">
      <div className="board">
        {tiles.map((t, idx) => (
          <div key={idx} className="boardTile" title={`Tile ${idx}`}>
            <TileIcon seed={t.seed} hue={t.hue} />
          </div>
        ))}
      </div>
      <div className="boardGlow" aria-hidden="true" />
    </div>
  )
}
