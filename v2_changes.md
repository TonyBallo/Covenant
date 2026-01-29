# Project Covenant v2.0 - Major Changes

## Overview

Version 2.0 is a security and privacy hardening before mainnet deployment. All changes address vulnerabilities identified in v1 security analysis.

---

## Critical Changes

### 1. Signature-Based Verification

**What Changed:**
- v1: Stored only tier + data hash
- v2: Stores tier + Covenant's cryptographic signature

**Why:**
- Proves Covenant actually verified the user
- Prevents unauthorized minting
- Enables future decentralization

**Code Change:**
```solidity
// v1
struct TokenData {
    Tier tier;
    bytes32 dataHash;  // REMOVED
}

// v2
struct TokenData {
    Tier tier;
    bytes covenantSignature;  // NEW
}
```

---

### 2. Identity Hash Removal

**What Changed:**
- v1: Stored `bytes32 dataHash` on-chain
- v2: No identity hash on-chain

**Why:**
- Hash created attack surface (brute force risk)
- Unnecessary - address already links data
- Saves ~20k gas per mint (33% reduction)
- Perfect privacy: zero PII on blockchain

**Security Impact:**
- v1: Theoretical attack on identity hash
- v2: Nothing to attack - only public data on-chain

---

### 3. Time-Locked Burn

**What Changed:**
- v1: `burn()` immediately deletes SBT
- v2: `requestBurn()` → 90 days → `executeBurn()`

**Why:**
- Prevents fraud escape (borrow → burn → disappear)
- Protocols get warning to react
- Users can still opt-out (privacy preserved)

**New Functions:**
```solidity
function requestBurn(uint256 tokenId)
function cancelBurnRequest(uint256 tokenId)
function executeBurn(uint256 tokenId)
```

---

### 4. Reentrancy Protection

**What Changed:**
- Added OpenZeppelin ReentrancyGuard
- `nonReentrant` on mint() and burn()

**Why:**
- Prevents callback attacks during minting

---

### 5. Ownership Verification Helper

**What Changed:**
- Added `verifyOwnership(address, uint256)` function

**Why:**
- Prevents impersonation in off-chain systems
- Explicit API for ownership validation

---

## Breaking Changes

### Function Signatures
```solidity
// CHANGED: mint()
// v1
function mint(address to, Tier tier, bytes32 dataHash)
// v2
function mint(address to, Tier tier, bytes calldata signature)

// CHANGED: getVerificationStatus()
// v1 returns (bool, Tier, bool)
// v2 returns (bool, Tier, bool, bool, uint256)
//            verified, tier, revoked, burnPending, burnExecutableAt
```

### Events
```solidity
// CHANGED: SBTMinted
// v1
event SBTMinted(..., bytes32 dataHash);
// v2  
event SBTMinted(...);  // No dataHash

// NEW
event BurnRequested(uint256 indexed tokenId, address indexed owner, uint256 executableAt);
event BurnCanceled(uint256 indexed tokenId, address indexed owner);
```

---

## Gas Savings

| Operation | v1 | v2 | Savings |
|-----------|----|----|---------|
| Mint | ~60k | ~40k | 33% |
| Upgrade | ~50k | ~30k | 40% |

---

## Multi-Chain Strategy

**v2 launches on:**
- Ethereum Mainnet
- Polygon
- Arbitrum
- Base

**How it works:**
- Same wallet address on all chains
- Backend mints on all chains simultaneously
- Each chain is independent (no bridging needed)

---

## Migration from v1

**For Users:**
1. Burn v1 SBT on testnet
2. Request v2 verification (mainnet)
3. Get multi-chain SBTs

**For Protocols:**
1. Update to new `getVerificationStatus()` signature
2. Add burn monitoring
3. Use `verifyOwnership()` for off-chain validation

---

## Timeline
```
Week 1-2:  Development
Week 3:    Testnet deployment
Week 5-8:  Security audit
Week 9-10: Fix findings
Week 12:   Mainnet launch
```

**Target: Q2 2026**

---

*Last Updated: January 2026*