import bsctest from '../../deployments/bsctest.json'

export const CHAIN_ID = 97

// 强制使用仓库内最新部署记录，避免 Vercel/系统环境变量缓存旧合约导致仍读到旧价格。
// 这样每次发布都统一走同一套部署文件，需清空/重开局时只需更新 bsctest.json。
export const GRID_REGISTRY = ((bsctest as any).GridRegistry || '') as `0x${string}`
export const FEE_VAULT = ((bsctest as any).FeeVault || '') as `0x${string}`

export function assertWebConfig() {
  if (!GRID_REGISTRY || GRID_REGISTRY === ('0x' as any)) throw new Error('Missing NEXT_PUBLIC_GRID_REGISTRY')
  if (!FEE_VAULT || FEE_VAULT === ('0x' as any)) throw new Error('Missing NEXT_PUBLIC_FEE_VAULT')
}
