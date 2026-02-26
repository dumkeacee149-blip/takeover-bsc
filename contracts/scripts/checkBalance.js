const hre = require('hardhat')

async function main() {
  const addr = process.env.ADDR
  if (!addr) throw new Error('Missing ADDR env var')

  const bal = await hre.ethers.provider.getBalance(addr)
  console.log('Address:', addr)
  console.log('Balance (wei):', bal.toString())
  console.log('Balance (BNB):', hre.ethers.formatEther(bal))
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
