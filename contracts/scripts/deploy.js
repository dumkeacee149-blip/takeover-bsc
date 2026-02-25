const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Grid = await hre.ethers.getContractFactory("GridRegistry");
  const grid = await Grid.deploy();
  await grid.waitForDeployment();
  console.log("GridRegistry:", await grid.getAddress());

  const FeeVault = await hre.ethers.getContractFactory("FeeVault");
  const vault = await FeeVault.deploy(await grid.getAddress());
  await vault.waitForDeployment();
  console.log("FeeVault:", await vault.getAddress());

  const tx = await grid.setFeeVault(await vault.getAddress());
  await tx.wait();
  console.log("FeeVault set in GridRegistry");

  // Example init call (set coin address + initial price as you wish)
  // const coin = "0x0000000000000000000000000000000000000000";
  // const init = await grid.initCoin(coin, hre.ethers.parseEther("0.01"));
  // await init.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
