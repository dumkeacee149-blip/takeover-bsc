import type { NextApiRequest, NextApiResponse } from 'next'
import { GRID_REGISTRY } from '../../../app/lib/chain'
import { getMoveSuggestion, sanitizePlanBody } from '../../../app/lib/agentEngine'

type Body = {
  coin?: string
  budgetBnb?: string
  maxPriceBnb?: string
  strategy?: 'cheapest' | 'random' | 'defend'
  myAddress?: string
  recentLosses?: Array<{ tileId: number }>
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' })
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

    res.status(200).json({ ok: true, suggestion, plan: reqBody })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
}
