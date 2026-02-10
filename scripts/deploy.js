const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("🚀 Deploying IdentityPact v2 to Sepolia...");
  console.log("Deployer address:", deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy IdentityPact (v2)
  const IdentityPact = await hre.ethers.getContractFactory("IdentityPact");
  const pact = await IdentityPact.deploy();

  await pact.waitForDeployment();
  const address = await pact.getAddress();

  console.log("✅ IdentityPact v2 deployed to:", address);
  console.log("\n📋 Save this address for your frontend!");
  console.log("Contract address:", address);
  console.log("\n🔗 View on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});