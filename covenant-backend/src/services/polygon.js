import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Attestation contract ABI
const ATTESTATION_ABI = [
  "function attestSeal(address wallet, uint8 tier, bytes32 credentialHash, bytes signature)",
  "function getVerificationStatus(address wallet) view returns (uint8 tier, uint256 expiresAt, bool isRevoked)",
  "function isVerified(address wallet, uint8 minTier) view returns (bool)",
  "function revokeCredential(bytes32 credentialHash)"
];

// Create Polygon provider and wallet
const polygonProvider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const polygonWallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, polygonProvider);

// Create attestation contract instance
const attestationContract = new ethers.Contract(
  process.env.POLYGON_ATTESTATION_ADDRESS,
  ATTESTATION_ABI,
  polygonWallet
);

/**
 * Attest a seal on Polygon
 * @param {string} userAddress - User's wallet address
 * @param {number} tier - Verification tier
 * @param {number} ethereumSealId - Seal ID from Ethereum
 * @param {string} signature - Same signature used for Ethereum mint
 * @returns {Object} Transaction receipt
 */
export async function attestOnPolygon(userAddress, tier, ethereumSealId, signature) {
  try {
    console.log(`🟣 Attesting seal for ${userAddress} on Polygon...`);

    // Generate credentialHash: keccak256("COVENANT_SEAL", ethereumSealId)
    const credentialHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['string', 'uint256'],
        ['COVENANT_SEAL', ethereumSealId]
      )
    );

    const tx = await attestationContract.attestSeal(
      userAddress,
      tier,
      credentialHash,
      signature,
      {
        gasLimit: 300000
      }
    );

    console.log(`📤 Polygon tx sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    
    console.log(`✅ Attestation created! Gas used: ${receipt.gasUsed.toString()}`);

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      credentialHash
    };
  } catch (error) {
    console.error('Polygon attestation failed:', error);
    throw new Error(`Failed to attest on Polygon: ${error.message}`);
  }
}

/**
 * Check if address has attestation on Polygon
 * @param {string} userAddress - User's wallet address
 * @returns {Object} Attestation status
 */
export async function getPolygonAttestation(userAddress) {
  try {
    const [tier, expiresAt, isRevoked] = await attestationContract.getVerificationStatus(userAddress);
    
    return {
      tier: Number(tier),
      expiresAt: Number(expiresAt),
      isRevoked,
      hasAttestation: Number(tier) > 0
    };
  } catch (error) {
    console.error('Failed to get Polygon attestation:', error);
    return { tier: 0, expiresAt: 0, isRevoked: false, hasAttestation: false };
  }
}

/**
 * Revoke credential on Polygon
 * @param {string} credentialHash - Hash to revoke
 * @returns {Object} Transaction receipt
 */
export async function revokeOnPolygon(credentialHash) {
  try {
    console.log(`🟣 Revoking credential on Polygon: ${credentialHash}`);

    const tx = await attestationContract.revokeCredential(credentialHash, {
      gasLimit: 200000
    });

    const receipt = await tx.wait();
    
    console.log(`✅ Credential revoked on Polygon! Tx: ${receipt.hash}`);

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error('Polygon revocation failed:', error);
    throw new Error(`Failed to revoke on Polygon: ${error.message}`);
  }
}
