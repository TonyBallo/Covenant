import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// PactWitness contract ABI
const ATTESTATION_ABI = [
  "function attestSeal(address wallet, uint8 tier, uint8 jurisdictionCode, bytes32 credentialHash, bytes signature)",
  "function updateAttestation(address wallet, uint8 newTier, uint8 jurisdictionCode, bytes signature)",
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
 * Attest a verified seal on Polygon Amoy via PactWitness.
 *
 * The signature must be generated with chainId 80002 (Polygon Amoy) —
 * NOT the Arbitrum mint signature. Use createMintSignature(address, tier, 80002).
 *
 * @param {string} userAddress - Wallet address being attested
 * @param {number} tier - Verification tier (1–5)
 * @param {number} ethereumSealId - Seal ID from the Arbitrum Pact contract
 * @param {string} signature - Polygon-specific ECDSA signature (chainId 80002)
 * @returns {Object} { transactionHash, blockNumber, gasUsed, credentialHash }
 */
export async function attestOnPolygon(userAddress, tier, ethereumSealId, signature) {
  try {
    console.log(`🟣 Attesting seal for ${userAddress} on Polygon...`);

    // Credential hash links this Polygon attestation back to the Arbitrum seal.
    // Format: keccak256(abi.encode("COVENANT_SEAL", sealId))
    // Stored on PactWitness so the attestation can be invalidated if the Arbitrum seal is revoked.
    const credentialHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['string', 'uint256'],
        ['COVENANT_SEAL', ethereumSealId]
      )
    );

    // jurisdictionCode 0 = global — all Polygon attestations are cross-jurisdiction
    const tx = await attestationContract.attestSeal(
      userAddress,
      tier,
      0,
      credentialHash,
      signature,
      {
        gasLimit: 300000  // Conservative ceiling; actual usage is ~80–120k
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
 * Update the tier of an existing Polygon attestation after a seal upgrade on Arbitrum.
 * @param {string} userAddress - Wallet address to update
 * @param {number} newTier     - New tier (must be strictly greater than current attested tier)
 * @param {string} signature   - Polygon-specific ECDSA signature (chainId 80002)
 * @returns {Object} { transactionHash, blockNumber }
 */
export async function updatePolygonAttestation(userAddress, newTier, signature) {
  try {
    console.log(`🟣 Updating Polygon attestation for ${userAddress} to tier ${newTier}...`);

    const tx = await attestationContract.updateAttestation(
      userAddress,
      newTier,
      0,
      signature,
      { gasLimit: 200000 }
    );

    console.log(`📤 Polygon tx sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Attestation updated! Gas used: ${receipt.gasUsed.toString()}`);

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error('Polygon attestation update failed:', error);
    throw new Error(`Failed to update Polygon attestation: ${error.message}`);
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
