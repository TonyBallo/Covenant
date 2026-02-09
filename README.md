# Project Covenant
![Repository Logo]([https://github.com/TonyBallo/Covenant/blob/main/logo.png)   
> A Web3 Certificate Authority - Soulbound identity verification with tiered trust levels

⚠️ **STATUS: Private Development - Stealth Mode**

This repository is private during initial development and customer validation phase.

---

## Overview

Project Covenant provides tiered identity verification for blockchain wallets through non-transferable (soulbound) NFTs. Users voluntarily provide identity information to receive verification credentials that protocols can trust.

**Key Innovation:** Balances privacy (encrypted off-chain storage) with accountability (revocable for fraud, with legal disclosure process).

---

## Current Status

**Version:** 1.0 (Proof of Concept)  
**Deployment:** Sepolia Testnet  
**Contract:** `0x2E47219B0910dc76233cdAb56aDDaa8d196c030A`  
**Status:** Customer validation phase

---

## Architecture

### On-Chain (Public)
- Soulbound NFTs (non-transferable)
- Tiered verification levels (BRONZE → PLATINUM)
- Revocation status
- Event logging

### Off-Chain (Private)
- Identity data (AES-256 encrypted)
- Verification workflow
- KYC integration
- Legal disclosure process

---

## Verification Tiers

| Tier | Level | Data Required | Use Cases |
|------|-------|---------------|-----------|
| 🥉 BRONZE | 1 | Email + Phone | Basic access, airdrops |
| 🥈 SILVER | 2 | + Full Name + Location | Community membership, voting |
| 🥇 GOLD | 3 | + Government ID | DeFi borrowing, marketplace trading |
| 💎 PLATINUM | 4 | + Full KYC + Biometrics | High-value loans, institutional access |

---

## Quick Start (Testnet)

### Check Verification Status
```javascript
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

const [verified, tier, revoked] = await contract.getVerificationStatus(userAddress);

console.log(`Verified: ${verified}`);
console.log(`Tier: ${tier}`);  // 0=NONE, 1=BRONZE, 2=SILVER, 3=GOLD, 4=PLATINUM
console.log(`Revoked: ${revoked}`);
```

### Solidity Integration
```solidity
interface IIdentitySBT {
    function getVerificationStatus(address user) 
        external view 
        returns (bool isVerified, Tier tier, bool isRevoked);
}

contract YourProtocol {
    IIdentitySBT public sbt;
    
    function requireVerification(address user, Tier minimumTier) internal view {
        (bool verified, Tier tier, bool revoked) = sbt.getVerificationStatus(user);
        require(verified && !revoked && tier >= minimumTier, "Insufficient verification");
    }
}
```

---

## Security Model

### What's On-Chain
- ✅ Wallet addresses (already public)
- ✅ Verification tiers (intended to be public)
- ✅ Revocation status (public safety info)
- ✅ Timestamps (metadata)

### What's Off-Chain
- ❌ Email addresses
- ❌ Phone numbers
- ❌ Legal names
- ❌ Physical addresses
- ❌ Government IDs
- ❌ Biometric data
- ❌ ANY personally identifiable information

**Zero PII exposure on blockchain.**

---

## Development Roadmap

### v1.0 - Proof of Concept ✅
**Status:** Deployed to Sepolia  
**Focus:** Core functionality validation

- Soulbound NFT implementation
- Tiered verification system
- Owner-controlled minting/revocation
- User burn capability
- Event logging

### v2.0 - Production Hardening 🔨
**Status:** In Development  
**Focus:** Security, privacy, multi-chain

**Major Features:**
- Signature-based verification (cryptographic proof)
- Time-locked burn system (90-day delay)
- Identity hash removal (privacy upgrade)
- Reentrancy protection
- Multi-chain deployment (Ethereum, Polygon, Arbitrum, Base)
- Ownership verification helper

**Timeline:** Q2 2026

### v3.0 - Decentralization 🔮
**Status:** Planned  
**Focus:** Remove single points of failure

- Multi-sig verification
- DAO governance
- Cross-chain messaging

---

## Files
```
Project_Covenant/
├── contracts/
│   └── IdentitySBT.sol          # Core soulbound token
├── scripts/
│   └── deploy.js                # Deployment script
├── test/
│   └── IdentitySBT.test.js      # Test suite
├── docs/
│   ├── ROADMAP.md               # Development roadmap
│   ├── CHANGELOG.md             # Version history
│   ├── V2_CHANGES.md            # v2 upgrade details
│   └── INTEGRATION.md           # Protocol integration guide
├── deployments.json             # Deployed contract addresses
├── hardhat.config.js
├── package.json
└── README.md
```

---

## Contact

**Project Status:** Stealth mode - customer validation phase  
**For Protocol Partnerships:** [Create private contact method - email/telegram]

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

## Disclaimer

⚠️ **Testnet Only - Not Audited**

This contract is deployed on Sepolia testnet for validation purposes only.

- Do NOT use with real personal data
- Do NOT deploy to mainnet without security audit
- Do NOT use for production applications

v2 will include professional security audit before mainnet deployment.

---

*Last Updated: January 2026*
