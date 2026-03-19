const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying Pact to Arbitrum Sepolia...");
  console.log("Deployer address:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy Pact
  const PactFactory = await hre.ethers.getContractFactory("Pact");
  const pact = await PactFactory.deploy();

  await pact.waitForDeployment();
  const address = await pact.getAddress();

  console.log("✅ Pact deployed to:", address);
  console.log("\n📋 Save this address for your frontend!");
  console.log("Contract address:", address);
  console.log("\n🔗 View on Arbiscan:");
  console.log(`https://sepolia.arbiscan.io/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});