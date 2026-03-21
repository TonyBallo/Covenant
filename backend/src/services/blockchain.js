import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Pact contract ABI — only the functions this service needs to call
const CONTRACT_ABI = [
  "function mint(address to, uint8 tier, uint8 jurisdictionCode, bytes signature, uint256 expiresAt)",
  "function revoke(uint256 sealId, string reason)",
  "function getVerificationStatus(address user) view returns (bool verified, uint8 tier, bool revoked, bool burnPending, uint256 burnExecutableAt)",
  "function addressToSealId(address user) view returns (uint256)",
];

// Arbitrum Sepolia provider and deployer wallet (used for all state-changing calls)
const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);

// Create contract instance
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  CONTRACT_ABI,
  wallet
);

// Expiry durations by tier (in seconds)
const EXPIRY_BY_TIER = {
  1: 365 * 24 * 60 * 60,       // Tier I  — 12 months
  2: 2 * 365 * 24 * 60 * 60,   // Tier II — 24 months
};

/**
 * Mint a seal on-chain via the Pact contract on Arbitrum Sepolia
 * @param {string} userAddress      - Recipient wallet address
 * @param {number} tier             - Verification tier (1–5)
 * @param {string} signature        - ECDSA signature from createMintSignature
 * @param {number} jurisdictionCode - ISO 3166-1 numeric country code, or 0 for global (default: 0)
 * @returns {Object} Transaction receipt { transactionHash, blockNumber, gasUsed }
 */
export async function mintSeal(userAddress, tier, signature, jurisdictionCode = 0) {
  try {
    // Calculate expiry: 12 months for Tier I, 24 months for Tier II, no expiry otherwise
    const expiresAt = EXPIRY_BY_TIER[tier]
      ? Math.floor(Date.now() / 1000) + EXPIRY_BY_TIER[tier]
      : 0;

    console.log(`⛓️  Minting seal for ${userAddress} tier ${tier} jurisdiction ${jurisdictionCode} expiresAt ${expiresAt || 'never'}...`);

    const tx = await contract.mint(userAddress, tier, jurisdictionCode, signature, expiresAt, {
      gasLimit: 300000  // Conservative ceiling; actual usage is ~150–180k
    });

    console.log(`📤 Transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    
    console.log(`✅ Seal minted! Gas used: ${receipt.gasUsed.toString()}`);

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
  } catch (error) {
    console.error('Minting failed:', error);
    throw new Error(`Failed to mint seal: ${error.message}`);
  }
}

/**
 * Get seal ID for an address
 * @param {string} userAddress - User's wallet address
 * @returns {number} Seal ID (0 if none)
 */
export async function getSealId(userAddress) {
  try {
    const sealId = await contract.addressToSealId(userAddress);
    return Number(sealId);
  } catch (error) {
    console.error('Failed to get seal ID:', error);
    return 0;
  }
}

/**
 * Check if address already has a seal
 * @param {string} userAddress - User's wallet address
 * @returns {boolean} Has seal
 */
export async function hasSeal(userAddress) {
  const sealId = await getSealId(userAddress);
  return sealId > 0;
}

/**
 * Get full seal info for an address
 * @param {string} userAddress - User's wallet address
 * @returns {Object} { found, sealId, tier, revoked, verified }
 */
export async function getSealInfo(userAddress) {
  try {
    const sealId = await contract.addressToSealId(userAddress);
    const id = Number(sealId);
    if (id === 0) return { found: false };

    const status = await contract.getVerificationStatus(userAddress);
    return {
      found: true,
      sealId: id,
      tier: Number(status[1]),
      revoked: status[2],
      verified: status[0],
    };
  } catch (error) {
    console.error('Failed to get seal info:', error);
    throw new Error(`Failed to get seal info: ${error.message}`);
  }
}

/**
 * Revoke a seal
 * @param {number} sealId - Seal ID to revoke
 * @param {string} reason - Revocation reason
 * @returns {Object} Transaction receipt
 */
export async function revokeSeal(sealId, reason) {
  try {
    console.log(`🚫 Revoking seal #${sealId}: ${reason}`);

    const tx = await contract.revoke(sealId, reason, {
      gasLimit: 200000  // Conservative ceiling; actual usage is ~50–80k
    });

    const receipt = await tx.wait();
    
    console.log(`✅ Seal revoked! Tx: ${receipt.hash}`);

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('Revocation failed:', error);
    throw new Error(`Failed to revoke seal: ${error.message}`);
  }
}
