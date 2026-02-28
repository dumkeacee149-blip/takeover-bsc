import { Address, Hex, createPublicClient, http, parseEther, formatEther, readContract, type PublicClient } from 'viem'
import { GRID_REGISTRY_ABI } from './abis'
import { CHAIN_ID } from './chain'

export type Strategy = 'cheapest' | 'random' | 'defend'

export type MoveSuggestionRequest = {
  coin: string
  budgetBnb: string
  maxPriceBnb: string
  strategy?: Strategy
  myAddress?: string
  recentLosses?: Array<{ tileId: number }>
}

export type MoveSuggestion = {
  ok: boolean
  mode: 'agent'
  strategy: Strategy
  tileId: number
  priceBnb: string
  reason: string
  candidatesCount: number
  boardSize: number
}

export type BoardTile = {
  tileId: number
  owner: Address
  priceWei: bigint
}

export type PlanError = {
  ok: false
  error: string
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEFAULT_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545/'

function getRpcUrl() {
  return process.env.BSC_TESTNET_RPC || process.env.NEXT_PUBLIC_BSC_TESTNET_RPC || DEFAULT_RPC
}

function getClient(): PublicClient {
  return createPublicClient({
    chain: {
      id: CHAIN_ID,
      name: 'BSC Testnet',
      network: 'testnet',
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      rpcUrls: {
        default: { http: [getRpcUrl()] },
      },
    },
    transport: http(getRpcUrl()),
  })
}

function parseBnb(value: string): bigint | null {
  const normalized = (value || '').trim()
  if (!normalized) return null
  try {
    return parseEther(normalized as `${number}`)
  } catch {
    return null
  }
}

export async function fetchBoard(coin: string, gridRegistry: string): Promise<BoardTile[]> {
  const client = getClient()
  const tileCount = Number(await readContract(client, {
    address: gridRegistry as Address,
    abi: GRID_REGISTRY_ABI,
    functionName: 'TILE_COUNT',
  }))

  const reads = Array.from({ length: tileCount }, (_, tileId) =>
    readContract(client, {
      address: gridRegistry as Address,
      abi: GRID_REGISTRY_ABI,
      functionName: 'getTile',
      args: [coin as Address, BigInt(tileId)],
    }).then((out: any) => ({
      tileId,
      owner: (out?.[0] as Address) || ZERO_ADDRESS,
      priceWei: (out?.[1] as bigint) || 0n,
    }))
  )

  return Promise.all(reads)
}

export function suggestMove(board: BoardTile[], request: MoveSuggestionRequest): MoveSuggestion | PlanError {
  const strategy: Strategy = request.strategy || 'cheapest'
  const maxPriceWei = parseBnb(request.maxPriceBnb)
  const budgetWei = parseBnb(request.budgetBnb)

  if (maxPriceWei === null || maxPriceWei <= 0n) {
    return { ok: false, error: 'Invalid maxPriceBnb' } as PlanError
  }
  if (budgetWei === null || budgetWei <= 0n) {
    return { ok: false, error: 'Invalid budgetBnb' } as PlanError
  }

  const my = request.myAddress?.toLowerCase()

  // Exclude own tiles (or empty) and keep those within budget constraints.
  let candidates = board
    .map((t) => ({ ...t }))
    .filter((t) => t.owner !== ZERO_ADDRESS)
    .filter((t) => t.priceWei > 0n)
    .filter((t) => t.priceWei <= maxPriceWei)
    .filter((t) => t.priceWei <= budgetWei)

  if (my) {
    candidates = candidates.filter((t) => t.owner.toLowerCase() !== my)
  }

  // Optional defend mode: if recent losses available, prefer reclaiming those tiles first.
  if (strategy === 'defend' && request.recentLosses?.length) {
    const recentIds = new Set(request.recentLosses.map((r) => r.tileId))
    const defendCandidates = candidates
      .filter((t) => recentIds.has(t.tileId))
      .sort((a, b) => {
        if (a.priceWei === b.priceWei) return b.tileId - a.tileId
        return a.priceWei < b.priceWei ? -1 : 1
      })
    if (defendCandidates.length > 0) {
      const t = defendCandidates[0]
      return {
        ok: true,
        mode: 'agent',
        strategy,
        tileId: t.tileId,
        priceBnb: formatEther(t.priceWei),
        reason: `Defend: reclaim recent tile #${t.tileId} (cheapest among candidates).`,
        candidatesCount: defendCandidates.length,
        boardSize: board.length,
      }
    }
  }

  if (candidates.length === 0) {
    return {
      ok: false,
      error: 'No candidate tiles within constraints. Raise max price or budget.',
    } as PlanError
  }

  let pick = candidates[0]
  if (strategy === 'random') {
    pick = candidates[Math.floor(Math.random() * candidates.length)]
  } else {
    // cheapest
    for (const t of candidates) {
      if (t.priceWei < pick.priceWei) pick = t
    }
  }

  const reason =
    strategy === 'random'
      ? `Random pick among ${candidates.length} eligible tiles.`
      : `Cheapest eligible tile among ${candidates.length}.`

  return {
    ok: true,
    mode: 'agent',
    strategy,
    tileId: pick.tileId,
    priceBnb: formatEther(pick.priceWei),
    reason,
    candidatesCount: candidates.length,
    boardSize: board.length,
  }
}

export async function getMoveSuggestion(req: MoveSuggestionRequest, gridRegistry: string): Promise<MoveSuggestion | PlanError> {
  const board = await fetchBoard(req.coin, gridRegistry)
  return suggestMove(board, req)
}

export function sanitizePlanBody(input: any): MoveSuggestionRequest {
  return {
    coin: (input.coin || '').trim(),
    budgetBnb: String(input.budgetBnb || '').trim(),
    maxPriceBnb: String(input.maxPriceBnb || '').trim(),
    strategy: (input.strategy || 'cheapest') as Strategy,
    myAddress: input.myAddress ? String(input.myAddress).trim() : undefined,
    recentLosses: Array.isArray(input.recentLosses)
      ? input.recentLosses
          .map((x: any) => ({ tileId: Number(x?.tileId) }))
          .filter((x) => Number.isInteger(x.tileId) && x.tileId >= 0)
      : [],
  }
}

export { getClient }