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

## [Unreleased]

### Planned for v2.2
- External security audit
- JavaScript/TypeScript SDK
- Integration documentation for vendor protocols
- Bug bounty program
- Mainnet deployment (Ethereum, Polygon, Arbitrum, Base)
- Protocol partnerships

### Planned for v3.0
- Multi-sig verification
- DAO governance
- Decentralized verifier network
- Cross-chain messaging

---

## Version History

- **v2.1.0** (Current) - Landing page, docs, admin security, route restructure, repo cleanup
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