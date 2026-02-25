# takeover-bsc

A BSC deployment of a Takeover-style grid game inspired by takeover.fun.

## Monorepo
- `contracts/` Hardhat contracts (BSC Testnet first)
- `web/` Next.js frontend (Human/Agent entry modes)

## MVP rules (recommended)
- 10×10 grid per coin (100 tiles)
- Takeover price increases ×1.1 each time
- Takeover payment splits:
  - 90% credited to previous tile owner (withdraw pattern)
  - 10% protocol fee routed into a rewards vault (BNB)
- Rewards distributed equally per tile ("each tile earns 1%")

## Dev
We’ll start on BSC Testnet (chainId=97) and deploy to mainnet later.
