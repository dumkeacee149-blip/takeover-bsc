import { NextResponse } from 'next/server'
import { CHAIN_ID, GRID_REGISTRY } from '../../../lib/chain'
import { GRID_REGISTRY_ABI } from '../../../lib/abis'
import {
  getMoveSuggestion,
  sanitizePlanBody,
} from '../../../lib/agentEngine'
import {
  createWalletClient,
  createPublicClient,
  formatEther,
  getAddress,
  http,
  parseEther,
  readContract,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

export const runtime = 'nodejs'

type Body = {
  coin?: string
  budgetBnb?: string
  maxPriceBnb?: string
  strategy?: 'cheapest' | 'random' | 'defend'
  dryRun?: boolean
  myAddress?: string
  recentLosses?: Array<{ tileId: number }>
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
}

function badRequest(msg: string) {
  return NextResponse.json({ ok: false, error: msg }, { status: 400 })
}

function getRpcUrl() {
  return process.env.BSC_TESTNET_RPC || process.env.NEXT_PUBLIC_BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/'
}

function getToken(req: Request) {
  const header = req.headers.get('authorization') || ''
  if (header.toLowerCase().startsWith('bearer ')) return header.slice(7)
  return header || req.headers.get('x-agent-token') || ''
}

const BSC_TESTNET_CHAIN = {
  id: CHAIN_ID,
  name: 'BSC Testnet',
  network: 'testnet',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: { default: { http: [getRpcUrl()] } },
}

export async function POST(request: Request) {
  const secret = process.env.AGENT_API_TOKEN || ''
  const token = getToken(request)
  if (secret && token !== secret) return unauthorized()

  const payload = (await request.json().catch(() => null)) as Body | null
  if (!payload || !payload.coin || !payload.budgetBnb || !payload.maxPriceBnb) {
    return badRequest('Missing required fields: coin, budgetBnb, maxPriceBnb')
  }

  const requestPlan = sanitizePlanBody(payload)
  const suggestion = await getMoveSuggestion(requestPlan, GRID_REGISTRY)
  if ('error' in suggestion && !suggestion.ok) {
    return badRequest((suggestion as any).error)
  }

  const privateKey = process.env.AGENT_PRIVATE_KEY || ''
  if (!privateKey) return badRequest('AGENT_PRIVATE_KEY not configured')

  const rpc = getRpcUrl()
  const publicClient = createPublicClient({
    chain: BSC_TESTNET_CHAIN,
    transport: http(rpc),
  })

  const coin = getAddress(payload.coin)
  const tile = Number((suggestion as any).tileId)

  const tileData = (await readContract(publicClient, {
    address: GRID_REGISTRY,
    abi: GRID_REGISTRY_ABI,
    functionName: 'getTile',
    args: [coin, BigInt(tile)],
  })) as any

  const tileOwner = (tileData?.[0] as string) || '0x0000000000000000000000000000000000000000'
  const priceWei = (tileData?.[1] as bigint) || 0n

  if (!tileOwner || tileOwner.toLowerCase() === '0x0000000000000000000000000000000000000000') {
    return badRequest('Tile is not initialized with a valid owner, aborting.')
  }
  if (priceWei <= 0n) return badRequest('Computed tile price is zero, aborting.')

  const maxPriceWei = parseEther(requestPlan.maxPriceBnb)
  const budgetWei = parseEther(requestPlan.budgetBnb)
  if (priceWei > maxPriceWei || priceWei > budgetWei) {
    return badRequest('Execution aborted: tile price changed beyond configured limits')
  }

  const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`)

  if (payload.dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      agent: account.address,
      tileId: tile,
      valueBnb: formatEther(priceWei),
      txHash: null,
      suggestion,
      explorer: `https://testnet.bscscan.com/address/${account.address}`,
    })
  }

  const walletClient = createWalletClient({
    account,
    chain: BSC_TESTNET_CHAIN,
    transport: http(rpc),
  })

  const txHash = await walletClient.writeContract({
    address: GRID_REGISTRY,
    abi: GRID_REGISTRY_ABI,
    functionName: 'takeover',
    args: [coin, BigInt(tile)],
    value: priceWei,
    account,
    chain: BSC_TESTNET_CHAIN,
  })

  return NextResponse.json({
    ok: true,
    txHash: txHash,
    explorer: `https://testnet.bscscan.com/tx/${txHash}`,
    tileId: tile,
    valueBnb: formatEther(priceWei),
    strategy: requestPlan.strategy || 'cheapest',
    agent: account.address,
    suggestion,
  })
}

export async function GET() {
  return NextResponse.json({
    ok: false,
    error:
      'Use POST /api/agent/execute with JSON body: coin, budgetBnb, maxPriceBnb, strategy. Optional: myAddress, recentLosses, dryRun=true',
  }, { status: 405 })
}
