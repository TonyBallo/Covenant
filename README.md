# Project Covenant

> A Web3 Certificate Authority - Soulbound identity verification with tiered trust levels

⚠️ **STATUS: MVP Live on Testnet - Security Audit Pending**

---

## Overview

Project Covenant provides tiered identity verification for blockchain wallets through non-transferable (soulbound) NFTs called **Seals**. Users voluntarily provide identity information to receive verification credentials that protocols can trust.

**Key Innovation:** Balances privacy (encrypted off-chain storage) with accountability (time-locked revocation with legal disclosure process).

---

## Live Demo

**Frontend:** [covenant-protocol.vercel.app](https://covenant-protocol.vercel.app)  
**Backend API:** https://covenant-production-4cf7.up.railway.app  
**Contract (Sepolia):** `0x60859A972A9996cf24448323c7b1E49825f092a4`  
**Etherscan:** [View Contract](https://sepolia.etherscan.io/address/0x60859A972A9996cf24448323c7b1E49825f092a4)

### Test Addresses
Search any of these on the lookup tool to see live seal data:
```
Tier 1 (Bronze): 0x1111111111111111111111111111111111111111
Tier 2 (Silver): 0x3333333333333333333333333333333333333333
Tier 3 (Gold):   0x5555555555555555555555555555555555555555
Tier 4 (Platinum): 0x8888888888888888888888888888888888888888
Tier 5 (Diamond):  0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
```

---

## Current Status

**Version:** 2.0 (MVP Live)
**Test Coverage:** 41 tests passing, 100% statement coverage, 82% branch coverage  
**Deployment:** Live on Sepolia testnet  
**Next Steps:** Security audit, then mainnet launch

---

## Architecture

### Stack
| Layer | Technology | Platform |
|-------|-----------|----------|
| Smart Contract | Solidity / Hardhat | Sepolia Testnet |
| Backend API | Node.js / Express / ethers.js | Railway |
| Frontend | React / Vite / Tailwind CSS | Vercel |
| Database | PostgreSQL | Supabase |

### System Flow
```
User → Get Verified Form → Backend API → Admin Review
                                              ↓
                                    Signature Generated
                                              ↓
                                    Seal Minted On-Chain
                                              ↓
                               Anyone Can Verify via Lookup
```

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

| Tier | Name | Requirements | Use Cases |
|------|------|--------------|-----------|
| **I** | Bronze | Email | Basic access, airdrops, community membership |
| **II** | Silver | + Phone or Social Account | Governance voting, token sales |
| **III** | Gold | + Government ID | DeFi borrowing, marketplace trading |
| **IV** | Platinum | + Full KYC + Address Verification | High-value loans, premium features |
| **V** | Diamond | + Biometrics + Background Check | Institutional access, regulated services |

---

## What's New in v2

### Signature-Based Verification
Every seal mint includes cryptographic proof that Covenant verified the user. Prevents unauthorized minting even if owner wallet is compromised.

### Time-Locked Burn System
90-day delay between burn request and execution. Gives protocols warning to settle obligations before user can delete their seal.

### Zero On-Chain PII
Removed identity hash from contract. Only verification status lives on-chain - all personal data encrypted off-chain.

### Reentrancy Protection
All state-changing functions secured with OpenZeppelin's ReentrancyGuard.

### Full Backend & Frontend
Complete KYC submission workflow with admin panel for approvals and on-chain minting.

---

## Project Structure

```
Project_Covenant/
├── contracts/
│   └── IdentityPact.sol              # v2 contract (signature-based, time-locked burns)
├── scripts/
│   ├── deploy.js                     # Deployment script
│   └── mintTestSeals.js              # Test seal minting script
├── test/
│   └── IdentityPact.test.js          # 41 comprehensive tests
├── backend/                 # Backend API
│   ├── src/
│   │   ├── server.js                 # Express server + CORS config
│   │   ├── routes/
│   │   │   ├── kyc.js                # KYC submission endpoints
│   │   │   └── admin.js              # Admin approval + minting endpoints
│   │   └── services/
│   │       ├── signature.js          # Cryptographic signature generation
│   │       └── blockchain.js         # On-chain minting interactions
│   └── package.json
├── frontend/                  # Frontend Application
│   ├── src/
│   │   ├── App.jsx                   # Main app with routing
│   │   ├── pages/
│   │   │   ├── GetVerified.jsx       # KYC submission form
│   │   │   └── Admin.jsx             # Admin panel (password protected)
│   │   ├── components/
│   │   │   ├── SearchBar.jsx         # Address lookup input
│   │   │   └── ResultDisplay.jsx     # Seal result visualization
│   │   └── utils/
│   │       ├── api.js                # Backend API helper functions
│   │       ├── contract.js           # Contract ABI + config
│   │       └── constants.js          # Tier definitions
│   └── package.json
├── docs/
│   ├── ROADMAP.md
│   ├── CHANGELOG.md
│   ├── V2_SUMMARY.md
│   └── SESSION_SUMMARY.md           # Full technical handoff document
├── hardhat.config.js
├── package.json
└── README.md
```

---

## Local Development

### Prerequisites
- Node.js v18+
- Git

### Smart Contract
```bash
# Install dependencies
npm install

# Run tests
npx hardhat test

# Run with coverage
npx hardhat coverage

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Open Hardhat console
npx hardhat console --network sepolia
```

### Backend API
```bash
cd covenant-backend

# Install dependencies
npm install

# Create .env file (see Environment Variables below)
cp .env.example .env

# Start development server (localhost:3001)
npm run dev
```

### Frontend
```bash
cd covenant-lookup

# Install dependencies
npm install

# Create .env.local file
echo "VITE_API_URL=http://localhost:3001" > .env.local

# Start development server (localhost:5173)
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
SEPOLIA_RPC_URL=your_alchemy_or_infura_url
CONTRACT_ADDRESS=0x60859A972A9996cf24448323c7b1E49825f092a4
OWNER_PRIVATE_KEY=your_deployer_wallet_private_key
PORT=3001
NODE_ENV=development
```

### Frontend (`frontend/.env.local`)
```
VITE_API_URL=http://localhost:3001
```

---

## API Reference

### KYC Endpoints
```
POST /api/kyc/submit         # Submit KYC application
GET  /api/kyc/status/:address  # Check verification status
```

### Admin Endpoints (Protected)
```
GET  /api/admin/pending        # List pending submissions
POST /api/admin/approve/:id    # Approve and generate signature
POST /api/admin/mint           # Mint seal on-chain
POST /api/admin/revoke         # Revoke an existing seal
GET  /api/admin/ready-to-mint  # List approved, unminted submissions
```

### Health Check
```
GET  /health                   # Server status
```

---

## Smart Contract Integration

### Check Verification Status
```javascript
const [verified, tier, revoked, burnPending, burnTime] = 
    await pact.getVerificationStatus(userAddress);

console.log(`Verified: ${verified}`);
console.log(`Tier: ${tier}`); // 0=NONE, 1-5=I-V
console.log(`Revoked: ${revoked}`);
console.log(`Burn Pending: ${burnPending}`);
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
await pact.requestBurn(sealId);    // 90-day countdown starts
await pact.cancelBurnRequest(sealId); // User can cancel
await pact.executeBurn(sealId);    // Execute after 90 days
```

---

## Security Model

### What's On-Chain
- ✅ Wallet addresses (already public)
- ✅ Verification tiers (intended to be public)
- ✅ Revocation status (public safety info)
- ✅ Burn request status (protocol warning)
- ✅ Covenant signatures (cryptographic proof)

### What's Off-Chain
- ❌ Email addresses
- ❌ Phone numbers  
- ❌ Legal names
- ❌ Government IDs
- ❌ Any personally identifiable information

**Zero PII exposure on blockchain.**

---

## Roadmap

### v2.0 - MVP Live ✅ (COMPLETE)
- ✅ Signature-based verification
- ✅ Time-locked burn system
- ✅ Backend API with KYC workflow
- ✅ Admin panel with approval + minting
- ✅ Public lookup frontend
- ✅ Deployed to Sepolia testnet

### v2.1 - Security Audit & Hardening 🔨 (NEXT - Q2 2026)
- [ ] External security audit (Trail of Bits / OpenZeppelin)
- [ ] User dashboard (check own KYC status)
- [ ] Email notifications
- [ ] Wallet-based admin authentication
- [ ] Rate limiting + API hardening
- [ ] Multi-chain deployment (Polygon, Arbitrum, Base)

### v3.0 - Decentralization 🔮 (2027)
- Multi-sig verification (3-of-5 verifiers)
- DAO governance for revocations
- Decentralized KYC verification network
- Cross-chain messaging (LayerZero/Chainlink)

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

## Contact

**Project Status:** Stealth mode - customer validation phase  
**For Protocol Partnerships:** [Create private contact method]

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

## Disclaimer

⚠️ **Not Audited - Testnet Only**

This codebase has not been professionally audited.

- Do NOT use with real personal data
- Do NOT deploy to mainnet without a professional audit
- Do NOT use for production applications

Security audit scheduled for Q2 2026 before mainnet deployment.

---

*Last Updated: February 2026*  
*Version: 2.0 - MVP Live*
