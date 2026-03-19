const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  const pactAddress = "0xFa71D3c2dAbD20A3ceEb3Ef08319CE64548ecbA4";
  const pact = await ethers.getContractAt("Pact", pactAddress);

  // Set which tiers should be active (true) or inactive (false)
  const config = [
    { tier: 3, active: true },
    { tier: 4, active: true },
    { tier: 5, active: true },
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
