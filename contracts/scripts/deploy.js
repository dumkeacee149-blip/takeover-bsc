const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const net = await hre.ethers.provider.getNetwork();
  const chainId = Number(net.chainId);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("ChainId:", chainId);

  const Grid = await hre.ethers.getContractFactory("GridRegistry");
  const grid = await Grid.deploy();
  await grid.waitForDeployment();
  const gridAddr = await grid.getAddress();
  console.log("GridRegistry:", gridAddr);

  const FeeVault = await hre.ethers.getContractFactory("FeeVault");
  const vault = await FeeVault.deploy(gridAddr);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("FeeVault:", vaultAddr);

  const tx = await grid.setFeeVault(vaultAddr);
  await tx.wait();
  console.log("FeeVault set in GridRegistry");

  // Persist deployment for frontend wiring
  const out = {
    chainId,
    deployer: deployer.address,
    GridRegistry: gridAddr,
    FeeVault: vaultAddr,
    deployedAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "..", "web", "deployments");
  fs.mkdirSync(outDir, { recursive: true });

  const name = chainId === 97 ? "bsctest" : `chain-${chainId}`;
  const outPath = path.join(outDir, `${name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log("Wrote:", outPath);

  // Example init call (set coin address + initial price as you wish)
  // const coin = "0x0000000000000000000000000000000000000000";
  // const init = await grid.initCoin(coin, hre.ethers.parseEther("0.01"));
  // await init.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
