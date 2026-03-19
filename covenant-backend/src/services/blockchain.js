import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Pact contract ABI — only the functions this service needs to call
const CONTRACT_ABI = [
  // expiresAt: Unix timestamp for seal expiry; pass 0 for no expiry
  "function mint(address to, uint8 tier, bytes signature, uint256 expiresAt)",
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

/**
 * Mint a seal on-chain via the Pact contract on Arbitrum Sepolia
 * @param {string} userAddress - Recipient wallet address
 * @param {number} tier - Verification tier (1–5)
 * @param {string} signature - ECDSA signature from createMintSignature (chainId 421614)
 * @param {number} expiresAt - Unix timestamp for seal expiry; 0 means no expiry
 * @returns {Object} Transaction receipt { transactionHash, blockNumber, gasUsed }
 */
export async function mintSeal(userAddress, tier, signature, expiresAt = 0) {
  try {
    console.log(`⛓️  Minting seal for ${userAddress} at tier ${tier}...`);

    const tx = await contract.mint(userAddress, tier, signature, expiresAt, {
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
