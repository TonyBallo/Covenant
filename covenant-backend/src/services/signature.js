import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Create wallet from private key
const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY);

/**
 * Create an ECDSA signature authorising a seal mint or tier upgrade.
 *
 * The message hash includes jurisdictionCode and chainId so that:
 *   - A signature cannot be replayed across chains (chainId binding)
 *   - A signature cannot be used to mint with a different jurisdiction (jurisdictionCode binding)
 * Both Pact.sol and PactWitness.sol reconstruct this same hash on-chain
 * before calling ecrecover.
 *
 * @param {string} userAddress      - Recipient wallet address
 * @param {number} tier             - Verification tier (1–5)
 * @param {number} jurisdictionCode - ISO 3166-1 numeric country code, or 0 for global
 * @param {number} chainId          - Target chain ID (default: 421614 Arbitrum Sepolia)
 * @returns {string} Hex-encoded ECDSA signature
 */
export async function createMintSignature(userAddress, tier, jurisdictionCode = 0, chainId = 421614) {
  try {
    // keccak256(abi.encodePacked(address, uint8 tier, uint8 jurisdictionCode, uint256 chainId))
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint8", "uint8", "uint256"],
      [userAddress, tier, jurisdictionCode, chainId]
    );

    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    console.log(`✍️  Created signature for ${userAddress} tier ${tier} jurisdiction ${jurisdictionCode}`);

    return signature;
  } catch (error) {
    console.error('Signature creation failed:', error);
    throw new Error('Failed to create signature');
  }
}

/**
 * Verify a signature is valid
 * @param {string} userAddress      - User's wallet address
 * @param {number} tier             - Verification tier
 * @param {number} jurisdictionCode - Jurisdiction code used when signing
 * @param {string} signature        - Signature to verify
 * @param {number} chainId          - Chain ID used when signing (default: 421614)
 * @returns {boolean} Is valid
 */
export function verifySignature(userAddress, tier, jurisdictionCode = 0, signature, chainId = 421614) {
  try {
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint8", "uint8", "uint256"],
      [userAddress, tier, jurisdictionCode, chainId]
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
