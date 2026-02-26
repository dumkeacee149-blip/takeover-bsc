const hre = require('hardhat')

async function main() {
  const net = await hre.ethers.provider.getNetwork()
  const chainId = Number(net.chainId)
  const [deployer] = await hre.ethers.getSigners()

  const gridAddr = process.env.GRID_REGISTRY
  if (!gridAddr) throw new Error('Missing GRID_REGISTRY env var')

  const coin = process.env.COIN || '0x0000000000000000000000000000000000000000'
  const initial = process.env.INITIAL_PRICE_BNB || '0.001'

  console.log('ChainId:', chainId)
  console.log('Deployer:', deployer.address)
  console.log('GridRegistry:', gridAddr)
  console.log('Coin:', coin)
  console.log('Initial price (BNB):', initial)

  const grid = await hre.ethers.getContractAt('GridRegistry', gridAddr)

  const inited = await grid.coinInited(coin)
  console.log('Already inited?', inited)
  if (inited) return

  const tx = await grid.initCoin(coin, hre.ethers.parseEther(initial))
  console.log('initCoin tx:', tx.hash)
  await tx.wait()
  console.log('initCoin confirmed')
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
