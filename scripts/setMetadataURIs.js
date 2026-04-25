const { ethers } = require("hardhat");

async function main() {
  const address = "0x3daB0f859804b2C42349ac6E54CCd7bc9417d871";
  const pact = await ethers.getContractAt("Pact", address);

  const uris = [
    { tier: 1, uri: "ipfs://QmUAwZnyXUE2aEUhS8ALJpNDfwTbZPjhQinq6b1yx6yHor" },
    { tier: 2, uri: "ipfs://QmPeBrCXVVrkNnCv5EvmJjXCGmZWBxUprR2uthoFpAsWTr" },
    { tier: 3, uri: "ipfs://QmZ74ehuHBRxU3B9KYx1TpiW2jePDAwMbgNvpH1b6BRz8X" },
    { tier: 4, uri: "ipfs://QmVCXiXwMJKUsujhAAKjmKXg8aHVBtp8o3LkCA1HtPhmDc" },
    { tier: 5, uri: "ipfs://QmaEZzN3V6JByaoVTFCgRAYgouTut14nVmTm9qVzR2PwDP" },
  ];

  for (const { tier, uri } of uris) {
    const tx = await pact.setTierMetadataURI(tier, uri);
    await tx.wait();
    console.log(`✅ Tier ${tier} metadata URI set`);
  }
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
