import type { NextApiRequest, NextApiResponse } from 'next'
import {
  CHAIN_ID,
  GRID_REGISTRY,
} from '../../../app/lib/chain'
import { GRID_REGISTRY_ABI } from '../../../app/lib/abis'
import {
  getMoveSuggestion,
  sanitizePlanBody,
} from '../../../app/lib/agentEngine'
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

type Body = {
  coin?: string
  budgetBnb?: string
  maxPriceBnb?: string
  strategy?: 'cheapest' | 'random' | 'defend'
  dryRun?: boolean
  myAddress?: string
  recentLosses?: Array<{ tileId: number }>
}

function getRpcUrl() {
  return process.env.BSC_TESTNET_RPC || process.env.NEXT_PUBLIC_BSC_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545/'
}

function getToken(req: NextApiRequest) {
  const header = req.headers.authorization || ''
  if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) return header.slice(7)

  const xToken = (req.headers['x-agent-token'] as string) || ''
  return xToken
}

const BSC_TESTNET_CHAIN = {
  id: CHAIN_ID,
  name: 'BSC Testnet',
  network: 'testnet' as const,
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: { default: { http: [getRpcUrl()] } },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' })
    return
  }

  const secret = process.env.AGENT_API_TOKEN || ''
  const token = getToken(req)
  if (secret && token !== secret) {
    res.status(401).json({ ok: false, error: 'Unauthorized' })
    return
  }

  const payload = req.body as Body | undefined
  if (!payload || !payload.coin || !payload.budgetBnb || !payload.maxPriceBnb) {
    res.status(400).json({ ok: false, error: 'Missing required fields: coin, budgetBnb, maxPriceBnb' })
    return
  }

  try {
    const reqBody = sanitizePlanBody(payload)
    const suggestion = await getMoveSuggestion(reqBody, GRID_REGISTRY)
    if ('error' in suggestion && !suggestion.ok) {
      res.status(400).json({ ok: false, ...suggestion })
      return
    }

    const privateKey = process.env.AGENT_PRIVATE_KEY || ''
    if (!privateKey) {
      res.status(400).json({ ok: false, error: 'AGENT_PRIVATE_KEY not configured' })
      return
    }

    const rpc = getRpcUrl()
    const publicClient = createPublicClient({ chain: BSC_TESTNET_CHAIN, transport: http(rpc) })

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
      res.status(400).json({ ok: false, error: 'Tile is not initialized with a valid owner, aborting.' })
      return
    }

    if (priceWei <= 0n) {
      res.status(400).json({ ok: false, error: 'Computed tile price is zero, aborting.' })
      return
    }

    const maxPriceWei = parseEther(reqBody.maxPriceBnb)
    const budgetWei = parseEther(reqBody.budgetBnb)
    if (priceWei > maxPriceWei || priceWei > budgetWei) {
      res.status(400).json({ ok: false, error: 'Execution aborted: tile price changed beyond configured limits' })
      return
    }

    const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`)

    if (payload.dryRun) {
      res.status(200).json({
        ok: true,
        dryRun: true,
        agent: account.address,
        tileId: tile,
        valueBnb: formatEther(priceWei),
        txHash: null,
        suggestion,
        explorer: `https://testnet.bscscan.com/address/${account.address}`,
      })
      return
    }

    const walletClient = createWalletClient({ account, chain: BSC_TESTNET_CHAIN, transport: http(rpc) })
    const txHash = await walletClient.writeContract({
      address: GRID_REGISTRY,
      abi: GRID_REGISTRY_ABI,
      functionName: 'takeover',
      args: [coin, BigInt(tile)],
      value: priceWei,
      account,
      chain: BSC_TESTNET_CHAIN,
    })

    res.status(200).json({
      ok: true,
      txHash: txHash,
      explorer: `https://testnet.bscscan.com/tx/${txHash}`,
      tileId: tile,
      valueBnb: formatEther(priceWei),
      strategy: reqBody.strategy || 'cheapest',
      agent: account.address,
      suggestion,
    })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
}
