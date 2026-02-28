import bsctest from '../../deployments/bsctest.json'

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 97)

const fallbackGrid = (bsctest as any).GridRegistry || ''
const fallbackVault = (bsctest as any).FeeVault || ''

export const GRID_REGISTRY = (process.env.NEXT_PUBLIC_GRID_REGISTRY || fallbackGrid) as `0x${string}`
export const FEE_VAULT = (process.env.NEXT_PUBLIC_FEE_VAULT || fallbackVault) as `0x${string}`

export function assertWebConfig() {
  if (!GRID_REGISTRY || GRID_REGISTRY === ('0x' as any)) throw new Error('Missing NEXT_PUBLIC_GRID_REGISTRY')
  if (!FEE_VAULT || FEE_VAULT === ('0x' as any)) throw new Error('Missing NEXT_PUBLIC_FEE_VAULT')
}
