import { NextResponse } from 'next/server'
import { GRID_REGISTRY } from '../../../lib/chain'
import { getMoveSuggestion, sanitizePlanBody } from '../../../lib/agentEngine'

export const runtime = 'nodejs'

type Body = {
  coin?: string
  budgetBnb?: string
  maxPriceBnb?: string
  strategy?: 'cheapest' | 'random' | 'defend'
  myAddress?: string
  recentLosses?: Array<{ tileId: number }>
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as Body | null
  if (!payload || !payload.coin || !payload.budgetBnb || !payload.maxPriceBnb) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Missing required fields: coin, budgetBnb, maxPriceBnb',
      },
      { status: 400 }
    )
  }

  const req = sanitizePlanBody(payload)
  const suggestion = await getMoveSuggestion(req, GRID_REGISTRY)

  if ('error' in suggestion && !suggestion.ok) {
    return NextResponse.json({ ok: false, ...suggestion }, { status: 400 })
  }

  return NextResponse.json({ ok: true, suggestion, plan: payload })
}

export async function GET() {
  return NextResponse.json({
    ok: false,
    error: 'Use POST /api/agent/plan with JSON body: coin, budgetBnb, maxPriceBnb, strategy.',
  }, { status: 405 })
}
