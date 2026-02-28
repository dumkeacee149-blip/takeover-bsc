const hre = require('hardhat')
const fs = require('fs')
const path = require('path')

async function main() {
  const net = await hre.ethers.provider.getNetwork()
  const chainId = Number(net.chainId)
  const [deployer] = await hre.ethers.getSigners()

  console.log('Deployer:', deployer.address)
  console.log('ChainId:', chainId)

  const Grid = await hre.ethers.getContractFactory('GridRegistry')
  const grid = await Grid.deploy()
  await grid.waitForDeployment()
  const gridAddr = await grid.getAddress()
  console.log('GridRegistry:', gridAddr)

  const FeeVault = await hre.ethers.getContractFactory('FeeVault')
  const vault = await FeeVault.deploy(gridAddr)
  await vault.waitForDeployment()
  const vaultAddr = await vault.getAddress()
  console.log('FeeVault:', vaultAddr)

  const setFeeVaultTx = await grid.setFeeVault(vaultAddr)
  await setFeeVaultTx.wait()

  const coin = (process.env.COIN || '0x0000000000000000000000000000000000000000').trim()
  const initial = process.env.INITIAL_PRICE_BNB || '0.1'
  if (coin && coin !== '0x0000000000000000000000000000000000000000') {
    const initTx = await grid.initCoin(coin, hre.ethers.parseEther(initial))
    await initTx.wait()
    console.log(`Coin initialized: ${coin} at ${initial} BNB`)
  } else {
    console.log('COIN not set or zero address; skipped initCoin')
  }

  const out = {
    chainId,
    deployer: deployer.address,
    GridRegistry: gridAddr,
    FeeVault: vaultAddr,
    coin,
    initialPriceBNB: coin && coin !== '0x0000000000000000000000000000000000000000' ? initial : 'not_initialized',
    deployedAt: new Date().toISOString(),
  }

  const outDir = path.join(__dirname, '..', '..', 'web', 'deployments')
  fs.mkdirSync(outDir, { recursion: true })
  const outPath = path.join(outDir, `${chainId === 97 ? 'bsctest' : `chain-${chainId}`}.json`)
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2))
  console.log('Wrote:', outPath)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
