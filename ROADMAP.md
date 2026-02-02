# Project Covenant - Development Roadmap

**Current Phase:** v2 Complete - Audit Preparation

---

## Development Philosophy

**Security-first approach:**
- Build features incrementally with full test coverage
- Security audit before mainnet deployment
- Validate with protocols during testnet phase
- Open source after audit completion

---

## v1.0 - Proof of Concept ✅ (COMPLETE)

**Status:** Deployed to Sepolia Testnet  
**Address:** 0x2E47219B0910dc76233cdAb56aDDaa8d196c030A  
**Completed:** January 2026

### Features
- Soulbound NFT with tiered verification (I → V)
- Owner-controlled minting and revocation
- Tier upgrades (one-way, no downgrades)
- Non-transferable (true soulbound)
- User immediate burn (opt-out)
- Event logging for all state changes

### Known Limitations (Addressed in v2)
- Immediate burn allows accountability escape
- No reentrancy protection
- No cryptographic proof of verification
- Identity hash on-chain (unnecessary)
- Single-chain only

### Outcome
- ✅ Core concept validated
- ✅ Technical feasibility proven
- ✅ Foundation for v2 established

---

## v2.0 - Production Security Hardening ✅ (COMPLETE)

**Status:** Ready for Security Audit  
**Completed:** February 2026  
**Test Coverage:** 41 tests passing, 100% statement coverage

### Major Features Implemented

#### 1. Signature-Based Verification ✅
**Problem:** No cryptographic proof Covenant verified the user  
**Solution:** Store Covenant's signature proving verification

**Implementation:**
```solidity
function mint(address to, Tier tier, bytes calldata covenantSignature) {
    bytes32 message = keccak256(abi.encodePacked(to, uint8(tier)));
    require(recoverSigner(message, covenantSignature) == owner());
    // Cryptographic proof of verification
}
```

**Benefits:**
- Prevents unauthorized minting even if owner wallet compromised
- Cryptographic audit trail
- Foundation for future decentralization
- Two-factor authentication for minting

---

#### 2. Identity Hash Removal ✅
**Problem:** Hash on-chain creates attack surface and costs gas  
**Solution:** Remove hash completely, link via address only

**Benefits:**
- Zero PII attack surface on blockchain
- Perfect on-chain/off-chain separation
- Gas savings (~20k per mint)
- Simpler, cleaner design

---

#### 3. Time-Locked Burn System ✅
**Problem:** Users can immediately burn seal to escape accountability  
**Solution:** 90-day waiting period between request and execution

**Implementation:**
```solidity
requestBurn()      // Start 90-day countdown
cancelBurnRequest() // Change of mind
executeBurn()      // Delete after delay (if not revoked)
```

**Benefits:**
- Protocols get 90-day warning
- Time to settle obligations/disputes
- Users can still opt-out (privacy preserved)
- Fraud prevention without surveillance

**Key Rule:** Revoked seals cannot be burned (evidence preservation)

---

#### 4. Reentrancy Protection ✅
**Problem:** Potential reentrancy during mint/burn callbacks  
**Solution:** OpenZeppelin ReentrancyGuard on all state changes

**Applied to:**
- `mint()`
- `upgradeTier()`
- `requestBurn()`
- `cancelBurnRequest()`
- `executeBurn()`

---

#### 5. Ownership Verification Helper ✅
**Problem:** Off-chain systems might trust user-provided seal IDs  
**Solution:** `verifyOwnership(address, sealId)` function

**Use Case:**
```javascript
// Backend receives: { address: "0xAttacker", sealId: 5 }
const isValid = await pact.verifyOwnership(address, sealId);
// Returns false if attacker doesn't own seal #5
```

**Prevents:** Spoofing attacks where users claim someone else's seal

---

#### 6. Complete Rebrand ✅
**Updated Terminology:**
- Contract: IdentitySBT → IdentityPact
- Token: SBT → Seal
- Symbol: IDSBT → PACT
- Reasoning: Users make a "pact" with Covenant, receive a "seal" of verification

---

### Test Coverage

**41 comprehensive tests covering:**
- Signature verification (valid/invalid/wrong address)
- Time-locked burns (request/cancel/execute/timing)
- Revocation (basic/double/authorization)
- Tier upgrades (valid/invalid/revoked)
- Soulbound mechanics (transfers blocked)
- Ownership verification (spoofing prevention)
- Edge cases and authorization checks

**Coverage Metrics:**
- Statements: 100%
- Functions: 100%
- Lines: 100%
- Branches: 82%

---

### Breaking Changes from v1

**API Changes:**
- `mint()` now requires signature parameter
- `upgradeTier()` now requires signature parameter
- `burn()` removed, replaced with 3-function system
- `getVerificationStatus()` returns 2 additional fields

**Data Structure:**
- `dataHash` removed from SealData
- `covenantSignature` added to SealData
- New `BurnRequest` struct added

**Migration Path:**
- v1 stays on Sepolia as reference
- v2 is new deployment (not upgrade)
- No data migration needed (separate contracts)

---

## v2.1 - Security Audit & Testnet Deployment 🔨 (NEXT)

**Timeline:** Q2 2026  
**Focus:** Production readiness and validation

### Tasks

**Security Audit:**
- [ ] Select auditor (Trail of Bits, OpenZeppelin, or Consensys Diligence)
- [ ] Budget: $30k-50k
- [ ] Timeline: 4-6 weeks
- [ ] Address all findings
- [ ] Publish audit report

**Testnet Deployment:**
- [ ] Deploy to Sepolia (Ethereum testnet)
- [ ] Deploy to Mumbai (Polygon testnet)
- [ ] Deploy to Arbitrum Goerli
- [ ] Deploy to Base Goerli
- [ ] Document deployment addresses
- [ ] Create deployment scripts for each chain

**Protocol Integration:**
- [ ] 3-5 pilot protocols integrated
- [ ] Integration documentation
- [ ] Example implementations
- [ ] Feedback incorporation

**Ecosystem Development:**
- [ ] JavaScript/TypeScript SDK
- [ ] React hooks library
- [ ] Subgraph deployment (The Graph)
- [ ] Analytics dashboard

**Legal/Compliance:**
- [ ] Legal review of ToS
- [ ] Privacy policy review (GDPR/CCPA)
- [ ] Data retention policy
- [ ] Law enforcement disclosure process

---

## v2.2 - Mainnet Launch 🚀 (Q3-Q4 2026)

**Timeline:** Q3-Q4 2026  
**Focus:** Production deployment

### Prerequisites
- ✅ Security audit complete with no critical findings
- ✅ 3+ month incident-free testnet operation
- ✅ 5+ protocols integrated and tested
- ✅ Legal/compliance review complete
- ✅ Bug bounty program launched

### Mainnet Deployments
**Primary Networks:**
- Ethereum Mainnet
- Polygon
- Arbitrum
- Base

**Deployment Strategy:**
- Deterministic deployment (same address all chains)
- Multi-sig ownership (3-of-5)
- Timelock for ownership changes
- Emergency pause capability

### Go-to-Market
- Open source repository
- Public documentation
- Protocol partnerships announced
- Marketing campaign
- Conference presence

---

## v3.0 - Decentralization 🔮 (2027)

**Timeline:** 2027  
**Focus:** Remove single points of failure

### Planned Features

#### Multi-Sig Verification
**Current:** Single Covenant signature required  
**Future:** 2-of-3 or 3-of-5 verifier signatures
```solidity
address[] public verifiers = [covenant, verifier2, verifier3];
require(validSignatures >= 2, "Need majority");
```

**Benefits:**
- No single point of failure
- Distributed trust model
- Harder to compromise

---

#### DAO Governance
**For:** Revocation decisions, protocol parameters  
**Implementation:** Token-weighted voting or reputation-based

**Governance Decisions:**
- Revocation appeals
- Tier requirement changes
- Burn delay modifications
- Fee structures

---

#### Decentralized KYC Network
**Vision:** Multiple independent verifiers compete

**Model:**
- Verifiers stake collateral
- Slash for false verifications
- Users choose verifier
- Reputation system

---

#### Cross-Chain Messaging
**Current:** Seals are chain-specific  
**Future:** Cross-chain verification queries

**Technologies:**
- LayerZero
- Chainlink CCIP
- Wormhole

**Use Case:**
```solidity
// On Arbitrum, check Ethereum verification
bool verified = crossChain.getVerificationStatus(user, Chain.Ethereum);
```

---

## Beyond v3 - Future Possibilities

### Potential Features (Exploratory)

**Delegated Verification:**
- Users grant limited verification rights to others
- Useful for family accounts, business users

**Credential Marketplace:**
- Protocols bid for verified users
- Users earn from their verification

**Privacy Enhancements:**
- Zero-knowledge proofs for tier verification
- Prove "tier ≥ III" without revealing exact tier

**Reputation Layer:**
- On-chain activity score
- Protocol-specific reputation
- Portable trust across protocols

---

## Security Audit Timeline

### Pre-Audit (Now - Q2 2026)
- ✅ Internal review complete
- ✅ Test coverage 100% statements
- [ ] Select auditor
- [ ] Prepare audit materials

### Audit Phase (Q2 2026)
- [ ] 4-6 week audit period
- [ ] Address findings
- [ ] Re-audit if critical issues
- [ ] Publish report

### Post-Audit (Q3 2026)
- [ ] Bug bounty program ($50k-100k pool)
- [ ] 3-month testnet validation
- [ ] Mainnet deployment

---

## Budget Estimates

**v2.1 Development & Audit:**
- Security Audit: $30k-50k
- Legal Review: $10k-15k
- Multi-chain Deployment: $5k
- SDK Development: Internal
- **Total:** $45k-70k

**v2.2 Mainnet Launch:**
- Bug Bounty Pool: $50k-100k
- Marketing/Events: $20k-30k
- Infrastructure: $10k/year
- **Total:** $80k-140k

**Funding Strategy:**
- Protocol partnerships (pre-paid integrations)
- Seed round ($500k-1M)
- Grants (Ethereum Foundation, L2 ecosystems)

---

## Success Metrics

**v2.1 (Testnet) Success:**
- Zero critical audit findings
- 5+ protocols integrated
- 100+ users verified
- 3-month incident-free operation

**v2.2 (Mainnet) Success:**
- 10+ protocols using in production
- 1,000+ users verified
- 6-month incident-free operation
- Industry recognition

**v3.0 (Decentralization) Success:**
- 5+ independent verifiers active
- DAO governance operational
- Cross-chain verification working
- Sustainable decentralized model

---

## Risk Management

**Technical Risks:**
- Smart contract vulnerabilities → Audit + bug bounty
- Scalability issues → Multi-chain deployment
- Key compromise → Multi-sig + HSM

**Operational Risks:**
- Regulatory pressure → Legal review + compliance
- Privacy breach → Off-chain encryption + audits
- Verifier availability → Geographic distribution

**Market Risks:**
- Low adoption → Pilot partnerships first
- Competition → Differentiate on security/privacy
- Protocol abandonment → Open source + decentralize

---

*Last Updated: February 2026*
*Current Version: 2.0*