// Your deployed IdentityPact contract on Arbitrum Sepolia
export const CONTRACT_ADDRESS = '0x2E47219B0910dc76233cdAb56aDDaa8d196c030A';

// Minimal ABI - only the functions we need for lookup
export const CONTRACT_ABI = [
  // Read functions
  "function getVerificationStatus(address user) view returns (bool verified, uint8 tier, bool revoked, bool burnPending, uint256 burnExecutableAt)",
  "function addressToSealId(address user) view returns (uint256)",
  "function sealData(uint256 sealId) view returns (uint8 tier, bytes signature, uint256 mintedAt, bool revoked, string reason)",
];

// Arbitrum Sepolia RPC endpoint
export const RPC_URL = 'https://arb-sepolia.g.alchemy.com/v2/6CV3VlE4QBCn1lt4BGsSf';
// Chain ID for Arbitrum Sepolia
export const CHAIN_ID = 421614;
// Arbiscan base URL for Arbitrum Sepolia
export const ETHERSCAN_BASE = 'https://sepolia.arbiscan.io';