# CLAUDE.md — Project Covenant

Persistent context for Claude Code sessions. Generated 2026-03-18.

---

## Directory Structure

```
Project_Covenant/
├── contracts/
│   ├── IdentitySBT.sol                  # Main ERC721 soulbound NFT contract (IdentityPact v2, token name "Covenant Pact" / symbol "PACT")
│   └── CovenantAttestationBuild.sol     # Polygon Amoy attestation contract
├── covenant-backend/                    # Node.js/Express REST API
│   ├── src/
│   │   ├── server.js                    # Express app setup, CORS, Supabase init, hourly cleanup job
│   │   ├── routes/
│   │   │   ├── kyc.js                   # KYC submit, email verification, status, cross-chain status
│   │   │   └── admin.js                 # Approve/reject/mint/revoke/attest endpoints
│   │   └── services/
│   │       ├── blockchain.js            # ethers.js v6 calls to Sepolia contract (mint, revoke, getSealId)
│   │       ├── polygon.js               # Polygon Amoy attestation calls (attest, get, revoke)
│   │       └── signature.js             # ECDSA signature creation/verification for mint authorization
│   ├── package.json
│   └── .env                             # Backend secrets (Supabase, RPC, private key, PORT)
├── covenant-lookup/                     # React 19 + Vite 7 frontend
│   ├── src/
│   │   ├── App.jsx                      # Router, navbar, wallet connection, homepage search
│   │   ├── pages/
│   │   │   ├── ApplyForm.jsx            # KYC submission form (Tier I / Bronze only)
│   │   │   ├── Admin.jsx                # Admin panel (password-protected, Pending + Ready-to-Mint tabs)
│   │   │   ├── StatusPage.jsx           # Logged-in user's own verification status
│   │   │   ├── TierSelect.jsx           # Tier picker (only Tier I currently active)
│   │   │   ├── GetVerified.jsx          # Entry point for verification flow
│   │   │   ├── VerifySuccess.jsx        # Post email-verification success screen
│   │   │   └── VerifyFailed.jsx         # Post email-verification failure screen
│   │   ├── components/
│   │   │   ├── SearchBar.jsx            # Address input for public seal lookup
│   │   │   └── ResultDisplay.jsx        # Seal visualization with cross-chain badges
│   │   └── utils/
│   │       ├── api.js                   # All fetch calls to backend (API_BASE_URL from env)
│   │       ├── contract.js              # ABI + contract address + ethers.js read calls
│   │       └── constants.js             # TIERS map, formatDate(), formatAddress()
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js               # Custom colors: covenant.purple, covenant.gold, covenant.dark; safelist for dynamic tier colors
│   ├── postcss.config.js
│   ├── .env.local                       # VITE_API_URL (Railway production URL)
│   └── vercel.json
├── scripts/
│   ├── deploy.js                        # Hardhat deploy script for IdentityPact
│   ├── deployAttestation.js             # Hardhat deploy for Polygon attestation contract
│   └── mintTestSeals.js                 # Dev script to mint test seals
├── test/
│   └── IdentitySBT.test.js              # 41 tests, 100% statement/function/line coverage
├── hardhat.config.js                    # Solidity 0.8.28, Sepolia + Amoy networks, Etherscan
├── package.json                         # Root: Hardhat toolbox, OpenZeppelin, dotenv
├── deployments.json                     # Canonical deployed contract addresses
├── .env                                 # Root: RPC URLs, private keys (TESTNET DEMO ONLY)
├── README.md
├── CHANGELOG.md
├── ROADMAP.md
├── TODO.md
├── v2.SUMMARY.md
└── v2_changes.md
```

---

## Tech Stack — Exact Versions

### Smart Contracts
| Package | Version |
|---|---|
| hardhat | ^2.22.16 |
| @nomicfoundation/hardhat-toolbox | ^5.0.0 |
| @openzeppelin/contracts | ^5.4.0 |
| solidity-coverage | ^0.8.17 |
| Solidity | 0.8.28 |

### Backend (`covenant-backend/`)
| Package | Version |
|---|---|
| express | ^4.18.2 |
| cors | ^2.8.5 |
| ethers | ^6.9.0 |
| @supabase/supabase-js | ^2.39.0 |
| resend | ^6.9.2 |
| express-rate-limit | ^8.2.1 |
| dotenv | ^16.3.1 |
| nodemon (dev) | ^3.0.2 |
| Node.js ESM | `"type": "module"` |

### Frontend (`covenant-lookup/`)
| Package | Version |
|---|---|
| react | ^19.2.0 |
| react-dom | ^19.2.0 |
| react-router-dom | ^7.13.0 |
| ethers | ^6.16.0 |
| vite | ^7.3.1 |
| @vitejs/plugin-react | ^5.1.1 |
| tailwindcss | ^3.4.1 |
| postcss | ^8.5.6 |
| autoprefixer | ^10.4.24 |
| eslint | ^9.39.1 |

---

## Environment Variables

### Root `.env` (Hardhat scripts)
```
SEPOLIA_RPC_URL
SEPOLIA_PRIVATE_KEY
ETHERSCAN_API_KEY
POLYGON_PRIVATE_KEY
POLYGON_AMOY_RPC_URL
```

### `covenant-backend/.env`
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
SUPABASE_PRIVATE_KEY
SEPOLIA_RPC_URL
CONTRACT_ADDRESS
OWNER_PRIVATE_KEY
PORT
NODE_ENV
```

### `covenant-lookup/.env.local`
```
VITE_API_URL
```

---

## Deployed Contracts & Chain Info

### Ethereum Sepolia (Chain ID: 11155111)
| Field | Value |
|---|---|
| Contract | IdentitySBT (IdentityPact v2) |
| Active Address | `0x60859A972A9996cf24448323c7b1E49825f092a4` |
| Deployments.json Address | `0x2E47219B0910dc76233cdAb56aDDaa8d196c030A` |
| RPC | Alchemy Sepolia |
| Explorer | https://sepolia.etherscan.io |
| ERC721 Name | "Covenant Pact" |
| Symbol | "PACT" |

> Note: `CONTRACT_ADDRESS` in backend `.env` (`0x60859A...`) is the active one. `deployments.json` records the original deploy (`0x2E47...`).

### Polygon Amoy (Chain ID: 80002)
| Field | Value |
|---|---|
| Contract | CovenantAttestationBuild |
| RPC | https://rpc-amoy.polygon.technology/ |
| Explorer | https://amoy.polygonscan.com |

---

## Architecture

### Data Flow: User Verification

```
User fills ApplyForm
  → POST /api/kyc/submit (rate-limited: 3/15min)
    → Supabase: store submission (status: 'pending', email_verified: false)
    → Resend: send verification email with magic link token (expires 15min)

User clicks email link
  → GET /api/kyc/verify/:token
    → Supabase: email_verified = true
    → Redirect to /verify-success or /verify-failed

Admin views /api/admin/pending
  → Returns submissions where status='pending' AND email_verified=true

Admin approves submission
  → POST /api/admin/approve/:id
    → signature.js: ECDSA sign keccak256(address + tier) with OWNER_PRIVATE_KEY
    → Supabase: status='approved', signature stored

Admin mints seal
  → POST /api/admin/mint
    → blockchain.js: contract.mint(address, tier, signature) on Sepolia
    → Supabase: record in 'seals' table with txHash and sealId

Admin attests on Polygon
  → POST /api/admin/attest/:id
    → polygon.js: attestationContract.attestSeal() on Polygon Amoy
```

### Frontend → Backend
- All calls go through `covenant-lookup/src/utils/api.js`
- `API_BASE_URL` from `VITE_API_URL` env var (Railway production URL)
- Plain `fetch()` with JSON — no SDK, no axios
- Admin endpoints have no server-side auth (password checked client-side only)

### Frontend → Smart Contract (Read-Only)
- `covenant-lookup/src/utils/contract.js` creates a `JsonRpcProvider` (hardcoded Alchemy URL)
- ABI has 3 functions: `getVerificationStatus`, `addressToSealId`, `sealData`
- Used in `App.jsx` (homepage lookup) and `ResultDisplay.jsx` (cross-chain badges)
- Wallet connection uses `ethers.BrowserProvider(window.ethereum)` — MetaMask required

### Backend → Smart Contract
- `covenant-backend/src/services/blockchain.js` uses `ethers.JsonRpcProvider` (SEPOLIA_RPC_URL)
- Signed transactions via `new ethers.Wallet(OWNER_PRIVATE_KEY, provider)`
- Gas limits hardcoded: 300,000 for mint, 200,000 for revoke

### Wallet Connection Pattern
- `ethers.BrowserProvider(window.ethereum)` → `provider.send('eth_requestAccounts', [])`
- Connected address stored in `sessionStorage`
- Displayed in navbar; auto-fills wallet field in ApplyForm

---

## Smart Contract Details

### Tier System
| Tier | Name | Color |
|---|---|---|
| 0 | NONE | — |
| 1 | Bronze (I) | Orange |
| 2 | Silver (II) | Gray |
| 3 | Gold (III) | Yellow |
| 4 | Platinum (IV) | Blue |
| 5 | Diamond (V) | Purple |

### Key Structures
```solidity
enum Tier { NONE, I, II, III, IV, V }

struct SealData {
  Tier tier;
  bytes covenantSignature;
  uint256 mintedAt;
  bool revoked;
  string revocationReason;
}

struct BurnRequest {
  uint256 requestedAt;
  bool pending;
}
```

### Key Constants
- **Burn delay:** 90 days (time-locked, user-initiated)
- **One seal per address** (enforced by `addressToSealId` mapping)
- **Soulbound:** transfer/safeTransfer overridden to revert

### Security
- `ReentrancyGuard` on all state-changing functions
- ECDSA `recoverSigner()` validates backend signature on mint
- `verifyOwnership(address, sealId)` prevents spoofing

---

## Conventions

### File Naming
- React components and pages: PascalCase (`.jsx`)
- Utility files: camelCase (`.js`)
- Smart contracts: PascalCase (`.sol`)
- Backend services/routes: camelCase (`.js`)

### Frontend Organization
- `pages/` — full-page route components
- `components/` — reusable UI components
- `utils/` — API client, contract helpers, constants

### Backend Organization
- `routes/` — Express route handlers
- `services/` — external integrations (blockchain, polygon, signature)
- Supabase client exported from `server.js`, imported by routes

### API Endpoints
- User-facing: `/api/kyc/*`
- Admin-facing: `/api/admin/*`
- Health check: `GET /health`

### Tailwind Dynamic Classes
Tier colors use dynamic class names — kept in `tailwind.config.js` safelist:
`bg-{orange,gray,yellow,blue,purple}-100`, `text-{color}-{600,800}`

### State Management
- No Redux or Zustand — plain React `useState`/`useEffect`
- Backend state in Supabase
- On-chain state is source of truth for verification status

### Database Schema (Supabase)
Tables: `users`, `kyc_submissions`, `seals`, `attestations`

---

## Development Commands

```bash
# Smart contracts
npx hardhat test
npx hardhat coverage
REPORT_GAS=true npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat run scripts/deployAttestation.js --network amoy

# Backend
cd covenant-backend
npm run dev          # nodemon on port 3001

# Frontend
cd covenant-lookup
npm run dev          # vite on port 5173
npm run build
```

---

## Known Issues / Security Notes

1. **Admin auth is client-side only** — password `'covenant-demo-2026'` hardcoded in `Admin.jsx`. Production requires server-side auth.
2. **No auth on admin API routes** — any request to `/api/admin/*` succeeds if the correct body is sent.
3. **Testnet only** — not audited, not ready for mainnet or real personal data.
4. **`deployments.json` is stale** — the address there (`0x2E47...`) differs from the active contract in backend `.env` (`0x60859...`).
5. **Frontend contract address is hardcoded** in `utils/contract.js` (not in env).
