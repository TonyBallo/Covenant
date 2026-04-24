// Deployed Pact contract on Arbitrum Sepolia (Chain ID 421614)
// v2: trust tree deployment — linkWallet, unlinkWallet, setCrossChainBoundary
export const CONTRACT_ADDRESS = '0x2c660a28826c11AfE4CFa13A003a8Fb783cfDbf1';

// Read-only ABI — view functions for seal lookup and trust tree queries.
export const CONTRACT_ABI = [
  "function getVerificationStatus(address user) view returns (bool verified, uint8 tier, bool revoked, bool burnPending, uint256 burnExecutableAt)",
  "function addressToSealId(address user) view returns (uint256)",
  "function sealData(uint256 sealId) view returns (uint8 tier, bytes covenantSignature, uint256 mintedAt, uint256 expiresAt, bool revoked, string revocationReason)",
  "function isValid(address user, uint8 tier) view returns (bool)",
  // Trust tree reads
  "function effectiveTier(address) view returns (uint8)",
  "function treeRoot(address) view returns (address)",
  "function treeParent(address) view returns (address)",
  "function getTreeChildren(address node) view returns (address[])",
  // Trust tree writes (used with BrowserProvider signer)
  "function linkWallet(address child, uint8 childTier, bytes rootSignature)",
  "function unlinkWallet(address child)",
];

// Alchemy RPC endpoint for Arbitrum Sepolia — used for all read-only contract calls
export const RPC_URL = `https://arb-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`;
// Chain ID for Arbitrum Sepolia
export const CHAIN_ID = 421614;
// Block explorer base URL (Arbiscan — Arbitrum's Etherscan equivalent)
export const ETHERSCAN_BASE = 'https://sepolia.arbiscan.io';