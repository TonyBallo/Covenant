// Deployed Pact contract on Arbitrum Sepolia (Chain ID 421614)
export const CONTRACT_ADDRESS = '0xBfCA5341f3c370743d4A64Df7c732113A4f83187';

// Read-only ABI — only the view functions needed for public seal lookup.
// sealData returns: (tier, covenantSignature, mintedAt, expiresAt, revoked, revocationReason, jurisdictionCode)
export const CONTRACT_ABI = [
  "function getVerificationStatus(address user) view returns (bool verified, uint8 tier, bool revoked, bool burnPending, uint256 burnExecutableAt)",
  "function addressToSealId(address user) view returns (uint256)",
  "function sealData(uint256 sealId) view returns (uint8 tier, bytes covenantSignature, uint256 mintedAt, uint256 expiresAt, bool revoked, string revocationReason, uint8 jurisdictionCode)",
  "function isValid(address user, uint8 tier) view returns (bool)",
  "function isExpired(address user) view returns (bool)",
  "function requestBurn(uint256 sealId) external",
  "function cancelBurnRequest(uint256 sealId) external",
  "function executeBurn(uint256 sealId) external",
];

// Alchemy RPC endpoint for Arbitrum Sepolia — used for all read-only contract calls
export const RPC_URL = `https://arb-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`;
// Chain ID for Arbitrum Sepolia
export const CHAIN_ID = 421614;
// Block explorer base URL (Arbiscan — Arbitrum's Etherscan equivalent)
export const ETHERSCAN_BASE = 'https://sepolia.arbiscan.io';