import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Pact contract ABI — only the functions this service needs to call
const CONTRACT_ABI = [
  "function mint(address to, uint8 tier, uint8 jurisdictionCode, bytes signature, uint256 expiresAt)",
  "function revoke(uint256 sealId, string reason)",
  "function upgradeTier(uint256 sealId, uint8 newTier, uint8 jurisdictionCode, bytes newSignature)",
  "function getVerificationStatus(address user) view returns (bool verified, uint8 tier, bool revoked, bool burnPending, uint256 burnExecutableAt)",
  "function addressToSealId(address user) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function adminBurn(uint256 sealId) external",
  "function sealData(uint256 sealId) view returns (uint8 tier, bytes covenantSignature, uint256 mintedAt, uint256 expiresAt, bool revoked, string revocationReason, uint8 jurisdictionCode)",
  "function getSeal(address wallet) view returns (uint8 tier, uint256 issuedAt, uint256 expiresAt, uint8 jurisdictionCode, bool revoked)",
  "function verifyOwnership(address user, uint256 sealId) view returns (bool)",
  "event BurnRequested(uint256 indexed sealId, address indexed owner, uint256 executableAt)",
  "event BurnCancelled(uint256 indexed sealId, address indexed owner)",
  "event SealBurned(uint256 indexed sealId, address indexed owner)",
];

// Approximate block at contract deployment (Arbitrum Sepolia, Mar-28-2026).
// Used as fromBlock for event queries to avoid scanning the entire chain.
const DEPLOY_BLOCK = 250_000_000;

// Alchemy provider — used for all state-changing calls (mint, revoke, etc.)
const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// Public RPC — used for event log queries only.
// Alchemy free tier caps eth_getLogs at a 10-block range; the public endpoint has no such limit.
const PUBLIC_RPC_URL = 'https://sepolia-rollup.arbitrum.io/rpc';
const eventProvider = new ethers.JsonRpcProvider(PUBLIC_RPC_URL);
const eventContract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, eventProvider);

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
 * @param {number|null} expiresAt   - Unix timestamp for expiry, or null to use tier defaults
 * @returns {Object} Transaction receipt { transactionHash, blockNumber, gasUsed, expiresAt }
 */
export async function mintSeal(userAddress, tier, signature, jurisdictionCode = 0, expiresAt = null) {
  try {
    // Use provided expiry, or fall back to tier defaults (Tier I: 12mo, Tier II: 24mo, else no expiry)
    const resolvedExpiresAt = expiresAt !== null
      ? expiresAt
      : (EXPIRY_BY_TIER[tier] ? Math.floor(Date.now() / 1000) + EXPIRY_BY_TIER[tier] : 0);

    console.log(`⛓️  Minting seal for ${userAddress} tier ${tier} jurisdiction ${jurisdictionCode} expiresAt ${resolvedExpiresAt || 'never'}...`);

    // Simulate the call first to get the revert reason before spending gas
    await contract.mint.staticCall(userAddress, tier, jurisdictionCode, signature, resolvedExpiresAt);

    const tx = await contract.mint(userAddress, tier, jurisdictionCode, signature, resolvedExpiresAt, {
      gasLimit: 500000  // Conservative ceiling; actual usage is ~50–80k
    });

    console.log(`📤 Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();

    console.log(`✅ Seal minted! Gas used: ${receipt.gasUsed.toString()}`);

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      expiresAt: resolvedExpiresAt,
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
 * @returns {Object} { found, sealId, tier, revoked, verified, burnPending, burnExecutableAt, issuedAt, expiresAt, jurisdictionCode }
 */
export async function getSealInfo(userAddress) {
  try {
    const sealId = await contract.addressToSealId(userAddress);
    const id = Number(sealId);
    if (id === 0) return { found: false };

    const [status, seal] = await Promise.all([
      contract.getVerificationStatus(userAddress),
      contract.getSeal(userAddress),
    ]);

    return {
      found: true,
      sealId: id,
      tier: Number(status.tier),
      revoked: status.revoked,
      verified: status.verified,
      burnPending: status.burnPending,
      burnExecutableAt: Number(status.burnExecutableAt),
      issuedAt: Number(seal.issuedAt),
      expiresAt: Number(seal.expiresAt),
      jurisdictionCode: Number(seal.jurisdictionCode),
    };
  } catch (error) {
    console.error('Failed to get seal info:', error);
    throw new Error(`Failed to get seal info: ${error.message}`);
  }
}

/**
 * Verify that a wallet address owns a specific seal ID.
 * Guards against spoofing attacks where a caller supplies a mismatched address/sealId pair.
 * @param {string} userAddress - Wallet address claimed to own the seal
 * @param {number} sealId      - Seal ID to verify ownership of
 * @returns {boolean}
 */
export async function verifySealOwnership(userAddress, sealId) {
  try {
    return await contract.verifyOwnership(userAddress, sealId);
  } catch (error) {
    console.error('Ownership verification failed:', error);
    return false;
  }
}

/**
 * Upgrade a seal's tier on-chain.
 * Looks up the seal owner from the contract, generates a fresh ECDSA signature,
 * then calls upgradeTier. New tier must be strictly greater than current tier.
 * @param {number} sealId
 * @param {number} newTier - 1–5
 * @param {number} jurisdictionCode - ISO 3166-1 numeric, 0 = global
 * @returns {Object} { transactionHash, blockNumber, walletAddress, newTier }
 */
export async function upgradeSeal(sealId, newTier, jurisdictionCode = 0) {
  const walletAddress = await contract.ownerOf(sealId);
  const { createMintSignature } = await import('./signature.js');
  const signature = await createMintSignature(walletAddress, newTier, jurisdictionCode);
  console.log(`⬆️  Upgrading seal #${sealId} to tier ${newTier} for ${walletAddress}`);
  const tx = await contract.upgradeTier(sealId, newTier, jurisdictionCode, signature, { gasLimit: 250000 });
  const receipt = await tx.wait();
  console.log(`✅ Seal #${sealId} upgraded to tier ${newTier}. Tx: ${receipt.hash}`);
  return { transactionHash: receipt.hash, blockNumber: receipt.blockNumber, walletAddress, newTier };
}

/**
 * Return all seals with an active (non-cancelled, non-executed) burn request.
 * Driven entirely by on-chain events — does not rely on Supabase.
 * @returns {Array<{ sealId, walletAddress, tier, burnExecutableAt, canExecute, secondsRemaining }>}
 */
export async function getActiveBurnRequests() {
  const [requested, cancelled, burned] = await Promise.all([
    eventContract.queryFilter(eventContract.filters.BurnRequested(), DEPLOY_BLOCK),
    eventContract.queryFilter(eventContract.filters.BurnCancelled(), DEPLOY_BLOCK),
    eventContract.queryFilter(eventContract.filters.SealBurned(), DEPLOY_BLOCK),
  ]);

  const cancelledIds = new Set(cancelled.map(e => e.args.sealId.toString()));
  const burnedIds    = new Set(burned.map(e => e.args.sealId.toString()));

  const active = requested.filter(e => {
    const id = e.args.sealId.toString();
    return !cancelledIds.has(id) && !burnedIds.has(id);
  });

  const now = Math.floor(Date.now() / 1000);

  const results = await Promise.all(active.map(async (e) => {
    const sealId = Number(e.args.sealId);
    const walletAddress = e.args.owner;
    const burnExecutableAt = Number(e.args.executableAt);
    let tier = 0;
    try {
      const data = await contract.sealData(sealId);
      tier = Number(data[0]);
    } catch { /* seal may have been burned between event scan and now */ }

    return {
      sealId,
      walletAddress,
      tier,
      burnExecutableAt,
      canExecute: now >= burnExecutableAt,
      secondsRemaining: Math.max(0, burnExecutableAt - now),
    };
  }));

  // Drop any that were burned between the event scan and the sealData call
  return results.filter(r => r.tier > 0);
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
