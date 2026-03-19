import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Create wallet from private key
const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY);

/**
 * Create a signature for minting a seal
 * @param {string} userAddress - User's wallet address
 * @param {number} tier - Verification tier (1-5)
 * @returns {string} Signature
 */
export async function createMintSignature(userAddress, tier, chainId = 421614) {
  try {
    // Create message hash (same format as contract expects, includes chainId to prevent replay attacks)
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint8", "uint256"],
      [userAddress, tier, chainId]
    );

    // Sign the message
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    console.log(`✍️  Created signature for ${userAddress} at tier ${tier}`);
    
    return signature;
  } catch (error) {
    console.error('Signature creation failed:', error);
    throw new Error('Failed to create signature');
  }
}

/**
 * Verify a signature is valid
 * @param {string} userAddress - User's wallet address
 * @param {number} tier - Verification tier
 * @param {string} signature - Signature to verify
 * @returns {boolean} Is valid
 */
export function verifySignature(userAddress, tier, signature, chainId = 421614) {
  try {
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint8", "uint256"],
      [userAddress, tier, chainId]
    );

    const recoveredAddress = ethers.verifyMessage(
      ethers.getBytes(messageHash),
      signature
    );

    return recoveredAddress.toLowerCase() === wallet.address.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}
