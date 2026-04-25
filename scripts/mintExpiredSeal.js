// One-off script: mint (or remint) a seal with an already-expired expiresAt for testing.
// Usage: npx hardhat run scripts/mintExpiredSeal.js --network arbitrumSepolia

import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const TARGET = '0x377B990082ca11B1C1D421F90Fc256D54Eb8DD6f';
const TIER = 1;
const JURISDICTION = 0;
const CHAIN_ID = 421614;

const CONTRACT_ABI = [
  "function mint(address to, uint8 tier, uint8 jurisdictionCode, bytes signature, uint256 expiresAt)",
  "function adminBurn(uint256 sealId) external",
  "function addressToSealId(address user) view returns (uint256)",
  "function getVerificationStatus(address user) view returns (bool verified, uint8 tier, bool revoked, bool burnPending, uint256 burnExecutableAt)",
];

const CONTRACT_ADDRESS = '0xBfCA5341f3c370743d4A64Df7c732113A4f83187';
const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

async function createSignature(address, tier, jurisdictionCode, chainId) {
  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint8", "uint8", "uint256"],
    [address, tier, jurisdictionCode, chainId]
  );
  return wallet.signMessage(ethers.getBytes(messageHash));
}

async function main() {
  console.log(`\nTarget:   ${TARGET}`);
  console.log(`Contract: ${CONTRACT_ADDRESS}\n`);

  // Check for existing seal
  const existingId = Number(await contract.addressToSealId(TARGET));
  if (existingId > 0) {
    const [verified, , revoked] = await contract.getVerificationStatus(TARGET);
    console.log(`Existing seal #${existingId} found (verified=${verified}, revoked=${revoked})`);
    console.log(`Burning seal #${existingId}...`);
    const tx = await contract.adminBurn(existingId, { gasLimit: 200000 });
    await tx.wait();
    console.log(`Seal #${existingId} burned.`);
  } else {
    console.log('No existing seal — proceeding to mint.');
  }

  // expiresAt = 1 hour ago
  const expiresAt = Math.floor(Date.now() / 1000) - 3600;
  console.log(`\nMinting Tier ${TIER} seal with expiresAt=${expiresAt} (1 hour ago)...`);

  const signature = await createSignature(TARGET, TIER, JURISDICTION, CHAIN_ID);
  const tx = await contract.mint(TARGET, TIER, JURISDICTION, signature, expiresAt, { gasLimit: 300000 });
  const receipt = await tx.wait();

  console.log(`\nDone! Tx: ${receipt.hash}`);
  console.log(`Seal minted and already expired for ${TARGET}`);
}

main().catch(err => { console.error(err); process.exit(1); });
