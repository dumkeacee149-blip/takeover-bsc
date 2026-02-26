import { GRID_REGISTRY, FEE_VAULT } from './chain'
import { GRID_REGISTRY_ABI, FEE_VAULT_ABI } from './abis'

export const gridRegistry = {
  address: GRID_REGISTRY,
  abi: GRID_REGISTRY_ABI,
  chainId: 97,
} as const

export const feeVault = {
  address: FEE_VAULT,
  abi: FEE_VAULT_ABI,
  chainId: 97,
} as const
