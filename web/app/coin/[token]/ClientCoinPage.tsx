'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatEther } from 'viem'
import { useAccount, useReadContract, useReadContracts, useWatchContractEvent, useWriteContract } from 'wagmi'

import TileIcon from '../../components/TileIcon'
import WalletAvatar from '../../components/WalletAvatar'
import { assertWebConfig } from '../../lib/chain'
import { gridRegistry, feeVault } from '../../lib/contracts'

function getMode(searchParams: Record<string, string | string[] | undefined>) {
  const m = searchParams.mode
  return (Array.isArray(m) ? m[0] : m) === 'agent' ? 'agent' : 'human'
}

function BoardTile({ id, variant, selected, onSelect }: { id: number; variant?: 'none' | 'owned' | 'mine'; selected?: boolean; onSelect?: (id:number)=>void }) {
  const cls = variant === 'mine' ? 'boardTile boardTileMine' : variant === 'owned' ? 'boardTile boardTileOwned' : 'boardTile'
  const hue = (id * 37) % 360
  return (
    <button
      className={selected ? cls + ' boardTileSelected' : cls}
      onClick={() => onSelect?.(id)}
      type="button"
      title={`Tile ${id}`}
    >
      <TileIcon seed={1337 + id * 97} hue={hue} size={3} />
    </button>
  )
}

function short(addr?: string) {
  if (!addr) return ''
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

export default function ClientCoinPage({ token, searchParams }: { token: `0x${string}`; searchParams: Record<string, string | string[] | undefined> }) {
  const mode = getMode(searchParams)
  const { address, chainId } = useAccount()

  const tiles = useMemo(() => Array.from({ length: 100 }, (_, i) => i), [])
  const [selectedTile, setSelectedTile] = useState<number>(22)

  // Config guard
  try { assertWebConfig() } catch (e:any) {
    return (
      <main className="container">
        <h1>Config missing</h1>
        <p className="mono subtle">{String(e?.message || e)}</p>
        <p className="subtle">Set NEXT_PUBLIC_GRID_REGISTRY and NEXT_PUBLIC_FEE_VAULT in web/.env.local</p>
      </main>
    )
  }

  // Selected tile (detailed view)
  const tileRead = useReadContract({
    ...gridRegistry,
    functionName: 'getTile',
    args: [token, BigInt(selectedTile)],
    query: { refetchInterval: 4000 },
  })

  const owner = (tileRead.data?.[0] as string | undefined) || undefined
  const priceWei = (tileRead.data?.[1] as bigint | undefined) || 0n

  // Global board state (owners for all 100 tiles) via batched reads.
  // This is an MVP approach; later we can index events for faster initial load.
  const allTilesRead = useReadContracts({
    contracts: tiles.map((id) => ({
      ...gridRegistry,
      functionName: 'getTile',
      args: [token, BigInt(id)],
    })) as any,
    query: { refetchInterval: 8000 },
  })

  const tileOwners = useMemo(() => {
    const res = allTilesRead.data || []
    return res.map((r: any) => (r?.result?.[0] as string | undefined) || '0x0000000000000000000000000000000000000000')
  }, [allTilesRead.data])

  const pendingRead = useReadContract({
    ...feeVault,
    functionName: 'pending',
    args: [token, BigInt(selectedTile)],
    query: { refetchInterval: 4000 },
  })

  const pendingWei = (pendingRead.data as bigint | undefined) || 0n

  const me = address?.toLowerCase()
  const isMine = !!(me && owner && owner.toLowerCase() === me)

  const { writeContractAsync, isPending } = useWriteContract()

  // Live feed (session-local): takeovers + claims + withdrawals, plus running totals since page load.
  const [feed, setFeed] = useState<Array<{ kind: string; msg: string; ts: number }>>([])
  const [totals, setTotals] = useState<{ takeovers: number; claimedWei: bigint; protocolFeesWei: bigint; buyoutsWei: bigint }>({
    takeovers: 0,
    claimedWei: 0n,
    protocolFeesWei: 0n,
    buyoutsWei: 0n,
  })

  function pushFeed(kind: string, msg: string) {
    setFeed((prev) => [{ kind, msg, ts: Date.now() }, ...prev].slice(0, 30))
  }

  useWatchContractEvent({
    ...gridRegistry,
    eventName: 'Takeover',
    args: { coin: token } as any,
    onLogs(logs) {
      for (const l of logs as any[]) {
        const a = l?.args
        if (!a) continue
        const tileId = Number(a.tileId)
        const newOwner = a.newOwner as string
        const paidWei = a.paidWei as bigint
        const compensationWei = a.compensationWei as bigint
        const protocolFeeWei = a.protocolFeeWei as bigint
        const newPriceWei = a.newPriceWei as bigint

        setTotals((t) => ({
          ...t,
          takeovers: t.takeovers + 1,
          protocolFeesWei: t.protocolFeesWei + (protocolFeeWei || 0n),
          buyoutsWei: t.buyoutsWei + (compensationWei || 0n),
        }))

        pushFeed(
          'takeover',
          `Takeover tile #${tileId} by ${short(newOwner)} · paid ${formatEther(paidWei)} · next ${formatEther(newPriceWei)} BNB`
        )
      }
    },
  })

  useWatchContractEvent({
    ...gridRegistry,
    eventName: 'Withdraw',
    onLogs(logs) {
      for (const l of logs as any[]) {
        const a = l?.args
        if (!a) continue
        const user = a.user as string
        const amountWei = a.amountWei as bigint
        // only show on this page when it's you, otherwise it's noisy
        if (address && user?.toLowerCase() === address.toLowerCase()) {
          pushFeed('withdraw', `Buyouts withdrawn by you: ${formatEther(amountWei)} BNB`)
        }
      }
    },
  })

  useWatchContractEvent({
    ...feeVault,
    eventName: 'Claimed',
    args: { coin: token } as any,
    onLogs(logs) {
      for (const l of logs as any[]) {
        const a = l?.args
        if (!a) continue
        const tileId = Number(a.tileId)
        const owner = a.owner as string
        const amountWei = a.amountWei as bigint
        setTotals((t) => ({ ...t, claimedWei: t.claimedWei + (amountWei || 0n) }))
        pushFeed('claim', `Claimed on tile #${tileId} by ${short(owner)} · ${formatEther(amountWei)} BNB`)
      }
    },
  })

  async function doTakeover() {
    // pay exactly current price
    await writeContractAsync({
      ...gridRegistry,
      functionName: 'takeover',
      args: [token, BigInt(selectedTile)],
      value: priceWei,
      chainId: 97,
    } as any)
  }

  async function doClaim() {
    await writeContractAsync({
      ...feeVault,
      functionName: 'claim',
      args: [token, BigInt(selectedTile)],
      chainId: 97,
    } as any)
  }

  async function doWithdraw() {
    await writeContractAsync({
      ...gridRegistry,
      functionName: 'withdraw',
      args: [],
      chainId: 97,
    } as any)
  }

  return (
    <main className="container">
      <div className="sectionTitle">
        <div>
          <h1 style={{ margin: 0 }}>Coin takeover</h1>
          <div className="mono subtle" style={{ marginTop: 6 }}>{token}</div>
          <div className="subtle" style={{ marginTop: 6 }}>Mode: <b>{mode}</b> {mode === 'agent' ? '🤖' : '🧑‍🔧'}</div>
        </div>
        <Link href={`/play?mode=${mode}`} className="btn btnGhost" style={{ textDecoration: 'none' }}>← Back</Link>
      </div>

      <section className="coinLayout">
        <div className="boardCol">
          <div className="boardTitleRow">
            <h3 style={{ margin: 0 }}>Buy any tile</h3>
            <span className="pill">testnet</span>
          </div>

          <div className="boardRow">
            <aside className="card liveFeed">
              <div className="cardPad">
                <div className="sectionTitle" style={{ marginBottom: 10 }}>
                  <h3 style={{ margin: 0 }}>Live</h3>
                  <span className="pill"><span className="subtle">session</span></span>
                </div>
                <div className="kpiRow">
                  <div className="kpi">
                    <div className="kpiLabel">Takeovers</div>
                    <div className="kpiValue">{totals.takeovers}</div>
                  </div>
                  <div className="kpi">
                    <div className="kpiLabel">Protocol fees</div>
                    <div className="kpiValue">{formatEther(totals.protocolFeesWei)}</div>
                  </div>
                  <div className="kpi">
                    <div className="kpiLabel">Claimed</div>
                    <div className="kpiValue">{formatEther(totals.claimedWei)}</div>
                  </div>
                </div>

                <div className="liveFeedList" style={{ marginTop: 12 }}>
                  {feed.length === 0 ? (
                    <div className="subtle" style={{ fontSize: 13 }}>No activity yet. Make a move →</div>
                  ) : (
                    feed.map((f, idx) => (
                      <div key={idx} className="feedLine">
                        <div style={{ fontWeight: 900, lineHeight: 1.35 }}>{f.msg}</div>
                        <div className="feedMeta">
                          <span>{f.kind}</span>
                          <span>{new Date(f.ts).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>

            <div className="boardWrap">
              <div className="board">
                {tiles.map((id) => {
                  const o = tileOwners[id]
                  const isOwned = !!o && o !== '0x0000000000000000000000000000000000000000'
                  const mine = !!(me && o && o.toLowerCase() === me)

                  const variant = mine ? 'mine' : isOwned ? 'owned' : 'none'

                  return (
                    <BoardTile
                      key={id}
                      id={id}
                      variant={variant as any}
                      selected={id === selectedTile}
                      onSelect={setSelectedTile}
                    />
                  )
                })}
              </div>
              <div className="boardGlow" aria-hidden="true" />
            </div>
          </div>
        </div>

        <aside className="card infoCol">
          <div className="cardPad">
            <div className="sectionTitle">
              <h3 style={{ margin: 0 }}>Tile #{selectedTile}</h3>
              <span className="pill"><span className="subtle">onchain</span></span>
            </div>
            <div className="list">
              <div className="item"><div className="subtle">Owner</div><div className="ownerRow"><WalletAvatar address={owner} size={26} /><div className="mono">{owner ? short(owner) : '—'}</div></div></div>
              <div className="item"><div className="subtle">Price</div><div><b>{priceWei ? formatEther(priceWei) : '0'}</b> BNB</div></div>
              <div className="item"><div className="subtle">Claimable</div><div><b>{pendingWei ? formatEther(pendingWei) : '0'}</b> BNB</div></div>
              <div className="item"><div className="subtle">Buyout</div><div className="subtle">90% → prev owner, 10% → FeeVault</div></div>
            </div>
            <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
              <button className="btn btnPrimary" type="button" disabled={isPending || priceWei === 0n} onClick={doTakeover}>Takeover (pay {priceWei ? formatEther(priceWei) : '0'} BNB)</button>
              <button className="btn" type="button" disabled={isPending || !isMine || pendingWei === 0n} onClick={doClaim}>Claim fees</button>
              <button className="btn btnGhost" type="button" disabled={isPending} onClick={doWithdraw}>Withdraw buyouts</button>
            </div>
            <div className="footer">Connected: {address ? short(address) : 'not connected'}{chainId ? ` · chain ${chainId}` : ''}</div>
          </div>
        </aside>

        {mode === 'agent' ? (
          <aside className="card agentPanel" style={{ width: 360 }}>
            <div className="cardPad">
              <div className="sectionTitle">
                <h3 style={{ margin: 0 }}>Agent Panel</h3>
                <span className="pill">🦞 auto-suggest</span>
              </div>
              <p className="subtle" style={{ marginTop: 0 }}>
                MVP: agent suggests a move; you still sign every transaction.
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                <label className="subtle">Budget (BNB)
                  <input className="btn" style={{ width: '100%', justifyContent: 'flex-start' }} placeholder="0.5" />
                </label>
                <label className="subtle">Max price per tile (BNB)
                  <input className="btn" style={{ width: '100%', justifyContent: 'flex-start' }} placeholder="0.05" />
                </label>
                <label className="subtle">Strategy
                  <select className="btn" style={{ width: '100%' }} defaultValue="cheapest">
                    <option value="cheapest">Cheapest</option>
                    <option value="random">Random</option>
                    <option value="defend">Defend my tiles</option>
                  </select>
                </label>
                <button className="btn btnPrimary" type="button">Suggest Move</button>
                <button className="btn" type="button">Execute (sign tx)</button>
              </div>
            </div>
          </aside>
        ) : null}
      </section>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="cardPad">
          <div className="subtle">Contracts</div>
          <div className="mono" style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            <div>GridRegistry: {gridRegistry.address}</div>
            <div>FeeVault: {feeVault.address}</div>
          </div>
        </div>
      </div>
    </main>
  )
}
