'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { formatEther, parseEther } from 'viem'
import { useAccount, useReadContract, useReadContracts, useWatchContractEvent, useWriteContract } from 'wagmi'

import TileIcon from '../../components/TileIcon'
import WalletAvatar from '../../components/WalletAvatar'
import { assertWebConfig } from '../../lib/chain'
import { gridRegistry, feeVault } from '../../lib/contracts'

function getMode(searchParams: Record<string, string | string[] | undefined>) {
  const m = searchParams.mode
  return (Array.isArray(m) ? m[0] : m) === 'agent' ? 'agent' : 'human'
}

const BoardTile = React.memo(function BoardTile({
  id,
  variant,
  selected,
  onSelect,
  compact,
}: {
  id: number
  variant?: 'none' | 'owned' | 'mine'
  selected?: boolean
  onSelect?: (id: number) => void
  compact?: boolean
}) {
  const cls = variant === 'mine' ? 'boardTile boardTileMine' : variant === 'owned' ? 'boardTile boardTileOwned' : 'boardTile'
  const hue = (id * 37) % 360

  return (
    <button
      className={selected ? cls + ' boardTileSelected' : cls}
      onClick={() => onSelect?.(id)}
      type="button"
      title={`Tile ${id}`}
    >
      {compact && !selected ? (
        <div className="miniPix" style={{ background: `hsl(${hue} 92% 58%)` }} />
      ) : (
        <TileIcon seed={1337 + id * 97} hue={hue} size={compact ? 1 : 3} />
      )}
    </button>
  )
})

function short(addr?: string) {
  if (!addr) return ''
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

export default function ClientCoinPage({ token, searchParams }: { token: `0x${string}`; searchParams: Record<string, string | string[] | undefined> }) {
  const mode = getMode(searchParams)
  const { address, chainId } = useAccount()

  const tiles = useMemo(() => Array.from({ length: 100 }, (_, i) => i), [])
  const [selectedTile, setSelectedTile] = useState<number>(22)
  const onSelectTile = useCallback((id: number) => {
    setSelectedTile((prev) => (prev === id ? prev : id))
  }, [])
  const [showLive, setShowLive] = useState<boolean>(false)

  const [isMobile, setIsMobile] = useState(false)
  const [boardFetchEnabled, setBoardFetchEnabled] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 560px)')
    const apply = () => setIsMobile(mq.matches)
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])

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
    query: { refetchInterval: isMobile ? false : 4000 },
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
    query: {
      // Performance (mobile): don't hammer RPC with 100 reads + polling.
      enabled: !isMobile || boardFetchEnabled,
      refetchInterval: isMobile ? false : 8000,
    },
  })

  const tileOwners = useMemo(() => {
    const res = allTilesRead.data || []
    return res.map((r: any) => (r?.result?.[0] as string | undefined) || '0x0000000000000000000000000000000000000000')
  }, [allTilesRead.data])

  const tilePrices = useMemo(() => {
    const res = allTilesRead.data || []
    return res.map((r: any) => (r?.result?.[1] as bigint | undefined) || 0n)
  }, [allTilesRead.data])

  const pendingRead = useReadContract({
    ...feeVault,
    functionName: 'pending',
    args: [token, BigInt(selectedTile)],
    query: { refetchInterval: isMobile ? false : 4000 },
  })

  const pendingWei = (pendingRead.data as bigint | undefined) || 0n

  const me = address?.toLowerCase()
  const isMine = !!(me && owner && owner.toLowerCase() === me)

  const { writeContractAsync, isPending } = useWriteContract()
  const [txHash, setTxHash] = useState<string>('')

  // Live feed (session-local): takeovers + claims + withdrawals, plus running totals since page load.
  const [feed, setFeed] = useState<Array<{ kind: string; msg: string; ts: number }>>([])
  const [recentTakeovers, setRecentTakeovers] = useState<Array<{ tileId: number; oldOwner: string; newOwner: string; priceWei: bigint; ts: number }>>([])
  const [totals, setTotals] = useState<{ takeovers: number; claimedWei: bigint; protocolFeesWei: bigint; buyoutsWei: bigint }>({
    takeovers: 0,
    claimedWei: 0n,
    protocolFeesWei: 0n,
    buyoutsWei: 0n,
  })

  const showLiveRef = useRef(showLive)
  useEffect(() => {
    showLiveRef.current = showLive
  }, [showLive])

  // On mobile default mode we cut down churn by pausing live updates unless panel is shown.
  const shouldCollectLive = useMemo(() => !isMobile || showLive,
    [isMobile, showLive]
  )

  function pushFeed(kind: string, msg: string) {
    if (!shouldCollectLive) return

    // Performance: when live is collapsed (common on mobile), keep only last 2 messages.
    const cap = isMobile ? 2 : (showLiveRef.current ? 30 : 2)
    setFeed((prev) => [{ kind, msg, ts: Date.now() }, ...prev].slice(0, cap))
  }

  useWatchContractEvent({
    ...gridRegistry,
    enabled: shouldCollectLive,
    eventName: 'Takeover',
    args: { coin: token } as any,
    onLogs(logs) {
      for (const l of logs as any[]) {
        const a = l?.args
        if (!a) continue
        const tileId = Number(a.tileId)
        const oldOwner = a.oldOwner as string
        const newOwner = a.newOwner as string
        const paidWei = a.paidWei as bigint
        const compensationWei = a.compensationWei as bigint
        const protocolFeeWei = a.protocolFeeWei as bigint
        const newPriceWei = a.newPriceWei as bigint

        if (!isMobile && showLiveRef.current) {
          setTotals((t) => ({
            ...t,
            takeovers: t.takeovers + 1,
            protocolFeesWei: t.protocolFeesWei + (protocolFeeWei || 0n),
            buyoutsWei: t.buyoutsWei + (compensationWei || 0n),
          }))
        }

        if (shouldCollectLive) {
          setRecentTakeovers((prev) => [{ tileId, oldOwner, newOwner, priceWei: paidWei, ts: Date.now() }, ...prev].slice(0, 25))
        }

        if (shouldCollectLive) {
          pushFeed(
            'takeover',
            `Takeover tile #${tileId} by ${short(newOwner)} · paid ${formatEther(paidWei)} · next ${formatEther(newPriceWei)} BNB`
          )
        }
      }
    },
  })

  useWatchContractEvent({
    ...gridRegistry,
    enabled: shouldCollectLive,
    eventName: 'Withdraw',
    onLogs(logs) {
      for (const l of logs as any[]) {
        const a = l?.args
        if (!a) continue
        const user = a.user as string
        const amountWei = a.amountWei as bigint
        // only show on this page when it's you, otherwise it's noisy
        if (shouldCollectLive && address && user?.toLowerCase() === address.toLowerCase()) {
          pushFeed('withdraw', `Buyouts withdrawn by you: ${formatEther(amountWei)} BNB`)
        }
      }
    },
  })

  useWatchContractEvent({
    ...feeVault,
    enabled: shouldCollectLive,
    eventName: 'Claimed',
    args: { coin: token } as any,
    onLogs(logs) {
      for (const l of logs as any[]) {
        const a = l?.args
        if (!a) continue
        const tileId = Number(a.tileId)
        const owner = a.owner as string
        const amountWei = a.amountWei as bigint
        if (!isMobile && showLiveRef.current) setTotals((t) => ({ ...t, claimedWei: t.claimedWei + (amountWei || 0n) }))
        if (shouldCollectLive) {
          pushFeed('claim', `Claimed on tile #${tileId} by ${short(owner)} · ${formatEther(amountWei)} BNB`)
        }
      }
    },
  })

  async function doTakeover() {
    // pay exactly current price
    setTxHash('')
    const hash = await writeContractAsync({
      ...gridRegistry,
      functionName: 'takeover',
      args: [token, BigInt(selectedTile)],
      value: priceWei,
      chainId: 97,
    } as any)
    if (hash) setTxHash(String(hash))
  }

  async function doClaim() {
    setTxHash('')
    const hash = await writeContractAsync({
      ...feeVault,
      functionName: 'claim',
      args: [token, BigInt(selectedTile)],
      chainId: 97,
    } as any)
    if (hash) setTxHash(String(hash))
  }

  async function doWithdraw() {
    setTxHash('')
    const hash = await writeContractAsync({
      ...gridRegistry,
      functionName: 'withdraw',
      args: [],
      chainId: 97,
    } as any)
    if (hash) setTxHash(String(hash))
  }

  // Agent Panel (MVP): local suggestion only, user still signs.
  const [budgetStr, setBudgetStr] = useState('0.5')
  const [maxPriceStr, setMaxPriceStr] = useState('0.05')
  const [strategy, setStrategy] = useState<'cheapest' | 'random' | 'defend'>('cheapest')
  const [suggestion, setSuggestion] = useState<string>('')
  const [remoteBusy, setRemoteBusy] = useState<boolean>(false)

  function parseBNB(s: string): bigint | null {
    const t = (s || '').trim()
    if (!t) return null
    try {
      return parseEther(t as any)
    } catch {
      return null
    }
  }

  function suggestMove() {
    const maxPriceWei = parseBNB(maxPriceStr)
    const budgetWei = parseBNB(budgetStr)

    if (!address) {
      setSuggestion('Connect wallet first.')
      return
    }
    if (maxPriceWei === null || maxPriceWei <= 0n) {
      setSuggestion('Invalid max price.')
      return
    }
    if (budgetWei === null || budgetWei <= 0n) {
      setSuggestion('Invalid budget.')
      return
    }

    // Defend mode: try to buy back the most recently taken tile from you (if affordable).
    if (strategy === 'defend') {
      const hits = recentTakeovers
        .filter((t) => t.oldOwner?.toLowerCase() === address.toLowerCase())
        .slice(0, 10)

      // Prefer: within constraints, then cheapest; tiebreaker: most recent.
      const viable = hits
        .map((t) => ({
          ...t,
          currentPriceWei: tilePrices[t.tileId] || 0n,
        }))
        .filter((t) => t.currentPriceWei > 0n && t.currentPriceWei <= maxPriceWei && t.currentPriceWei <= budgetWei)

      if (viable.length > 0) {
        viable.sort((a, b) => {
          if (a.currentPriceWei < b.currentPriceWei) return -1
          if (a.currentPriceWei > b.currentPriceWei) return 1
          return b.ts - a.ts
        })

        const best = viable[0]
        setSelectedTile(best.tileId)
        setSuggestion(`Defend: buy back tile #${best.tileId} at ${formatEther(best.currentPriceWei)} BNB (cheapest among recent losses).`)
        return
      }

      if (hits.length > 0) {
        setSuggestion('Defend: no recent lost tiles match your constraints. Try raising max price / budget.')
        // continue to normal selection
      }
    }

    // Candidate set: not mine + price within limits
    const candidates: number[] = []
    for (let i = 0; i < 100; i++) {
      const o = tileOwners[i]
      const p = tilePrices[i]
      const mine = !!(me && o && o.toLowerCase() === me)
      if (mine) continue
      if (p <= 0n) continue
      if (p > maxPriceWei) continue
      if (p > budgetWei) continue
      candidates.push(i)
    }

    if (candidates.length === 0) {
      setSuggestion('No tiles match your constraints. Increase max price / budget.')
      return
    }

    let pick = candidates[0]
    if (strategy === 'random') {
      pick = candidates[Math.floor(Math.random() * candidates.length)]
    } else {
      // cheapest
      pick = candidates.reduce((best, id) => (tilePrices[id] < tilePrices[best] ? id : best), candidates[0])
    }

    setSelectedTile(pick)
    setSuggestion(`Suggested tile #${pick} at ${formatEther(tilePrices[pick])} BNB (${strategy}).`)
  }

  async function executeSuggested() {
    if (!address) {
      setSuggestion('Connect wallet first.')
      return
    }
    await doTakeover()
  }

  async function planRemoteMove() {
    setRemoteBusy(true)
    setSuggestion('Requesting remote plan...')

    try {
      const payload: any = {
        coin: token,
        budgetBnb: budgetStr,
        maxPriceBnb: maxPriceStr,
        strategy,
      }

      if (address) payload.myAddress = address
      if (strategy === 'defend') {
        payload.recentLosses = recentTakeovers.slice(0, 12).map((t) => ({ tileId: t.tileId }))
      }

      const res = await fetch('/api/agent/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        setSuggestion(`Remote plan failed: ${data?.error || 'unknown error'}`)
        return
      }
      const s = data.suggestion
      if (s && s.tileId !== undefined) {
        setSelectedTile(Number(s.tileId))
        setSuggestion(`Remote plan: tile #${s.tileId}, price ${s.priceBnb} BNB, ${s.reason}`)
      } else {
        setSuggestion('Remote plan: no result.')
      }
    } catch (err: any) {
      setSuggestion(`Remote plan failed: ${String(err?.message || err)}`)
    } finally {
      setRemoteBusy(false)
    }
  }

  async function executeRemoteMove() {
    setRemoteBusy(true)
    setSuggestion('Requesting remote execute...')

    try {
      const payload: any = {
        coin: token,
        budgetBnb: budgetStr,
        maxPriceBnb: maxPriceStr,
        strategy,
      }
      if (address) payload.myAddress = address
      if (strategy === 'defend') {
        payload.recentLosses = recentTakeovers.slice(0, 12).map((t) => ({ tileId: t.tileId }))
      }

      const res = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        setSuggestion(`Remote execute failed: ${data?.error || 'unknown error'}`)
        return
      }

      if (data.dryRun) {
        setSuggestion(`Remote dry-run OK: tile #${data.tileId}, value ${data.valueBnb} BNB`)
        return
      }

      const hash = data.txHash
      if (hash) {
        setTxHash(String(hash))
        setSuggestion(`Remote executed on-chain: tile #${data.tileId}, value ${data.valueBnb} BNB`)
      } else {
        setSuggestion('Remote executed, but tx hash missing from response.')
      }
    } catch (err: any) {
      setSuggestion(`Remote execute failed: ${String(err?.message || err)}`)
    } finally {
      setRemoteBusy(false)
    }
  }

  return (
    <main className="container">
      <div className="sectionTitle">
        <div>
          <h1 style={{ margin: 0 }}>{mode === 'agent' ? 'Agent' : 'Human'} · Buy a tile</h1>
          <div className="subtle" style={{ marginTop: 6 }}>
            <span className="pill"><span className="mono" style={{ fontSize: 12 }}>{short(token)}</span></span>
            <span className="pill" style={{ marginLeft: 10 }}>testnet</span>
          </div>
        </div>
        <Link href={`/play?mode=${mode}`} className="btn btnGhost" style={{ textDecoration: 'none' }}>← Back</Link>
      </div>

      <section className="coinLayout">
        <div className="boardCol">
          <div className="boardTitleRow">
            <h3 style={{ margin: 0 }}>Board</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {isMobile ? (
                <button
                  className="btn btnGhost"
                  type="button"
                  onClick={() => {
                    if (!boardFetchEnabled) {
                      setBoardFetchEnabled(true)
                      setTimeout(() => allTilesRead.refetch?.(), 50)
                    } else {
                      allTilesRead.refetch?.()
                    }
                  }}
                >
                  {boardFetchEnabled ? 'Refresh board' : 'Load board'}
                </button>
              ) : null}
              <button className="btn btnGhost" type="button" onClick={() => setShowLive((v) => !v)}>
                {showLive ? 'Hide' : 'Show'} live
              </button>
            </div>
          </div>

          <div className="boardRow">
            {!isMobile || showLive ? (
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
                      feed.slice(0, isMobile ? 2 : feed.length).map((f, idx) => (
                        <div key={idx} className={"feedLine " + (f.kind || '')}>
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
            ) : null}
            <div className="coinBoardWrap">
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
                      onSelect={onSelectTile}
                      compact={isMobile}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TileIcon seed={1337 + selectedTile * 97} hue={(selectedTile * 37) % 360} size={2} />
                <h3 style={{ margin: 0 }}>Tile #{selectedTile}</h3>
              </div>
              <span className="pill"><span className="subtle">ONCHAIN</span></span>
            </div>
            <div className="list">
              <div className="statRow">
                <div className="statLeft">
                  <WalletAvatar address={owner} size={26} />
                  <div style={{ display: 'grid', gap: 2 }}>
                    <div className="statLabel">Owner</div>
                    <div className="mono" style={{ fontWeight: 900 }}>{owner ? short(owner) : '—'}</div>
                  </div>
                </div>
                <span className="pill"><span className="subtle">onchain</span></span>
              </div>

              <div className="statRow">
                <div className="statLabel">Price</div>
                <div className="statValueBig">{priceWei ? formatEther(priceWei) : '0'} <span className="statSub">BNB</span></div>
              </div>

              <div className="statRow">
                <div className="statLabel">Claimable</div>
                <div className="statValue">{pendingWei ? formatEther(pendingWei) : '0'} <span className="statSub">BNB</span></div>
              </div>

              <div className="statRow">
                <div className="statLabel">Buyout split</div>
                <div className="statSub">90% → prev owner · 10% → FeeVault</div>
              </div>
            </div>
            <div className="actionStack">
              {txHash ? (
                <div className="hint" style={{ marginTop: 0 }}>
                  <a
                    href={`https://testnet.bscscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="subtle"
                  >
                    Tx sent: {txHash.slice(0, 10)}… (view on BscScan)
                  </a>
                </div>
              ) : null}
              <button className="btn btnPrimary btnFull" type="button" disabled={isPending || priceWei === 0n} onClick={doTakeover}>
                TAKEOVER · {priceWei ? formatEther(priceWei) : '0'} BNB
              </button>
              <button className="btn btnFull" type="button" disabled={isPending || !isMine || pendingWei === 0n} onClick={doClaim}>
                CLAIM FEES
              </button>
              <button className="btn btnGhost btnFull" type="button" disabled={isPending} onClick={doWithdraw}>
                WITHDRAW BUYOUTS
              </button>
            </div>

            {!address ? (
              <div className="hint">
                Connect wallet to takeover tiles. If your wallet is on the wrong network, switch to <b>BSC Testnet (97)</b>.
              </div>
            ) : null}

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
                MVP: local suggest still requires wallet sign; remote API can execute with server agent wallet.
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                <label className="subtle">Budget (BNB)
                  <input
                    className="btn"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    value={budgetStr}
                    onChange={(e) => setBudgetStr(e.target.value)}
                    inputMode="decimal"
                  />
                </label>
                <label className="subtle">Max price per tile (BNB)
                  <input
                    className="btn"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    value={maxPriceStr}
                    onChange={(e) => setMaxPriceStr(e.target.value)}
                    inputMode="decimal"
                  />
                </label>
                <label className="subtle">Strategy
                  <select className="btn" style={{ width: '100%' }} value={strategy} onChange={(e) => setStrategy(e.target.value as any)}>
                    <option value="cheapest">Cheapest</option>
                    <option value="random">Random</option>
                    <option value="defend">Defend (buy back)</option>
                  </select>
                </label>

                {suggestion ? (
                  <div className="hint" style={{ marginTop: 2 }}>{suggestion}</div>
                ) : null}

                <button className="btn btnPrimary" type="button" onClick={suggestMove}>Suggest Move</button>
                <button className="btn" type="button" onClick={executeSuggested} disabled={isPending || priceWei === 0n}>Execute (sign tx)</button>
                <button className="btn btnGhost" type="button" onClick={planRemoteMove} disabled={remoteBusy}>Plan via remote API</button>
                <button className="btn btnPrimary" type="button" onClick={executeRemoteMove} disabled={remoteBusy}>
                  Execute via remote API
                </button>
              </div>
            </div>
          </aside>
        ) : null}
      </section>

      <details className="card contractsCard" style={{ marginTop: 16 }}>
        <summary className="cardPad contractsSummary">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ fontWeight: 950 }}>Contracts</div>
            <span className="subtle">tap</span>
          </div>
        </summary>
        <div className="cardPad" style={{ paddingTop: 0 }}>
          <div className="mono" style={{ display: 'grid', gap: 6, marginTop: 8 }}>
            <div>GridRegistry: {gridRegistry.address}</div>
            <div>FeeVault: {feeVault.address}</div>
          </div>
        </div>
      </details>
    </main>
  )
}
