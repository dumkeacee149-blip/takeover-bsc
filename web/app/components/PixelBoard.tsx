type Tile = {
  seed: number
  hue: number
}

import TileIcon from './TileIcon'

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
