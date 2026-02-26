const hre = require('hardhat')

async function main() {
  const gridAddr = process.env.GRID_REGISTRY
  const coin = process.env.COIN
  const tileId = BigInt(process.env.TILE_ID || '0')
  if (!gridAddr) throw new Error('Missing GRID_REGISTRY')
  if (!coin) throw new Error('Missing COIN')

  const grid = await hre.ethers.getContractAt('GridRegistry', gridAddr)
  const [owner, priceWei] = await grid.getTile(coin, tileId)
  console.log('tileId:', tileId.toString())
  console.log('owner:', owner)
  console.log('priceWei:', priceWei.toString())
  console.log('priceBNB:', hre.ethers.formatEther(priceWei))
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
