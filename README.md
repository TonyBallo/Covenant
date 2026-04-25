# Covenant Protocol

> A membership protocol for simplified trust — soulbound trust seals with tiered verification for blockchain wallets

⚠️ **STATUS: MVP Live on Testnet — Security Audit Pending**

---

## Overview

Covenant is a membership protocol for simplified trust. It exists because the way people prove who they are online is broken and overcomplicated. Covenant fixes that by letting users verify once, at whatever level they choose, and issuing them a seal — a permanent, portable trust credential that proves their verified standing across every application and protocol that recognizes it.

**Key Innovation:** Balances privacy (encrypted off-chain storage) with accountability (time-locked revocation with legal disclosure process). Identity data never touches the blockchain — only the trust signal does.

---

## Live Demo

**Frontend:** [covenantprotocol.io](https://www.covenantprotocol.io)
**Backend API:** https://covenant-production-4cf7.up.railway.app
**Contract (Arbitrum Sepolia):** `0x3daB0f859804b2C42349ac6E54CCd7bc9417d871`
**Arbiscan:** [View Contract](https://sepolia.arbiscan.io/address/0x3daB0f859804b2C42349ac6E54CCd7bc9417d871)

---

## Current Status

**Version:** 2.3
**Test Coverage:** 41 tests passing, 100% statement/function/line coverage, 82% branch coverage
**Deployment:** Live on Arbitrum Sepolia testnet + Polygon Amoy
**Next Steps:** Security audit, then mainnet launch

---

## Architecture

### Stack
| Layer | Technology | Platform |
|-------|-----------|----------|
| Smart Contract | Solidity / Hardhat | Arbitrum Sepolia + Polygon Amoy |
| Backend API | Node.js / Express / ethers.js | Railway |
| Frontend | React 19 / Vite 7 / Tailwind CSS | Vercel |
| Database | PostgreSQL | Supabase |

### System Flow
```
User → Apply Form → Backend API → Admin Review
                                       ↓
                             Signature Generated
                                       ↓
                             Seal Minted On-Chain
                                       ↓
                        Anyone Can Verify via Member Lookup
```

### On-Chain (Public)
- Soulbound Seals (non-transferable NFTs)
- Tiered trust levels (I → V)
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

## Trust Tiers

| Tier | Name | Requirements | Use Cases |
|------|------|--------------|-----------|
| **I** | Bronze | Email, wallet address, IP geolocation, timestamp | Governance, airdrops, community access |
| **II** | Silver | + Full legal name, DOB, nationality, government ID, country of residence | Light-compliance DeFi, DAO treasuries, Web3 payroll |
| **III** | Gold | + ID document scan, biometric liveness, PEP & sanctions screening, source of funds | MiCA-exposed protocols, regulated lending, institutional DeFi |
| **IV** | Platinum | + Accredited/sophisticated investor proof, net worth or income verification, jurisdiction of tax residency | RWA platforms, security token offerings, private credit |
| **V** | Diamond | + Entity legal name, UBO structure, corporate registration, AML program documentation, LEI number | Corporate treasuries, institutional funds, market makers |

---

## What's New in v2

### Signature-Based Verification
Every seal mint includes cryptographic proof that Covenant verified the user. Prevents unauthorized minting even if the owner wallet is compromised.

### Time-Locked Burn System
90-day delay between burn request and execution. Gives protocols warning to settle obligations before a user can delete their seal.

### Zero On-Chain PII
Only the trust signal lives on-chain — all personal data is encrypted off-chain.

### Reentrancy Protection
All state-changing functions secured with OpenZeppelin's ReentrancyGuard.

### Full Backend & Frontend
Complete verification submission workflow with admin panel for approvals and on-chain minting.

---

## Project Structure

```
Project_Covenant/
├── contracts/
│   ├── Pact.sol                      # ERC721 soulbound NFT (Arbitrum Sepolia)
│   └── PactWitness.sol               # Attestation contract (Polygon Amoy)
├── scripts/
│   ├── deploy.js                     # Deploy Pact to Arbitrum Sepolia
│   ├── deployAttestation.js          # Deploy PactWitness to Polygon Amoy
│   ├── activateTiers.js              # Enable tier levels on deployed contract
│   ├── mintTestSeals.js              # Dev script to mint test seals
│   ├── repopulateSeals.js            # Migration script for redeployments
│   ├── uploadToIPFS.js               # Upload tier images + metadata to Pinata
│   ├── setMetadataURIs.js            # Set on-chain tier metadata URIs
│   └── ipfs/                         # IPFS metadata JSON for tiers 1–3
├── test/
│   └── IdentitySBT.test.js           # 41 comprehensive tests
├── backend/                          # Node.js/Express REST API (Railway)
│   ├── src/
│   │   ├── server.js                 # Express server + CORS config
│   │   ├── routes/
│   │   │   ├── kyc.js                # KYC submission endpoints
│   │   │   └── admin.js              # Admin approval + minting endpoints
│   │   └── services/
│   │       ├── signature.js          # ECDSA signature generation
│   │       ├── blockchain.js         # Arbitrum Sepolia interactions
│   │       └── polygon.js            # Polygon Amoy attestation
│   └── package.json
├── frontend/                         # React 19 + Vite 7 (Vercel)
│   ├── src/
│   │   ├── App.jsx                   # Router, navbar, wallet connection
│   │   ├── pages/
│   │   │   ├── Landing.jsx           # Marketing landing page (/)
│   │   │   ├── About.jsx             # About page (/about)
│   │   │   ├── ApplyForm.jsx         # Verification submission form
│   │   │   ├── Admin.jsx             # Admin panel (server-auth)
│   │   │   ├── Docs.jsx              # Documentation + tier breakdown
│   │   │   ├── MintCeremony.jsx      # Full-screen post-mint ceremony
│   │   │   ├── StatusPage.jsx        # User's own seal status
│   │   │   ├── TierSelect.jsx        # Tier picker
│   │   │   ├── VendorDemo.jsx        # Vendor integration demo
│   │   │   ├── VerifySuccess.jsx     # Post email-verification success
│   │   │   └── VerifyFailed.jsx      # Post email-verification failure
│   │   ├── components/
│   │   │   ├── SearchBar.jsx         # Member lookup address input
│   │   │   └── ResultDisplay.jsx     # Seal result visualization
│   │   └── utils/
│   │       ├── api.js                # Backend API helper functions
│   │       ├── contract.js           # Contract ABI + ethers.js read calls
│   │       └── constants.js          # Tier definitions, formatters
│   └── package.json
├── deployments.json                  # Canonical deployed contract addresses
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

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Generate coverage report
npx hardhat coverage

# Deploy to Arbitrum Sepolia
npx hardhat run scripts/deploy.js --network arbitrumSepolia
```

### Backend API
```bash
cd backend

# Install dependencies
npm install

# Create .env file (see Environment Variables below)
# Start development server (localhost:3001)
npm run dev
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local (see Environment Variables below)
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
ARBITRUM_SEPOLIA_RPC_URL=your_alchemy_arbitrum_sepolia_url
CONTRACT_ADDRESS=0x3daB0f859804b2C42349ac6E54CCd7bc9417d871
OWNER_PRIVATE_KEY=your_deployer_wallet_private_key
POLYGON_RPC_URL=your_polygon_amoy_rpc_url
POLYGON_ATTESTATION_ADDRESS=0x3F214e98C967e49f451c670654fA7D0580da3730
ADMIN_SECRET=your_admin_panel_password
RESEND_API_KEY=your_resend_api_key
FRONTEND_URL=http://localhost:5173
PORT=3001
NODE_ENV=development
```

### Frontend (`frontend/.env.local`)
```
VITE_API_URL=http://localhost:3001
VITE_ALCHEMY_KEY=your_alchemy_arbitrum_sepolia_api_key
```

---

## API Reference

### KYC Endpoints
```
POST /api/kyc/submit                       # Submit verification application (rate-limited: 3/15min)
GET  /api/kyc/verify/:token                # Email verification magic link
GET  /api/kyc/status/:address              # Check submission status
GET  /api/kyc/cross-chain-status/:address  # Cross-chain attestation status
```

### Admin Endpoints (Protected — requires `x-admin-secret` header)
```
GET  /api/admin/pending                # List pending submissions
GET  /api/admin/ready-to-mint          # List approved, unminted submissions
GET  /api/admin/revoked                # List revoked submissions
GET  /api/admin/seal/:address          # On-chain seal lookup
GET  /api/admin/polygon-status/:address  # Polygon attestation status
POST /api/admin/approve/:id            # Approve and generate signature
POST /api/admin/reject/:id             # Reject with reason
POST /api/admin/mint                   # Mint seal on Arbitrum Sepolia
POST /api/admin/attest/:id             # Attest seal on Polygon Amoy
POST /api/admin/revoke                 # Revoke an existing seal
POST /api/admin/upgrade                # Execute tier upgrade on Arbitrum Sepolia
```

### Health Check
```
GET  /health                           # Server status
```

---

## Smart Contract Integration

### Simplest Integration — `isValid()`
```solidity
// Returns true only if seal is active, unrevoked, unexpired, and at or above minTier
bool ok = pact.isValid(userAddress, 2); // 1=Bronze, 2=Silver, 3=Gold, 4=Platinum, 5=Diamond
```

### Check Verification Status
```javascript
const [verified, tier, revoked, burnPending, burnTime] =
    await pact.getVerificationStatus(userAddress);

console.log(`Verified: ${verified}`);
console.log(`Tier: ${tier}`); // 0=NONE, 1–5=I–V
console.log(`Revoked: ${revoked}`);
console.log(`Burn Pending: ${burnPending}`);
```

### Solidity Integration
```solidity
interface IPact {
    function isValid(address user, uint8 minTier) external view returns (bool);
    function getVerificationStatus(address user)
        external view
        returns (
            bool verified,
            uint8 tier,
            bool revoked,
            bool burnPending,
            uint256 burnExecutableAt
        );
}

contract YourProtocol {
    IPact public pact;

    modifier requiresVerification(uint8 minTier) {
        require(pact.isValid(msg.sender, minTier), "Covenant: insufficient trust tier");
        _;
    }

    // Require Silver (Tier 2) or above
    function deposit() external requiresVerification(2) {
        // your logic here
    }
}
```

---

## Security Features

### Signature Verification
```javascript
// Off-chain: Covenant signs verification
// Includes jurisdictionCode + chainId to prevent cross-chain/jurisdiction replay
const message = ethers.solidityPackedKeccak256(
    ["address", "uint8", "uint8", "uint256"],
    [userAddress, tier, jurisdictionCode, chainId]
);
const signature = await covenantKey.signMessage(ethers.getBytes(message));

// On-chain: Contract verifies signature before minting
await pact.mint(userAddress, tier, signature, expiresAt, jurisdictionCode);
```

### Time-Locked Burns
```javascript
await pact.requestBurn(sealId);       // 90-day countdown starts
await pact.cancelBurnRequest(sealId); // User can cancel anytime
await pact.executeBurn(sealId);       // Execute after 90 days
```

---

## Security Model

### What's On-Chain
- ✅ Wallet addresses (already public)
- ✅ Trust tiers (intended to be public)
- ✅ Revocation status (public safety info)
- ✅ Burn request status (protocol warning)
- ✅ Covenant signatures (cryptographic proof)

### What's Off-Chain
- ❌ Email addresses
- ❌ Legal names
- ❌ Government IDs
- ❌ Biometric data
- ❌ Any personally identifiable information

**Zero PII exposure on blockchain.**

---

## Roadmap

### v2.0 — MVP Live ✅ (COMPLETE)
- ✅ Signature-based verification
- ✅ Time-locked burn system
- ✅ Backend API with KYC workflow
- ✅ Admin panel with approval + minting
- ✅ Public member lookup frontend
- ✅ Deployed to Arbitrum Sepolia + Polygon Amoy

### v2.1 — Landing, Docs & Security ✅ (COMPLETE)
- ✅ Marketing landing page at `/`
- ✅ Docs page with tier breakdown + seal images
- ✅ Server-side admin authentication (`ADMIN_SECRET`)
- ✅ Cross-chain attestation on Polygon Amoy (PactWitness)
- ✅ jurisdictionCode in signature scheme
- ✅ Custom domain (covenantprotocol.io)

### v2.2 — NFT Metadata, Mint UX & Polish ✅ (COMPLETE)
- ✅ ERC721 `tokenURI` support — tier metadata pinned to IPFS via Pinata
- ✅ `adminBurn()` on Pact for clean contract migrations
- ✅ Contract redeployed to `0x3daB0f859804b2C42349ac6E54CCd7bc9417d871`, seals migrated
- ✅ Mint ceremony page with `wallet_watchAsset` NFT import
- ✅ Mint confirmation email via Resend
- ✅ Seal images in StatusPage, ResultDisplay, and public lookup
- ✅ About page, updated docs content, trust-first language throughout
- ✅ BSL 1.1 license added

### v2.3 — Seal Attributes & Upgrade Flow ✅ (COMPLETE)
- ✅ User-initiated burn flow with 90-day countdown (StatusPage)
- ✅ Tier upgrade application flow (user-facing: StatusPage → TierSelect → ApplyForm)
- ✅ Admin tier upgrade execution (Pending tab badge + Ready-to-Mint Execute Upgrade button)
- ✅ Jurisdiction code surfaced in StatusPage, ResultDisplay, and admin mint form
- ✅ Covenant signature exposed as collapsible on-chain proof section
- ✅ Address normalization for public seal lookup (EIP-55 case-insensitive)
- ✅ VendorDemo denial reason specificity

### v2.4 — Audit & SDK 🔨 (NEXT)
- [ ] External security audit
- [ ] JavaScript/TypeScript SDK for vendor integrations
- [ ] Mainnet deployment (Arbitrum, Polygon, Base)

### v3.0 — Decentralization 🔮 (2027)
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

**Integration & Partnership Inquiries:** tonyballo@covenantprotocol.io
**Twitter:** [@CovenantProto](https://twitter.com/CovenantProto)

---

## License

Business Source License 1.1 — see [LICENSE](LICENSE) for details.

Non-production use is permitted. Commercial use requires a separate license. Converts to Apache 2.0 on 2030-03-31.

---

## Disclaimer

⚠️ **Not Audited — Testnet Only**

This codebase has not been professionally audited.

- Do NOT use with real personal data
- Do NOT deploy to mainnet without a professional audit
- Do NOT use for production applications

Security audit scheduled for Q2 2026 before mainnet deployment.

---

*Last Updated: April 2026*
*Version: 2.3*
