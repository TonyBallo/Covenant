# Changelog

All notable changes to Project Covenant will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-02-02

### 🎉 Major Release - Production Security Hardening

This release represents a complete security overhaul with breaking changes from v1. All production features implemented and fully tested. Ready for security audit.

### Added

#### Signature-Based Verification
- **cryptographic proof of verification** - Every seal mint now includes Covenant's signature
- `recoverSigner()` internal function for ECDSA signature verification
- Two-factor authentication for minting (owner wallet + signing key)
- Prevents unauthorized minting even if owner wallet is compromised
- Foundation for future multi-sig verification

#### Time-Locked Burn System
- **90-day delay between burn request and execution**
- `requestBurn(uint256 sealId)` - User initiates burn with countdown
- `cancelBurnRequest(uint256 sealId)` - User can change mind before execution
- `executeBurn(uint256 sealId)` - Final burn after delay period
- `BurnRequested` event with executable timestamp
- `BurnCancelled` event
- Protection: Revoked seals cannot be burned (evidence preservation)
- `getVerificationStatus()` now returns burn pending status and executable timestamp

#### Ownership Verification
- `verifyOwnership(address user, uint256 sealId)` - Prevents spoofing attacks
- Off-chain systems can verify user actually owns claimed seal
- Returns false for non-existent, burned, or mismatched seals

#### Security Hardening
- **ReentrancyGuard** on all state-changing functions:
  - `mint()`
  - `upgradeTier()`
  - `requestBurn()`
  - `cancelBurnRequest()`
  - `executeBurn()`
- Protection against reentrancy attacks during callbacks

#### Testing & Quality
- **41 comprehensive tests** covering all functionality
- **100% statement coverage**
- **100% function coverage**
- **100% line coverage**
- **82% branch coverage**
- Solidity coverage reporting integrated
- Gas usage optimization

#### Branding
- Contract renamed: `IdentitySBT` → `IdentityPact`
- Token name: "Identity SBT" → "Covenant Pact"
- Symbol: "IDSBT" → "PACT"
- Terminology: SBT → Seal (users receive a "seal" from making a "pact")
- All events, variables, and documentation updated

### Changed

#### Breaking Changes

**Function Signatures:**
```solidity
// OLD (v1)
function mint(address to, Tier tier, bytes32 dataHash)

// NEW (v2)
function mint(address to, Tier tier, bytes calldata covenantSignature)
```
```solidity
// OLD (v1)
function upgradeTier(uint256 tokenId, Tier newTier, bytes32 newDataHash)

// NEW (v2)
function upgradeTier(uint256 sealId, Tier newTier, bytes calldata newSignature)
```
```solidity
// OLD (v1)
function getVerificationStatus(address user) 
    returns (bool isVerified, Tier tier, bool isRevoked)

// NEW (v2)
function getVerificationStatus(address user)
    returns (
        bool isVerified, 
        Tier tier, 
        bool isRevoked,
        bool burnPending,
        uint256 burnExecutableAt
    )
```

**Data Structures:**
```solidity
// REMOVED from SealData
bytes32 dataHash;

// ADDED to SealData
bytes covenantSignature;

// NEW struct
struct BurnRequest {
    uint256 requestedAt;
    bool pending;
}
```

**Variable Names:**
- `tokenId` → `sealId` (all functions)
- `tokenData` → `sealData` (mapping)
- `addressToTokenId` → `addressToSealId` (mapping)
- `_nextTokenId` → `_nextSealId` (counter)

**Events:**
- `SBTMinted` → `SealMinted` (removed `dataHash` parameter)
- `SBTRevoked` → `SealRevoked`
- `SBTBurned` → `SealBurned`
- New: `BurnRequested(uint256 sealId, address owner, uint256 executableAt)`
- New: `BurnCancelled(uint256 sealId, address owner)`

### Removed

- **Immediate burn functionality** - Replaced with time-locked system
- `burn(uint256 tokenId)` function removed
- `dataHash` from seal storage (privacy improvement)
- Identity hash from minting process (no longer needed)

### Security

#### Vulnerabilities Fixed
- **Immediate accountability escape** - Time-locked burns prevent users from instantly erasing verification
- **Unauthorized minting** - Signature verification prevents minting without cryptographic proof
- **Reentrancy attacks** - Full protection on all state-changing functions
- **Seal spoofing** - Ownership verification prevents users claiming others' seals

#### Privacy Improvements
- **Zero on-chain PII** - Removed last remnant (identity hash) from blockchain
- Perfect separation: verification status on-chain, identity data off-chain
- Gas optimization: ~20k gas saved per mint by removing hash storage

### Technical Details

#### Gas Optimizations
- Removed 32-byte hash storage: ~20,000 gas saved per mint
- Efficient signature verification: ~3,000 gas per verification
- Optimized burn request storage

#### Contract Size
- v2 contract size: Within deployment limits
- No external dependencies beyond OpenZeppelin

#### Compatibility
- Solidity: ^0.8.20
- OpenZeppelin: ^5.4.0
- Hardhat: ^2.28.3
- ethers.js: ^6.x

---

## [1.0.0] - 2026-01-29

### 🚀 Initial Release - Proof of Concept

First working implementation deployed to Sepolia testnet.

### Added

#### Core Functionality
- Soulbound NFT implementation (non-transferable)
- Tiered verification system (5 tiers: I → V)
- Owner-controlled minting
- Tier upgrade capability (one-way only)
- Revocation system with reason tracking
- Immediate user burn (opt-out mechanism)

#### Smart Contract Features
- `mint(address, Tier, bytes32)` - Create new verification seal
- `revoke(uint256, string)` - Revoke seal with reason
- `upgradeTier(uint256, Tier, bytes32)` - Increase verification tier
- `burn(uint256)` - User can delete own seal
- `getVerificationStatus(address)` - Check user verification
- Soulbound enforcement (transfers blocked)

#### Events
- `SBTMinted` - New seal created
- `SBTRevoked` - Seal revoked
- `TierUpgraded` - Tier increased
- `SBTBurned` - Seal deleted

#### Testing
- 24 initial tests
- Basic functionality coverage
- Deployment scripts
- Hardhat configuration

### Deployment
- **Network:** Sepolia Testnet
- **Address:** `0x2E47219B0910dc76233cdAb56aDDaa8d196c030A`
- **Status:** Active for testing and validation

### Known Limitations
- No cryptographic verification proof
- Immediate burn allows accountability escape
- No reentrancy protection
- Identity hash stored on-chain (unnecessary)
- Single-chain deployment only
- No ownership verification helper

### Documentation
- README with basic usage
- Initial ROADMAP
- Deployment instructions

---

## [2.1.0] - 2026-03-21

### Added

#### Landing Page & Route Structure
- New marketing landing page at `/` (`Landing.jsx` + `Landing.css`) — full-screen, scroll-locked, animated word cycling
- Demo app moved to `/demo` prefix — landing and demo now share the same domain
- `DemoLayout` wrapper component in `App.jsx` provides navbar + `<Outlet />` for all `/demo/*` routes
- "Try Demo" button on landing page navigates to `/demo` without full page reload

#### Documentation Page
- `/demo/docs` page (`Docs.jsx`) with full tier breakdown, seal images, and integration code examples
- Tier seal images (`public/tiers/tier-1.png` through `tier-3.png`) integrated directly into tier cards
- Tiers IV and V display "Coming Soon" placeholders
- Tier rank labels (e.g., "Tier I — Bronze") added to each card

#### Admin Security
- Server-side admin authentication — `x-admin-secret` header validated against `ADMIN_SECRET` env var (Railway)
- Admin login now validated via real API call; 401 response shown as "Invalid password"
- Admin secret stored in module-level singleton (`setAdminSecret()`), never embedded in the JS bundle
- Admin session persisted in `sessionStorage` (cleared on tab close, more secure than `localStorage`)
- Removed hardcoded password and login hint text from `Admin.jsx`

#### Multi-Chain Signature Scheme
- Signature now binds to `jurisdictionCode` (ISO 3166-1 numeric, 0 = global) in addition to `chainId`
- Prevents cross-jurisdiction signature replay
- `SealData` struct updated with `jurisdictionCode` field
- Both `Pact.sol` and `PactWitness.sol` reconstruct the same hash for `ecrecover`

### Changed

#### Repository Structure
- `covenant-backend/` renamed to `backend/`
- `covenant-lookup/` renamed to `frontend/`
- `v2.SUMMARY.md` renamed to `V2_SUMMARY.md`; `v2_changes.md` renamed to `V2_CHANGES.md`

#### CORS & Backend
- Added `x-admin-secret` to CORS `allowedHeaders`
- Added `https://covenantprotocol.io` and `https://www.covenantprotocol.io` as explicit CORS origins (custom domain — not matched by `.vercel.app` regex)
- Added `http://localhost:5174` to CORS origins for updated dev server port

#### Frontend Routes
- All demo routes prefixed with `/demo` (`/demo/status`, `/demo/admin`, `/demo/docs`, etc.)
- Email verification redirects updated to `/demo/verify-success` and `/demo/verify-failed`
- Navbar logo links to `/demo` instead of `/`

### Fixed
- Admin panel login failing in production due to CORS preflight blocking `x-admin-secret` header
- Admin panel login failing on `www.covenantprotocol.io` (custom domain excluded from `.vercel.app` regex)

---

## [2.2.0] - 2026-03-28

### Added

#### NFT Metadata (ERC721 tokenURI)
- `mapping(uint8 => string) public tierMetadataURI` — per-tier IPFS metadata URI storage
- `setTierMetadataURI(uint8 tier, string uri) external onlyOwner` — admin setter
- `tokenURI(uint256 sealId) public view override` — returns tier metadata URI for any seal
- Tier 1–3 metadata pinned to IPFS via Pinata; images and JSON hosted at stable CIDs

#### Contract Migration Tooling
- `adminBurn(uint256 sealId) external onlyOwner nonReentrant` — immediate burn for owner-initiated migrations; cleans up `addressToSealId`, `sealData`, `burnRequests`, emits `SealBurned`
- `scripts/uploadToIPFS.js` — uploads tier PNG images then patches and uploads metadata JSON to Pinata using Node 22 native `fetch`/`FormData`
- `scripts/setMetadataURIs.js` — calls `setTierMetadataURI` on a deployed contract for all active tiers

#### Contract Redeployment
- New Pact contract deployed: `0xBfCA5341f3c370743d4A64Df7c732113A4f83187` (Mar-28-2026)
- 13 existing seals migrated from old contract via `repopulateSeals.js`; tier and jurisdictionCode preserved per-seal
- Tier metadata URIs set on-chain post-migration

#### Mint Ceremony UX
- `MintCeremony.jsx` — full-screen page shown once immediately after a seal is minted; fires `wallet_watchAsset` (ERC721) to prompt MetaMask NFT import; deduplicates via `sessionStorage`
- Route registered outside `DemoLayout` so it renders without the navbar

#### Mint Confirmation Email
- Resend integration in `backend/src/routes/admin.js` — dark-themed HTML email sent after successful mint containing tier badge, seal ID, issued/expiry dates, "View Your Seal" and Arbiscan links
- Fire-and-forget; never blocks the mint response

#### Seal Images in UI
- `StatusPage.jsx` — tier PNG shown full-width above seal details; `wallet_watchAsset` "Add Seal to Wallet" button; auto-redirects to ceremony on first post-mint visit
- `ResultDisplay.jsx` — redesigned to match StatusPage card layout; full-width seal image, tier row, attribute grid; coming-soon placeholder for tiers 4–5
- All 5 tier quick-test buttons on homepage lookup (`SearchBar.jsx`)

### Fixed
- Admin panel 429 errors — rate limit raised from 20 to 300 requests per 15 minutes (each panel load fires 3+ parallel requests plus per-submission Polygon status checks)
- `Docs.jsx` hardcoded old contract address updated to new deployment

---

## [2.3.0] - 2026-04-25

### Added

#### User-Initiated Burn Flow
- Full 90-day burn lifecycle surfaced in `StatusPage.jsx` — request, countdown, cancel, and execute
- `requestBurn`, `cancelBurnRequest`, `executeBurn` added to frontend contract ABI
- Collapsible "Seal Deletion" section with 4 states: idle, confirm-request, pending-countdown, confirm-execute
- Live countdown via `formatBurnCountdown()` helper in `constants.js`
- Burn actions require wallet connection and network switch to Arbitrum Sepolia
- Hidden for revoked seals (contract blocks `requestBurn` on revoked seals)

#### Admin "Seals Burning" Tab
- New tab in admin panel driven entirely by on-chain `BurnRequested` / `BurnCancelled` / `SealBurned` events
- Public Arbitrum Sepolia RPC used for event log queries (Alchemy free tier caps `eth_getLogs` at 10 blocks)
- `DEPLOY_BLOCK = 250_000_000` set as lower bound to avoid full chain scans
- Shows live countdown per seal; read-only retention monitoring tool — no admin action buttons
- `GET /api/admin/pending-burns` endpoint returns active burn requests

#### Tier Upgrade Application Flow
- **User path:** "Apply for Tier Upgrade →" button on `StatusPage` for active, non-revoked, non-expired seals with tier < 5
- **TierSelect upgrade mode:** reads `location.state.upgrade`; shows "Upgrade Your Seal" heading, labels current tier, marks lower tiers as "Already Surpassed", filters apply button to eligible tiers only
- **ApplyForm upgrade mode:** Tier N→M arrow banner, "Submit Upgrade Request" button, "holds your existing seal" wallet label, upgrade-specific success copy
- **Backend:** `POST /api/kyc/submit` detects upgrade applications via on-chain `getSealInfo`; allows `tier_requested > current_tier` when address already holds a seal; rejects revoked seals
- **Admin Pending tab:** upgrade submissions display a blue "Upgrade" pill and "Tier N → Tier M" annotation; both pending and ready-to-mint tabs enriched with `isUpgradeRequest` and `currentTier` from on-chain state
- **Admin Ready-to-Mint tab:** upgrade submissions show "Execute Upgrade on Arbitrum" button (blue) instead of "Mint Seal"; calls `POST /api/admin/upgrade` with `submissionId`; marks submission as `minted` in Supabase on success
- `POST /api/admin/upgrade` now accepts optional `submissionId` to close the submission loop

#### SealData Fields Surfaced
- **`jurisdictionCode`** — shown in `StatusPage` and `ResultDisplay` data grids as `🌐 Global` or country flag + name; admin mint form has jurisdiction picker defaulting to Global; `JURISDICTIONS` map (18 ISO 3166-1 numeric codes) and `formatJurisdiction()` helper added to `constants.js`; `sealData` ABI updated to include 7th return field `uint8 jurisdictionCode` in both frontend and backend
- **`covenantSignature`** — collapsible "Covenant Signature" section with copy button in both `StatusPage` and `ResultDisplay`; describes the ECDSA bytes stored on-chain at mint time; hidden if empty or `0x`

#### VendorDemo Denial Specificity
- `VendorDemo.jsx` now detects the specific denial reason (`no_seal`, `wrong_tier`, `expired`, `revoked`) after `isValid()` returns false
- Each reason renders distinct copy explaining why access was denied

### Fixed
- **Lookup tool address normalization** — `handleSearch` now normalizes any valid hex address to its EIP-55 checksummed form via `ethers.getAddress()` before contract calls; wrong-case addresses (e.g. copied from wallets with different casing) are accepted rather than rejected; truly invalid input (non-hex, wrong length) still surfaces a clear error message
- **Lookup error messages** — broadened `catch` patterns to correctly classify address validation errors (`invalid address`, `bad address`, `invalid BytesLike`)
- **Admin upgrade flow** — `ready-to-mint` endpoint previously dropped upgrade submissions because `sealId > 0` falsely indicated the seal was already minted; now detects upgrade requests and tracks `isUpgraded` separately from `isMinted`

---

## [Unreleased]

### Planned for v2.4
- External security audit
- JavaScript/TypeScript SDK
- Integration documentation for vendor protocols
- Bug bounty program
- Mainnet deployment (Ethereum, Polygon, Arbitrum, Base)
- Protocol partnerships
- Expired seal renewal workflow

### Planned for v3.0
- Multi-sig verification
- DAO governance
- Decentralized verifier network
- Cross-chain messaging

---

## Version History

- **v2.3.0** (Current) - Burn flow UI, tier upgrade flow, jurisdictionCode + covenantSignature surfaced, lookup normalization
- **v2.2.0** - NFT metadata, mint ceremony, contract redeployment, seal images in UI
- **v2.1.0** - Landing page, docs, admin security, route restructure, repo cleanup
- **v2.0.0** - Production security hardening, breaking changes
- **v1.0.0** - Initial proof of concept

---

## Migration Guide

### From v1 to v2

**Not a Contract Upgrade:**
v2 is a new deployment, not an upgrade of v1. Both contracts can coexist.

**For Integrating Protocols:**

1. **Update function calls:**
```javascript
// OLD (v1)
await contract.mint(user, tier, hash);

// NEW (v2)
const signature = await createSignature(user, tier);
await pact.mint(user, tier, signature);
```

2. **Update verification checks:**
```javascript
// OLD (v1)
const [verified, tier, revoked] = await contract.getVerificationStatus(user);

// NEW (v2)
const [verified, tier, revoked, burnPending, burnTime] = 
    await pact.getVerificationStatus(user);

// Add burn pending check
if (burnPending) {
    // User has requested burn, treat as pending deletion
}
```

3. **Add ownership verification:**
```javascript
// NEW in v2
const isValid = await pact.verifyOwnership(user, sealId);
if (!isValid) {
    throw new Error("User does not own claimed seal");
}
```

4. **Handle time-locked burns:**
```javascript
// Users can no longer instantly burn
// Protocol has 90-day warning before seal deletion

const [,,,burnPending, executableAt] = await pact.getVerificationStatus(user);
if (burnPending) {
    const daysRemaining = (executableAt - Date.now()) / 86400;
    console.log(`Burn in ${daysRemaining} days`);
}
```

**For Users:**

1. **Burning seals:**
```javascript
// OLD (v1) - Immediate
await contract.burn(sealId);

// NEW (v2) - Time-locked
await pact.requestBurn(sealId);
// Wait 90 days
await pact.executeBurn(sealId);

// Can cancel anytime before execution
await pact.cancelBurnRequest(sealId);
```

2. **Check seal status:**
```javascript
const [verified, tier, revoked, burnPending, burnTime] = 
    await pact.getVerificationStatus(yourAddress);

if (burnPending) {
    console.log(`Burn executable at: ${new Date(burnTime * 1000)}`);
}
```

---

## Notes

### Semantic Versioning

**MAJOR.MINOR.PATCH**

- **MAJOR:** Breaking changes (v1 → v2)
- **MINOR:** New features, no breaking changes
- **PATCH:** Bug fixes, no breaking changes

### Release Cadence

- Major releases: When significant features/breaking changes ready
- Minor releases: As new features completed
- Patch releases: As bugs fixed

### Deprecation Policy

- Features marked deprecated 1 version before removal
- Breaking changes documented in CHANGELOG
- Migration guides provided

---

*Last Updated: March 2026*