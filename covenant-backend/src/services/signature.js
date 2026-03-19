import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Create wallet from private key
const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY);

/**
 * Create an ECDSA signature authorising a seal mint or tier upgrade.
 *
 * The message hash includes chainId so that a signature produced for one
 * chain (e.g. Arbitrum Sepolia 421614) cannot be replayed on another
 * (e.g. Polygon Amoy 80002). Both Pact.sol and PactWitness.sol reconstruct
 * this same hash on-chain before calling ecrecover.
 *
 * @param {string} userAddress - Recipient wallet address
 * @param {number} tier - Verification tier (1–5)
 * @param {number} chainId - Target chain ID (default: 421614 Arbitrum Sepolia)
 * @returns {string} Hex-encoded ECDSA signature
 */
export async function createMintSignature(userAddress, tier, chainId = 421614) {
  try {
    // keccak256(abi.encodePacked(address, uint8 tier, uint256 chainId))
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
