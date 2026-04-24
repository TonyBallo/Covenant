const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  const pactAddress = "0xBfCA5341f3c370743d4A64Df7c732113A4f83187"; // update before running
  const pact = await ethers.getContractAt("Pact", pactAddress);

  // Arbitrum: activate Tier III (Gold) only.
  // Tiers I and II are activated in the constructor.
  // Tiers IV and V (Platinum, Diamond) are Ethereum Mainnet only.
  const config = [
    { tier: 3, active: true },
  ];

  for (const { tier, active } of config) {
    const current = await pact.tierActive(tier);
    if (current === active) {
      console.log(`Tier ${tier} already ${active ? 'active' : 'inactive'} — skipping`);
      continue;
    }
    const tx = await pact.setTierActive(tier, active);
    await tx.wait();
    console.log(`✅ Tier ${tier} set to ${active ? 'active' : 'inactive'}`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
