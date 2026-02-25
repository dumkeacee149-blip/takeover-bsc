require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { BSC_TESTNET_RPC, DEPLOYER_PK } = process.env;

module.exports = {
  solidity: "0.8.20",
  networks: {
    bsctest: {
      url: BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: DEPLOYER_PK ? [DEPLOYER_PK] : []
    }
  }
};
