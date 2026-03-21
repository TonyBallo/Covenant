# v2 Summary - What Changed from v1

**Quick reference guide for developers migrating from v1 to v2**

---

## TL;DR

v2 adds **signature-based verification** and **time-locked burns** for security. Breaking changes in function signatures and data structures. Not a contract upgrade - it's a new deployment.

---

## Major Changes

### 1. Signature-Based Verification ✅

**What:** Every mint now requires Covenant's cryptographic signature

**Why:** Proves verification actually happened, prevents unauthorized minting

**Impact:**
```solidity
// v1
mint(address to, Tier tier, bytes32 dataHash)

// v2
mint(address to, Tier tier, bytes calldata covenantSignature)
```

**Migration:**
```javascript
// v1: Just call mint
await contract.mint(user, tier, hash);

// v2: Create signature first
const message = ethers.solidityPackedKeccak256(
    ["address", "uint8"],
    [user, tier]
);
const signature = await covenantKey.signMessage(ethers.getBytes(message));
await pact.mint(user, tier, signature);
```

---

### 2. Time-Locked Burns ✅

**What:** 90-day delay between burn request and execution

**Why:** Prevents "borrow → burn → disappear" fraud

**Impact:**
```solidity
// v1
burn(uint256 tokenId)

// v2 (3 functions)
requestBurn(uint256 sealId)
cancelBurnRequest(uint256 sealId)  
executeBurn(uint256 sealId)
```

**Migration:**
```javascript
// v1: Instant burn
await contract.burn(tokenId);

// v2: Time-locked
await pact.requestBurn(sealId);
// ... wait 90 days ...
await pact.executeBurn(sealId);

// Can cancel anytime
await pact.cancelBurnRequest(sealId);
```

---

### 3. Identity Hash Removal ✅

**What:** No more on-chain hash of identity data

**Why:** Privacy improvement, gas savings

**Impact:**
```solidity
// v1
struct TokenData {
    Tier tier;
    bytes32 dataHash;  // REMOVED
    uint256 mintedAt;
    bool revoked;
    string revocationReason;
}

// v2
struct SealData {
    Tier tier;
    bytes covenantSignature;  // ADDED INSTEAD
    uint256 mintedAt;
    bool revoked;
    string revocationReason;
}
```

---

### 4. Enhanced Verification Status ✅

**What:** Added burn pending info

**Impact:**
```solidity
// v1
function getVerificationStatus(address user) 
    returns (bool isVerified, Tier tier, bool isRevoked)

// v2
function getVerificationStatus(address user)
    returns (
        bool isVerified, 
        Tier tier, 
        bool isRevoked,
        bool burnPending,      // NEW
        uint256 burnExecutableAt  // NEW
    )
```

**Migration:**
```javascript
// v1
const [verified, tier, revoked] = await contract.getVerificationStatus(user);

// v2
const [verified, tier, revoked, burnPending, burnTime] = 
    await pact.getVerificationStatus(user);

// Check if burn is pending
if (burnPending) {
    console.log(`Seal will be deleted on ${new Date(burnTime * 1000)}`);
}
```

---

### 5. Ownership Verification ✅

**What:** New helper to prevent spoofing

**Why:** Users might claim someone else's seal

**New Function:**
```solidity
function verifyOwnership(address user, uint256 sealId) 
    external view returns (bool)
```

**Usage:**
```javascript
// Backend receives: { address: "0xUser", sealId: 5 }
const isValid = await pact.verifyOwnership(address, sealId);
if (!isValid) {
    throw new Error("User doesn't own this seal");
}
```

---

## Breaking Changes Summary

### Function Signatures Changed

| Function | v1 | v2 |
|----------|----|----|
| `mint()` | `(address, Tier, bytes32)` | `(address, Tier, bytes)` |
| `upgradeTier()` | `(uint256, Tier, bytes32)` | `(uint256, Tier, bytes)` |
| `getVerificationStatus()` | Returns 3 values | Returns 5 values |
| `burn()` | One function (immediate) | Three functions (time-locked) |

### Variable Names Changed

| v1 | v2 |
|----|----|
| `tokenId` | `sealId` |
| `tokenData` | `sealData` |
| `addressToTokenId` | `addressToSealId` |
| `_nextTokenId` | `_nextSealId` |

### Events Changed

| v1 | v2 | Change |
|----|-------|--------|
| `SBTMinted` | `SealMinted` | Removed `dataHash` param |
| `SBTRevoked` | `SealRevoked` | Renamed only |
| `SBTBurned` | `SealBurned` | Renamed only |
| - | `BurnRequested` | NEW |
| - | `BurnCancelled` | NEW |

### Contract/Token Names

| Item | v1 | v2 |
|------|----|----|
| Contract Name | `IdentitySBT` | `IdentityPact` |
| Token Name | "Identity SBT" | "Covenant Pact" |
| Symbol | "IDSBT" | "PACT" |

---

## What Stayed the Same

✅ Tier system (I → V)  
✅ Soulbound mechanics (transfers blocked)  
✅ Revocation system  
✅ One-way tier upgrades  
✅ Owner-controlled minting  
✅ Event logging  

---

## Security Improvements

### Added
- ✅ Signature verification (cryptographic proof)
- ✅ Time-locked burns (fraud prevention)
- ✅ Reentrancy protection (all functions)
- ✅ Ownership verification (spoofing prevention)

### Removed
- ✅ Identity hash from blockchain (privacy)
- ✅ Immediate burn escape route (accountability)

---

## Integration Checklist

**For protocols integrating v2:**

- [ ] Update mint calls to include signature
- [ ] Update upgradeTier calls to include signature
- [ ] Handle 5 return values from getVerificationStatus
- [ ] Check burnPending status in verification logic
- [ ] Implement ownership verification in backend
- [ ] Update event listeners (renamed events)
- [ ] Test time-locked burn flow
- [ ] Update variable names (tokenId → sealId)

---

## Code Examples

### Complete v1 → v2 Migration

**v1 Integration:**
```solidity
contract YourProtocol_v1 {
    IdentitySBT public sbt;
    
    function checkUser(address user) public view {
        (bool verified, Tier tier, bool revoked) = 
            sbt.getVerificationStatus(user);
        
        require(verified && !revoked, "Not verified");
        require(tier >= Tier.III, "Insufficient tier");
    }
}
```

**v2 Integration:**
```solidity
contract YourProtocol_v2 {
    IdentityPact public pact;
    
    function checkUser(address user) public view {
        (
            bool verified, 
            Tier tier, 
            bool revoked,
            bool burnPending,
            uint256 burnTime
        ) = pact.getVerificationStatus(user);
        
        require(verified && !revoked, "Not verified");
        require(!burnPending, "Burn pending");  // NEW CHECK
        require(tier >= Tier.III, "Insufficient tier");
    }
    
    // NEW: Verify ownership if user claims seal
    function verifyUserSeal(address user, uint256 sealId) public view {
        require(pact.verifyOwnership(user, sealId), "Invalid seal");
    }
}
```

---

## Testing Changes

### v1 Test Pattern
```javascript
// Mint
await contract.mint(user, tier, hash);

// Burn
await contract.burn(tokenId);

// Check status
const [verified, tier, revoked] = 
    await contract.getVerificationStatus(user);
```

### v2 Test Pattern
```javascript
// Helper function
async function createSignature(signer, userAddress, tier) {
    const message = ethers.solidityPackedKeccak256(
        ["address", "uint8"],
        [userAddress, tier]
    );
    return await signer.signMessage(ethers.getBytes(message));
}

// Mint
const signature = await createSignature(owner, user, tier);
await pact.mint(user, tier, signature);

// Burn (time-locked)
await pact.requestBurn(sealId);
await ethers.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
await ethers.provider.send("evm_mine");
await pact.executeBurn(sealId);

// Check status
const [verified, tier, revoked, burnPending, burnTime] = 
    await pact.getVerificationStatus(user);
```

---

## Deployment Considerations

### Not an Upgrade
- v2 is a **new deployment**, not an upgrade of v1
- Both contracts can coexist
- No migration of existing data
- Users keep v1 seals, get new v2 seals

### Deployment Steps
1. Deploy new v2 contract
2. Update frontend/backend to use new address
3. Update ABI (breaking changes)
4. Test integration thoroughly
5. Sunset v1 gradually (optional)

### Backward Compatibility
- None - v2 is incompatible with v1
- Protocols must choose: v1 OR v2
- Recommended: Migrate to v2 during testnet phase

---

## FAQ

**Q: Can I upgrade my v1 contract to v2?**  
A: No. v2 is a new deployment with breaking changes.

**Q: What happens to my v1 seal?**  
A: It stays on v1 contract. You'll get a new seal on v2.

**Q: Can users have both v1 and v2 seals?**  
A: Yes, they're separate contracts.

**Q: Why can't users burn immediately anymore?**  
A: 90-day delay prevents fraud ("borrow → burn → disappear").

**Q: Can I cancel a burn request?**  
A: Yes, anytime before the 90 days elapse.

**Q: Can revoked seals be burned?**  
A: No. Revoked seals stay on-chain as evidence.

**Q: Do I need to verify signatures off-chain?**  
A: No, the contract verifies them. You just need to create valid signatures when minting.

**Q: What if my signing key is compromised?**  
A: Rotate keys and deploy new contract (or implement key rotation in v3).

**Q: How much gas does v2 save vs v1?**  
A: ~20k gas per mint (removed hash storage).

---

## Resources

- **Full Changelog:** See CHANGELOG.md
- **Development Roadmap:** See ROADMAP.md
- **Integration Guide:** See docs/INTEGRATION.md (coming soon)
- **Test Suite:** See test/IdentityPact.test.js
- **Contract:** See contracts/IdentityPact.sol

---

## Quick Reference Card
```
╔══════════════════════════════════════════════════════════╗
║               v1 → v2 QUICK REFERENCE                    ║
╠══════════════════════════════════════════════════════════╣
║ Contract:    IdentitySBT → IdentityPact                  ║
║ Symbol:      IDSBT → PACT                                ║
║ Token:       SBT → Seal                                  ║
╠══════════════════════════════════════════════════════════╣
║ mint():      Now requires signature parameter            ║
║ burn():      Now 3 functions (request/cancel/execute)    ║
║ status():    Now returns 5 values (added burn info)      ║
║ NEW:         verifyOwnership() helper function           ║
╠══════════════════════════════════════════════════════════╣
║ Security:    + Signatures, + Time-locks, + Reentrancy   ║
║ Privacy:     - Identity hash (off-chain only)            ║
║ Tests:       24 → 41 tests                               ║
║ Coverage:    100% statements, 82% branches               ║
╚══════════════════════════════════════════════════════════╝
```

---

*Last Updated: February 2026*
*For v2.0.0 release*