import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Contract ABI (only functions we need)
const CONTRACT_ABI = [
  "function mint(address to, uint8 tier, bytes signature)",
  "function revoke(uint256 sealId, string reason)",
  "function getVerificationStatus(address user) view returns (bool verified, uint8 tier, bool revoked, bool burnPending, uint256 burnExecutableAt)",
  "function addressToSealId(address user) view returns (uint256)",
];

// Create provider and wallet
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);

// Create contract instance
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  CONTRACT_ABI,
  wallet
);

/**
 * Mint a seal on-chain
 * @param {string} userAddress - User's wallet address
 * @param {number} tier - Verification tier
 * @param {string} signature - Valid signature
 * @returns {Object} Transaction receipt
 */
export async function mintSeal(userAddress, tier, signature) {
  try {
    console.log(`⛓️  Minting seal for ${userAddress} at tier ${tier}...`);

    const tx = await contract.mint(userAddress, tier, signature, {
      gasLimit: 300000
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
 * Revoke a seal
 * @param {number} sealId - Seal ID to revoke
 * @param {string} reason - Revocation reason
 * @returns {Object} Transaction receipt
 */
export async function revokeSeal(sealId, reason) {
  try {
    console.log(`🚫 Revoking seal #${sealId}: ${reason}`);

    const tx = await contract.revoke(sealId, reason, {
      gasLimit: 200000
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
