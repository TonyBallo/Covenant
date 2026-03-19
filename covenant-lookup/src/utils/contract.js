// Deployed Pact contract on Arbitrum Sepolia (Chain ID 421614)
export const CONTRACT_ADDRESS = '0x2E47219B0910dc76233cdAb56aDDaa8d196c030A';

// Read-only ABI — only the three view functions needed for public seal lookup.
// sealData returns: (tier, covenantSignature, mintedAt, expiresAt, revoked, revocationReason)
export const CONTRACT_ABI = [
  "function getVerificationStatus(address user) view returns (bool verified, uint8 tier, bool revoked, bool burnPending, uint256 burnExecutableAt)",
  "function addressToSealId(address user) view returns (uint256)",
  "function sealData(uint256 sealId) view returns (uint8 tier, bytes covenantSignature, uint256 mintedAt, uint256 expiresAt, bool revoked, string revocationReason)",
];

// Alchemy RPC endpoint for Arbitrum Sepolia — used for all read-only contract calls
export const RPC_URL = 'https://arb-sepolia.g.alchemy.com/v2/6CV3VlE4QBCn1lt4BGsSf';
// Chain ID for Arbitrum Sepolia
export const CHAIN_ID = 421614;
// Block explorer base URL (Arbiscan — Arbitrum's Etherscan equivalent)
export const ETHERSCAN_BASE = 'https://sepolia.arbiscan.io';