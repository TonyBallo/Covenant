# CLAUDE.md — Project Covenant

Persistent context for Claude Code sessions. Updated 2026-05-25.

---

## Directory Structure

```
Project_Covenant/
├── contracts/
│   ├── Pact.sol                         # Main ERC721 soulbound NFT contract (ERC721 name "Covenant Pact" / symbol "PACT")
│   └── PactWitness.sol                  # Polygon Amoy attestation contract
├── backend/                    # Node.js/Express REST API
│   ├── src/
│   │   ├── server.js                    # Express app setup, CORS, Supabase init, hourly cleanup job
│   │   ├── routes/
│   │   │   ├── kyc.js                   # KYC submit, send-otp/verify-otp (Twilio Verify), email verification, status, cross-chain status; validates email format + domain before insertion
│   │   │   └── admin.js                 # Approve/reject/mint/revoke/attest/reattest/upgrade/pending-burns/lookup endpoints
│   │   └── services/
│   │       ├── blockchain.js            # ethers.js v6 calls to Arbitrum Sepolia (mint, revoke, getSealId, getSealInfo)
│   │       ├── polygon.js               # Polygon Amoy attestation calls (attest, get, revoke)
│   │       └── signature.js             # ECDSA signature creation/verification for mint authorization
│   ├── package.json
│   └── .env                             # Backend secrets (Supabase, RPC, private key, PORT)
├── frontend/                     # React 19 + Vite 7 frontend
│   ├── src/
│   │   ├── App.jsx                      # Router, navbar, wallet connection, homepage search
│   │   ├── pages/
│   │   │   ├── Landing.jsx              # Marketing landing page at "/" (no navbar; scroll-locked)
│   │   │   ├── Landing.css              # Landing page styles
│   │   │   ├── About.jsx                # About/principles page ("/about")
│   │   │   ├── ApplyForm.jsx            # KYC submission form (Tier I / Bronze only); phone OTP via Twilio; validates email format + domain on blur/submit
│   │   │   ├── Admin.jsx                # Admin panel (server-auth; Pending, Ready-to-Mint, Revoke Seal, Revoked Seals tabs)
│   │   │   ├── Docs.jsx                 # Documentation page with tier info and seal images
│   │   │   ├── GetVerified.jsx          # Simplified KYC submission form (higher tiers; no OTP flow)
│   │   │   ├── MintCeremony.jsx         # Full-screen post-mint ceremony (wallet_watchAsset, shown once per seal via sessionStorage)
│   │   │   ├── StatusPage.jsx           # Logged-in user's own verification status (always checks on-chain; shows seal image + Add to Wallet)
│   │   │   ├── TierSelect.jsx           # Tier picker (only Tier I currently active)
│   │   │   ├── VendorDemo.jsx           # Vendor integration demo — plain address input (no wallet connect); mystery showcase (5 neutral cards, shuffled addresses); dashboard values scale by tier (Silver–Diamond only; Bronze can't pass Silver gate)
│   │   │   ├── VerifySuccess.jsx        # Post email-verification success screen
│   │   │   └── VerifyFailed.jsx         # Post email-verification failure screen
│   │   ├── components/
│   │   │   ├── SearchBar.jsx            # Address input for public seal lookup; 5 tier quick-test buttons
│   │   │   ├── ResultDisplay.jsx        # Seal visualization — full-width seal image, tier row with hoverable info tooltip, attribute grid (matches StatusPage layout)
│   │   │   └── WalletShowcase.jsx       # Animated wallet card showcase on homepage; links to seal lookup
│   │   └── utils/
│   │       ├── api.js                   # All fetch calls to backend (API_BASE_URL from env)
│   │       ├── contract.js              # ABI + contract address + ethers.js read calls (Arbitrum Sepolia)
│   │       ├── constants.js             # TIERS map, formatDate(), formatAddress()
│   │       └── emailValidation.js       # isValidEmailFormat() + isEmailDomainAllowed() — used by ApplyForm; mirrors logic in backend kyc.js
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js               # Custom colors: covenant.purple, covenant.gold, covenant.dark; safelist for dynamic tier colors
│   ├── postcss.config.js
│   ├── .env.local                       # VITE_API_URL (Railway production URL)
│   └── vercel.json
├── scripts/
│   ├── deploy.js                        # Hardhat deploy script for Pact
│   ├── deployAttestation.js             # Hardhat deploy for PactWitness (Polygon Amoy)
│   ├── activateTiers.js                 # One-off script to enable tier levels on a deployed Pact contract
│   ├── mintExpiredSeal.js               # Dev script to mint a seal with an already-expired expiresAt (testing)
│   ├── mintTestSeals.js                 # Dev script to mint test seals
│   ├── repopulateSeals.js               # Migration script — re-mints all seals from an old contract onto a new one
│   ├── uploadToIPFS.js                  # Uploads tier PNG images + metadata JSON to Pinata; patches image CIDs in-place
│   ├── setMetadataURIs.js               # Calls setTierMetadataURI on a deployed Pact contract for tiers 1–3
│   └── ipfs/                            # IPFS metadata JSON (tier-1.json, tier-2.json, tier-3.json)
├── test/
│   └── IdentitySBT.test.js              # 41 tests, 100% statement/function/line coverage
├── hardhat.config.js                    # Solidity 0.8.28, arbitrumSepolia + amoy networks, Arbiscan
├── package.json                         # Root: Hardhat toolbox, OpenZeppelin, dotenv
├── deployments.json                     # Canonical deployed contract addresses (Arbitrum Sepolia + Polygon Amoy)
├── .env                                 # Root: RPC URLs, private keys (TESTNET DEMO ONLY)
├── README.md
├── CHANGELOG.md
├── ROADMAP.md
├── TODO.md
├── V2_SUMMARY.md
└── V2_CHANGES.md
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

### Backend (`backend/`)
| Package | Version |
|---|---|
| express | ^4.18.2 |
| cors | ^2.8.5 |
| ethers | ^6.9.0 |
| @supabase/supabase-js | ^2.39.0 |
| resend | ^6.9.2 |
| twilio | ^6.0.2 |
| express-rate-limit | ^8.2.1 |
| dotenv | ^16.3.1 |
| nodemon (dev) | ^3.0.2 |
| Node.js ESM | `"type": "module"` |

### Frontend (`frontend/`)
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

### Root `.env` (Hardhat scripts + repopulateSeals)
```
ARBITRUM_SEPOLIA_RPC_URL
ARBITRUM_SEPOLIA_PRIVATE_KEY
ARBISCAN_API_KEY
POLYGON_PRIVATE_KEY
POLYGON_AMOY_RPC_URL

# Migration script (repopulateSeals.js) — set before running
OLD_CONTRACT_ADDRESS
NEW_CONTRACT_ADDRESS
MIGRATE_FROM_BLOCK        # optional: deployment block of old contract, speeds up event scan
INCLUDE_REVOKED           # optional: "true" to re-mint and re-revoke revoked seals
```

### `backend/.env`
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
SUPABASE_PRIVATE_KEY
ARBITRUM_SEPOLIA_RPC_URL
CONTRACT_ADDRESS
OWNER_PRIVATE_KEY
POLYGON_RPC_URL
POLYGON_ATTESTATION_ADDRESS
ADMIN_SECRET
RESEND_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_VERIFY_SERVICE_SID
FRONTEND_URL
PORT
NODE_ENV
```

### `frontend/.env.local`
```
VITE_API_URL
```

---

## Deployed Contracts & Chain Info

### Arbitrum Sepolia (Chain ID: 421614)
| Field | Value |
|---|---|
| Contract | Pact |
| Address | `0x3daB0f859804b2C42349ac6E54CCd7bc9417d871` |
| Deployer | `0xaDff4AF90C4f354eF21B6225fAEE61FbED1E642b` |
| Deployed | Apr-25-2026 |
| RPC | Alchemy Arbitrum Sepolia |
| Explorer | https://sepolia.arbiscan.io |
| ERC721 Name | "Covenant Pact" |
| Symbol | "PACT" |

### Polygon Amoy (Chain ID: 80002)
| Field | Value |
|---|---|
| Contract | PactWitness |
| Address | `0x9E81f21Ca8e4dc0ce5D8db5F642E7b4D72a6B6F5` |
| RPC | https://rpc-amoy.polygon.technology/ |
| Explorer | https://amoy.polygonscan.com |

---

## Architecture

### Data Flow: User Verification

```
User fills ApplyForm
  → client-side: email format + domain validated on blur/submit (emailValidation.js)
  → POST /api/kyc/send-otp  { phone }
    → Twilio Verify: send SMS OTP to phone number (rate-limited: otpLimiter)
  → POST /api/kyc/verify-otp  { phone, code }
    → Twilio Verify: check OTP; returns signed phoneVerificationToken (HMAC, 10min TTL)
  → POST /api/kyc/submit (rate-limited: 3/15min)  { ...formData, phoneVerificationToken }
    → server-side: validates phoneVerificationToken, email format check, domain allowlist/blocklist check (rejects disposable providers)
    → Supabase: store submission (status: 'pending', email_verified: false, phone_verified: true)
    → Resend: send verification email with magic link token (expires 15min)

User clicks email link
  → GET /api/kyc/verify/:token
    → Supabase: email_verified = true
    → Redirect to /demo/verify-success or /demo/verify-failed

Admin views /api/admin/pending
  → Returns submissions where status='pending' AND email_verified=true

Admin approves submission
  → POST /api/admin/approve/:id
    → signature.js: ECDSA sign keccak256(address + tier + jurisdictionCode + chainId) with OWNER_PRIVATE_KEY
    → Supabase: status='approved', signature stored

Admin mints seal
  → POST /api/admin/mint
    → blockchain.js: contract.mint(address, tier, signature, expiresAt) on Arbitrum Sepolia
    → Supabase: record in 'seals' table with txHash and sealId

Admin attests on Polygon
  → POST /api/admin/attest/:id
    → polygon.js: attestationContract.attestSeal() on Polygon Amoy

Admin revokes seal
  → POST /api/admin/revoke  { sealId, walletAddress, reason }
    → blockchain.js: contract.revoke(sealId, reason) on Arbitrum Sepolia
    → Supabase: kyc_submissions status set to 'revoked'
```

### Frontend → Backend
- All calls go through `frontend/src/utils/api.js`
- `API_BASE_URL` hardcoded to Railway production URL (not from env)
- Plain `fetch()` with JSON — no SDK, no axios
- Admin endpoints require `x-admin-secret` header, validated server-side against `ADMIN_SECRET` env var
- Admin secret is set at login time via `setAdminSecret()` module function — never in the JS bundle

### Frontend → Smart Contract (Read-Only)
- `frontend/src/utils/contract.js` creates a `JsonRpcProvider` pointed at Arbitrum Sepolia (Alchemy)
- ABI exposes 4 view functions: `getVerificationStatus`, `addressToSealId`, `sealData`, `isValid`
- Used in `App.jsx` (homepage lookup), `ResultDisplay.jsx` (cross-chain badges), `StatusPage.jsx`, and `VendorDemo.jsx`
- Wallet connection uses `ethers.BrowserProvider(window.ethereum)` — MetaMask required

### Backend → Smart Contract
- `backend/src/services/blockchain.js` uses `ethers.JsonRpcProvider` (`ARBITRUM_SEPOLIA_RPC_URL`)
- Signed transactions via `new ethers.Wallet(OWNER_PRIVATE_KEY, provider)`
- Gas limits hardcoded: 500,000 for mint, 400,000 for revoke, 250,000 for upgradeTier
- Exports: `mintSeal`, `revokeSeal`, `getSealId`, `hasSeal`, `getSealInfo`

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
  uint256 expiresAt;       // 0 = no expiry
  bool revoked;
  string revocationReason;
  uint8 jurisdictionCode;  // ISO 3166-1 numeric, 0 = global
}

struct BurnRequest {
  uint256 requestedAt;
  bool pending;
}
```

### Key Functions
- `mint(address, Tier, bytes signature, uint256 expiresAt, uint8 jurisdictionCode)` — onlyOwner; validates ECDSA signature
- `revoke(uint256 sealId, string reason)` — onlyOwner
- `upgradeTier(uint256 sealId, Tier newTier, bytes newSignature)` — onlyOwner
- `adminBurn(uint256 sealId)` — onlyOwner; immediate burn for contract migrations; skips 90-day delay; cleans up all mappings
- `isValid(address, Tier minTier) view returns (bool)` — returns true only if seal is active, unrevoked, unexpired, and at or above minTier; primary integration point for vendor protocols
- `isExpired(address) view returns (bool)`
- `getVerificationStatus(address)` — returns (verified, tier, revoked, burnPending, burnExecutableAt)
- `setTierActive(Tier, bool)` — onlyOwner; gates which tiers can be minted
- `setTierMetadataURI(uint8 tier, string uri)` — onlyOwner; sets IPFS metadata URI for a tier
- `tokenURI(uint256 sealId) view returns (string)` — ERC721 metadata; returns tierMetadataURI for the seal's tier

### Key Constants
- **Burn delay:** 90 days (time-locked, user-initiated)
- **One seal per address** (enforced by `addressToSealId` mapping)
- **Soulbound:** transfer/safeTransfer overridden to revert

### Signature Scheme
`keccak256(abi.encodePacked(address, uint8 tier, uint8 jurisdictionCode, uint256 chainId))` — jurisdictionCode (ISO 3166-1 numeric, 0 = global) and chainId are included to prevent cross-chain replay attacks and jurisdiction spoofing. Arbitrum Sepolia = 421614, Polygon Amoy = 80002.

### Security
- `ReentrancyGuard` on all state-changing functions
- ECDSA `recoverSigner()` validates backend signature on mint
- `verifyOwnership(address, sealId)` prevents spoofing

---

## API Endpoints

### User-facing (`/api/kyc/`)
| Method | Path | Description |
|---|---|---|
| POST | `/api/kyc/send-otp` | Send SMS OTP to phone number via Twilio Verify (rate-limited) |
| POST | `/api/kyc/verify-otp` | Verify SMS OTP; returns signed phoneVerificationToken (rate-limited) |
| POST | `/api/kyc/submit` | Submit KYC application (rate-limited: 3/15min); requires phoneVerificationToken |
| GET | `/api/kyc/verify/:token` | Email verification magic link |
| GET | `/api/kyc/status/:address` | KYC submission status for address |
| GET | `/api/kyc/cross-chain-status/:address` | Cross-chain attestation status |

### Admin-facing (`/api/admin/`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/pending` | Submissions where status='pending' AND email_verified=true |
| GET | `/api/admin/ready-to-mint` | Approved submissions not yet fully minted+attested |
| GET | `/api/admin/revoked` | All submissions where status='revoked', enriched with seal data |
| GET | `/api/admin/seal/:address` | On-chain seal lookup by wallet address |
| GET | `/api/admin/polygon-status/:address` | Polygon attestation status |
| POST | `/api/admin/approve/:id` | Approve submission, generate ECDSA signature |
| POST | `/api/admin/reject/:id` | Reject submission with reason |
| POST | `/api/admin/mint` | Mint seal on Arbitrum Sepolia |
| POST | `/api/admin/revoke` | Revoke seal on-chain + set Supabase status to 'revoked' |
| POST | `/api/admin/attest/:id` | Attest seal on Polygon Amoy |
| POST | `/api/admin/reattest/:id` | Re-attest an existing seal on Polygon Amoy |
| POST | `/api/admin/upgrade` | Upgrade seal tier on-chain |
| GET | `/api/admin/pending-burns` | Seals with an active pending burn request |

> Admin routes require `x-admin-secret` header validated server-side against `ADMIN_SECRET` env var (Railway). Invalid or missing secret returns 401. Rate limited to 300 req/15min per IP.

### Health
| Method | Path |
|---|---|
| GET | `/health` |

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

### Tailwind Dynamic Classes
Tier colors use dynamic class names — kept in `tailwind.config.js` safelist:
`bg-{orange,gray,yellow,blue,purple}-100`, `text-{color}-{600,800}`

### State Management
- No Redux or Zustand — plain React `useState`/`useEffect`
- Backend state in Supabase
- On-chain state is source of truth for verification status (`StatusPage` always checks on-chain regardless of Supabase status)

### Database Schema (Supabase)
Tables: `users`, `kyc_submissions`, `seals`, `attestations`

---

## Development Commands

```bash
# Smart contracts
npx hardhat test
npx hardhat coverage
REPORT_GAS=true npx hardhat test
npx hardhat run scripts/deploy.js --network arbitrumSepolia
npx hardhat run scripts/deployAttestation.js --network amoy
npx hardhat run scripts/activateTiers.js --network arbitrumSepolia

# Contract migration (after redeploying — set OLD/NEW_CONTRACT_ADDRESS in .env first)
npx hardhat run scripts/repopulateSeals.js --network arbitrumSepolia

# IPFS metadata (run after redeployment to pin images + JSON and set URIs on-chain)
node scripts/uploadToIPFS.js
npx hardhat run scripts/setMetadataURIs.js --network arbitrumSepolia

# Backend
cd backend
npm run dev          # nodemon on port 3001

# Frontend
cd frontend
npm run dev          # vite on port 5173
npm run build
```

---

## Known Issues / Security Notes

1. **Admin auth is server-side** — `x-admin-secret` header checked against `ADMIN_SECRET` env var in Railway. Login is validated via a real API call; password never stored in the bundle.
2. **Testnet only** — not audited, not ready for mainnet or real personal data.
3. **Frontend contract address is hardcoded** in `utils/contract.js` (not in env).
4. **Mint confirmation email** — sent via Resend after successful mint; uses `RESEND_API_KEY` + `FRONTEND_URL` env vars. Fire-and-forget; never blocks the mint response.
5. **`activateTiers.js` points at old contract** — update `pactAddress` before running on the current deployment.
6. **Email domain validation** — `POST /api/kyc/submit` runs a format check then a domain check. Allowlist: Gmail, iCloud, Outlook, Hotmail, Live, Yahoo, Proton + any `.edu`/`.gov`. Blocklist: ~30 known disposable providers. Everything else (business domains) is allowed by default. Same logic mirrored client-side in `emailValidation.js` for immediate UX feedback.
