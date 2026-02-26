const hre = require('hardhat')

async function main() {
  const grid = process.env.GRID || '0xCD7D59a2560Fd5B15ca2803b9b1F4b2d2e049F7B'
  const coin = process.env.COIN || '0x0000000000000000000000000000000000000000'
  const ids = (process.env.IDS || '22,28').split(',').map((x) => Number(x.trim())).filter((x) => Number.isFinite(x))

  const net = await hre.ethers.provider.getNetwork()
  console.log('chainId:', Number(net.chainId))
  console.log('grid:', grid)
  console.log('coin:', coin)

  const c = await hre.ethers.getContractAt('GridRegistry', grid)
  for (const id of ids) {
    const [owner, priceWei] = await c.getTile(coin, BigInt(id))
    console.log(`tile ${id}: owner=${owner} price=${hre.ethers.formatEther(priceWei)} BNB`)
  }

  const inited = await c.coinInited(coin)
  console.log('coinInited:', inited)
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
