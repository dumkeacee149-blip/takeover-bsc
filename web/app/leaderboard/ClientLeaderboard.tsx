'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createPublicClient, formatEther, http, parseAbiItem } from 'viem'
import { bscTestnet } from 'viem/chains'
import { useWatchContractEvent } from 'wagmi'

import { feeVault } from '../lib/contracts'

function short(addr: string) {
  if (!addr) return '—'
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

type Row = {
  owner: string
  claimedWei: bigint
  tiles: number
}

type Agg = {
  claimedWei: bigint
  tiles: Set<string>
}

const claimedEvent = parseAbiItem(
  'event Claimed(address indexed coin, uint256 indexed tileId, address indexed owner, uint256 amountWei)'
)

export default function ClientLeaderboard() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Row[]>([])
  const [lastBlock, setLastBlock] = useState<bigint | null>(null)

  const aggRef = useMemo(() => new Map<string, Agg>(), [])

  function toRows(m: Map<string, Agg>): Row[] {
    const out: Row[] = []
    for (const [owner, a] of m.entries()) {
      out.push({ owner, claimedWei: a.claimedWei, tiles: a.tiles.size })
    }
    out.sort((a, b) => (a.claimedWei > b.claimedWei ? -1 : a.claimedWei < b.claimedWei ? 1 : 0))
    return out.slice(0, 50)
  }

  function applyClaim(coin: string, tileId: bigint, owner: string, amountWei: bigint) {
    const k = owner.toLowerCase()
    const prev = aggRef.get(k) || { claimedWei: 0n, tiles: new Set<string>() }
    prev.claimedWei = prev.claimedWei + (amountWei || 0n)
    prev.tiles.add(`${coin.toLowerCase()}:${tileId.toString()}`)
    aggRef.set(k, prev)
  }

  // Initial backfill from recent blocks (MVP). Increase range later or add indexer.
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const client = createPublicClient({ chain: bscTestnet, transport: http() })
        const head = await client.getBlockNumber()
        setLastBlock(head)
        const from = head > 50_000n ? head - 50_000n : 0n

        const logs = await client.getLogs({
          address: feeVault.address,
          event: claimedEvent,
          fromBlock: from,
          toBlock: head,
        })

        for (const l of logs) {
          const args: any = l.args
          if (!args) continue
          applyClaim(args.coin, args.tileId, args.owner, args.amountWei)
        }

        if (!alive) return
        setRows(toRows(aggRef))
      } catch {
        // ignore
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
    }
  }, [aggRef])

  // Real-time updates
  useWatchContractEvent({
    ...feeVault,
    eventName: 'Claimed',
    onLogs(logs) {
      for (const l of logs as any[]) {
        const a = l?.args
        if (!a) continue
        applyClaim(a.coin, a.tileId, a.owner, a.amountWei)
      }
      setRows(toRows(aggRef))
    },
  })

  return (
    <main className="container">
      <div className="sectionTitle">
        <div>
          <h1 style={{ margin: 0 }}>Leaderboard</h1>
          <div className="subtle">Live ranking by claimed fees (FeeVault events).</div>
          <div className="subtle" style={{ marginTop: 6, fontSize: 13 }}>
            {loading ? 'Syncing recent blocks…' : lastBlock ? `Synced to block ${lastBlock.toString()}` : null}
          </div>
        </div>
        <Link href="/" className="btn btnGhost" style={{ textDecoration: 'none' }}>
          ← Back
        </Link>
      </div>

      <div className="card">
        <div className="cardPad">
          {rows.length === 0 ? (
            <div className="subtle">No claimed-fee events yet. Claim fees to populate the leaderboard.</div>
          ) : (
            <div className="list">
              {rows.map((r, idx) => (
                <div key={r.owner} className="item">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="pill" style={{ width: 56, justifyContent: 'center' }}>#{idx + 1}</div>
                    <div>
                      <div style={{ fontWeight: 900 }} className="mono">{short(r.owner)}</div>
                      <div className="subtle">Claimed tiles: {r.tiles}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900 }}>{formatEther(r.claimedWei)} BNB</div>
                    <div className="subtle">claimed</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="subtle" style={{ marginTop: 14, fontSize: 12, lineHeight: 1.5 }}>
            Note: MVP backfills the last ~50k blocks and then streams new events in real time.
          </div>
        </div>
      </div>
    </main>
  )
}
