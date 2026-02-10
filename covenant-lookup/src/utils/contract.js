// Your deployed IdentityPact contract on Sepolia
export const CONTRACT_ADDRESS = '0x60859A972A9996cf24448323c7b1E49825f092a4';

// Minimal ABI - only the functions we need for lookup
export const CONTRACT_ABI = [
  // Read functions
  "function getVerificationStatus(address user) view returns (bool verified, uint8 tier, bool revoked, bool burnPending, uint256 burnExecutableAt)",
  "function addressToSealId(address user) view returns (uint256)",
  "function sealData(uint256 sealId) view returns (uint8 tier, bytes signature, uint256 mintedAt, bool revoked, string reason)",
];

// Sepolia RPC endpoint (using public endpoint - replace with Infura/Alchemy for production)
export const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/6CV3VlE4QBCn1lt4BGsSf';
// Etherscan base URL for Sepolia
export const ETHERSCAN_BASE = 'https://sepolia.etherscan.io';