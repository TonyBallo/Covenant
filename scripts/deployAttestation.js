const hre = require("hardhat");

async function main() {
  console.log("Deploying CovenantAttestation to Polygon Amoy...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const CovenantAttestation = await hre.ethers.getContractFactory("CovenantAttestation");
  
  // Deploy with manual gas settings to reduce cost
  const attestation = await CovenantAttestation.deploy({
    gasLimit: 3000000,  // Set a reasonable gas limit
    gasPrice: hre.ethers.parseUnits("30", "gwei")  // Lower gas price for testnet
  });
  
  await attestation.waitForDeployment();
  
  const address = await attestation.getAddress();
  console.log("✅ CovenantAttestation deployed to:", address);
  console.log("Owner:", await attestation.owner());
  
  console.log("\nNext steps:");
  console.log("1. Verify on PolygonScan:");
  console.log(`   npx hardhat verify --network amoy ${address}`);
  console.log("2. Add to .env:");
  console.log(`   POLYGON_ATTESTATION_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });