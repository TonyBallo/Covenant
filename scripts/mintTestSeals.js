const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  
  console.log("Minting test seals with account:", owner.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(owner.address)), "ETH\n");

  // Current deployed Pact contract on Arbitrum Sepolia
  const pactAddress = "0xFa71D3c2dAbD20A3ceEb3Ef08319CE64548ecbA4";
  const pact = await ethers.getContractAt("Pact", pactAddress);

  // Generate 10 deterministic test addresses (same every time for demo consistency)
  const testWallets = [
    "0x1111111111111111111111111111111111111111",
    "0x2222222222222222222222222222222222222222",
    "0x3333333333333333333333333333333333333333",
    "0x4444444444444444444444444444444444444444",
    "0x5555555555555555555555555555555555555555",
    "0x6666666666666666666666666666666666666666",
    "0x7777777777777777777777777777777777777777",
    "0x8888888888888888888888888888888888888888",
    "0x9999999999999999999999999999999999999999",
    "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  ];

  // Tier distribution: 2 Bronze, 2 Silver, 3 Gold, 2 Platinum, 1 Diamond
  const tiers = [1, 1, 2, 2, 3, 3, 3, 4, 4, 5];
  const tierNames = ['', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

  console.log("🏛️  Minting 10 test verification seals...\n");

  for (let i = 0; i < testWallets.length; i++) {
    const address = testWallets[i];
    const tier = tiers[i];

    try {
      // Check if already minted
      const existingSealId = await pact.addressToSealId(address);
      if (existingSealId > 0) {
        console.log(`⏭️  Skipped ${tierNames[tier]} (Tier ${tier}) - Already minted for ${address}`);
        continue;
      }

      // Create signature (includes jurisdictionCode and chain ID to prevent replay attacks)
      const { chainId } = await ethers.provider.getNetwork();
      const jurisdictionCode = 0;
      const message = ethers.solidityPackedKeccak256(
        ["address", "uint8", "uint8", "uint256"],
        [address, tier, jurisdictionCode, chainId]
      );
      const signature = await owner.signMessage(ethers.getBytes(message));

      // Mint (0 = no expiry)
      const tx = await pact.mint(address, tier, jurisdictionCode, signature, 0);
      const receipt = await tx.wait();

      console.log(`✅ Minted ${tierNames[tier]} (Tier ${tier}) for ${address}`);
      console.log(`   Transaction: ${receipt.hash}\n`);

    } catch (error) {
      console.error(`❌ Failed to mint for ${address}:`, error.message, "\n");
    }
  }

  console.log("📋 Test Wallet Summary:\n");
  console.log("Copy these addresses to test the frontend:\n");
  
  for (let i = 0; i < testWallets.length; i++) {
    console.log(`Tier ${tiers[i]} (${tierNames[tiers[i]].padEnd(8)}): ${testWallets[i]}`);
  }

  console.log("\n🎉 Minting complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});