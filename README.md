# Project Covenant

> A Web3 Certificate Authority - Soulbound identity verification with tiered trust levels


⚠️ **STATUS: v2 Development Complete - Security Audit Pending**

---

## Overview

Project Covenant provides tiered identity verification for blockchain wallets through non-transferable (soulbound) NFTs called **Seals**. Users voluntarily provide identity information to receive verification credentials that protocols can trust.

**Key Innovation:** Balances privacy (encrypted off-chain storage) with accountability (time-locked revocation with legal disclosure process).

---

## Current Status

**Version:** 2.0 (Security Hardened)  
**Test Coverage:** 41 tests passing, 100% statement coverage, 82% branch coverage  
**Deployment:** Ready for testnet deployment  
**Next Steps:** Security audit, then mainnet launch

---

## What's New in v2

### **Signature-Based Verification**
Every seal mint includes cryptographic proof that Covenant verified the user. Prevents unauthorized minting even if owner wallet is compromised.

### **Time-Locked Burn System**
90-day delay between burn request and execution. Gives protocols warning to settle obligations before user can delete their seal.

### **Zero On-Chain PII**
Removed identity hash from contract. Only verification status lives on-chain - all personal data encrypted off-chain.

### **Reentrancy Protection**
All state-changing functions secured with OpenZeppelin's ReentrancyGuard.

### **Ownership Verification**
Helper function prevents spoofing attacks where users claim someone else's seal.

---

## Architecture

### On-Chain (Public)
- Soulbound Seals (non-transferable NFTs)
- Tiered verification levels (I → V)
- Revocation status
- Burn request tracking
- Cryptographic signatures proving verification
- Event logging

### Off-Chain (Private)
- Identity data (AES-256 encrypted)
- Verification workflow
- KYC integration
- Legal disclosure process

---

## Verification Tiers

| Tier | Requirements | Use Cases |
|------|--------------|-----------|
| **I** | Email | Basic access, airdrops, community membership |
| **II** | + Phone OR Social Account OR Wallet History (6mo+) | Governance voting, token sales |
| **III** | + Government ID | DeFi borrowing, marketplace trading |
| **IV** | + Full KYC + Address Verification | High-value loans, premium features |
| **V** | + Biometrics + Background Check | Institutional access, regulated services |

---

## Quick Start

### Check Verification Status
```javascript
const [verified, tier, revoked, burnPending, burnTime] = 
    await pact.getVerificationStatus(userAddress);

console.log(`Verified: ${verified}`);
console.log(`Tier: ${tier}`); // 0=NONE, 1-5=I-V
console.log(`Revoked: ${revoked}`);
console.log(`Burn Pending: ${burnPending}`);
console.log(`Executable At: ${burnTime}`);
```

### Solidity Integration
```solidity
interface IIdentityPact {
    function getVerificationStatus(address user) 
        external view 
        returns (
            bool isVerified, 
            Tier tier, 
            bool isRevoked,
            bool burnPending,
            uint256 burnExecutableAt
        );
    
    function verifyOwnership(address user, uint256 sealId)
        external view
        returns (bool);
}

contract YourProtocol {
    IIdentityPact public pact;
    
    function requireVerification(address user, uint8 minimumTier) internal view {
        (bool verified, uint8 tier, bool revoked, bool burnPending,) = 
            pact.getVerificationStatus(user);
            
        require(verified && !revoked && !burnPending, "Invalid verification");
        require(tier >= minimumTier, "Insufficient tier");
    }
}
```

---

## Security Features

### Signature Verification
```javascript
// Off-chain: Covenant signs verification
const message = ethers.solidityPackedKeccak256(
    ["address", "uint8"],
    [userAddress, tier]
);
const signature = await covenantKey.signMessage(ethers.getBytes(message));

// On-chain: Contract verifies signature
await pact.mint(userAddress, tier, signature);
```

### Time-Locked Burns
```javascript
// User requests burn
await pact.requestBurn(sealId);
// 90-day countdown starts

// User can cancel
await pact.cancelBurnRequest(sealId);

// After 90 days, user can execute
await pact.executeBurn(sealId);
```

### Ownership Verification
```javascript
// Backend receives user claim: { address: "0xUser", sealId: 5 }
const isValid = await pact.verifyOwnership(userAddress, sealId);
// Prevents spoofing attacks
```

---

## Security Model

### What's On-Chain
- ✅ Wallet addresses (already public)
- ✅ Verification tiers (intended to be public)
- ✅ Revocation status (public safety info)
- ✅ Burn request status (protocol warning)
- ✅ Covenant signatures (cryptographic proof)
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

## Development Status

### v2.0 - Production Hardening ✅ (COMPLETE)
**Status:** Ready for audit  
**Test Coverage:** 41 tests, 100% statement coverage

**Features:**
- ✅ Signature-based verification (cryptographic proof)
- ✅ Time-locked burn system (90-day delay)
- ✅ Identity hash removal (privacy upgrade)
- ✅ Reentrancy protection
- ✅ Ownership verification helper
- ✅ Complete rebrand (Pact/Seal terminology)

### v2.1 - Security Audit & Deployment 🔨 (NEXT)
**Timeline:** Q2 2026  
**Focus:** Production readiness

**Tasks:**
- [ ] External security audit (Trail of Bits / OpenZeppelin)
- [ ] Deploy to testnet (Sepolia)
- [ ] Multi-chain deployment (Ethereum, Polygon, Arbitrum, Base)
- [ ] Integration documentation
- [ ] SDK development

### v3.0 - Decentralization 🔮 (PLANNED)
**Timeline:** 2027  
**Focus:** Remove single points of failure

**Features:**
- Multi-sig verification (3-of-5 verifiers)
- DAO governance for revocations
- Decentralized KYC verification network
- Cross-chain messaging (LayerZero/Chainlink)

---

## Files
```
Project_Covenant/
├── contracts/
│   └── IdentityPact.sol         # v2 contract (signature-based, time-locked burns)
├── scripts/
│   └── deploy.js                # Deployment script
├── test/
│   └── IdentityPact.test.js     # 41 comprehensive tests
├── docs/
│   ├── ROADMAP.md               # Development roadmap
│   ├── CHANGELOG.md             # Version history
│   ├── V2_SUMMARY.md            # v2 changes summary
│   └── INTEGRATION.md           # Protocol integration guide
├── coverage/                    # Test coverage reports
├── deployments.json             # Deployed contract addresses
├── hardhat.config.js
├── package.json
└── README.md
```

---

## Testing
```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Generate coverage report
npx hardhat coverage
```

**Current Coverage:**
- Statements: 100%
- Functions: 100%
- Lines: 100%
- Branches: 82%

---
## Frontend Lookup Tool

A web-based lookup tool for querying Covenant verification seals.

**Location:** `covenant-lookup/`

**Features:**
- Search any Ethereum address
- Display verification tier and status
- Real-time blockchain data
- Links to Etherscan for verification

**Quick Start:**
```bash
cd covenant-lookup
npm install
npm run dev
```

**Live Demo:** (Coming soon)

See `covenant-lookup/README.md` for full documentation.

## Contact

**Project Status:** Stealth mode - customer validation phase  
**For Protocol Partnerships:** [Create private contact method]

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

## Disclaimer

⚠️ **Not Audited - Testnet Only**

v2 is ready for security audit but not yet audited.

- Do NOT use with real personal data yet
- Do NOT deploy to mainnet without professional audit
- Do NOT use for production applications

Security audit scheduled for Q2 2026 before mainnet deployment.

---

*Last Updated: February 2026*
*Version: 2.0*