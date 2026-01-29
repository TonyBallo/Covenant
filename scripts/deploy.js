const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Deploying IdentitySBT to Sepolia...");
  
  const IdentitySBT = await hre.ethers.getContractFactory("IdentitySBT");
  const identitySBT = await IdentitySBT.deploy();
  
  await identitySBT.waitForDeployment();
  
  const address = await identitySBT.getAddress();
  const deploymentTx = identitySBT.deploymentTransaction();
  
  console.log("✅ IdentitySBT deployed to:", address);
  console.log("📍 View on Etherscan: https://sepolia.etherscan.io/address/" + address);
  console.log("🔗 Deployment tx:", deploymentTx.hash);
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contract: "IdentitySBT",
    address: address,
    deployer: deploymentTx.from,
    txHash: deploymentTx.hash,
    deployedAt: new Date().toISOString(),
    blockNumber: deploymentTx.blockNumber
  };
  
  // Read existing deployments or create new
  let deployments = {};
  if (fs.existsSync("deployments.json")) {
    deployments = JSON.parse(fs.readFileSync("deployments.json", "utf8"));
  }
  
  // Add this deployment
  if (!deployments[hre.network.name]) {
    deployments[hre.network.name] = {};
  }
  deployments[hre.network.name].IdentitySBT = deploymentInfo;
  
  // Save to file
  fs.writeFileSync("deployments.json", JSON.stringify(deployments, null, 2));
  
  console.log("\n💾 Deployment info saved to deployments.json");
  console.log("\n🔥 NEXT STEPS:");
  console.log("1. Verify contract on Etherscan");
  console.log("2. Tweet about your deployment!");
  console.log("3. Test minting an SBT");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});