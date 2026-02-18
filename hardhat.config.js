require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
    },
    amoy: {
      url: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/",
      accounts: process.env.POLYGON_PRIVATE_KEY ? [process.env.POLYGON_PRIVATE_KEY] : [],
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY  // Single API key for all networks
  },
  customChains: [
    {
      network: "amoy",
      chainId: 80002,
      urls: {
        apiURL: "https://api-amoy.polygonscan.com/api",
        browserURL: "https://amoy.polygonscan.com"
      }
    }
  ]
};