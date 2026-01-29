# Project Covenant - Development Roadmap

**Current Phase:** Stealth Mode - Customer Validation

---

## Development Philosophy

**Validate before scaling:**
- Build in private during customer development
- Get 3-5 pilot protocols committed
- Open source after traction OR transition
- Mainnet launch when ready to go public

---

## v1.0 - Proof of Concept ✅ (COMPLETE)
**Status:** Deployed to Sepolia Testnet  
**Address:** 0x2E47219B0910dc76233cdAb56aDDaa8d196c030A  
**Phase:** Customer validation

### Features
- Soulbound NFT with tiered verification (BRONZE → PLATINUM)
- Owner-controlled minting and revocation
- Tier upgrades (one-way, no downgrades)
- Non-transferable (true soulbound)
- User can burn their SBT (immediate deletion)
- Event logging for all state changes

### Known Limitations
- Immediate burn allows accountability escape
- No reentrancy protection
- No cryptographic proof of verification
- Single-chain only (Ethereum testnet)
- Identity hash stored on-chain (unnecessary attack surface)

### Current Focus
- Protocol outreach and demos
- Customer feedback collection
- Feature validation
- Market fit assessment

---

## v2.0 - Production Security Hardening 🔨 (Q2 2026)
**Target:** Mainnet Launch  
**Focus:** Security, Privacy, Multi-Chain

### Major Features

#### 1. Signature-Based Verification
**Problem:** No cryptographic proof Covenant verified the user  
**Solution:** Store Covenant's signature proving verification

**Benefits:**
- Cryptographic proof (not just owner's word)
- Prevents unauthorized minting
- Enables future decentralization
- Better security model

#### 2. Identity Hash Removal
**Problem:** Hash on-chain creates attack surface and costs gas  
**Solution:** Remove hash completely, link via address only

**Benefits:**
- Zero PII attack surface on blockchain
- Perfect on-chain/off-chain separation
- 33% gas savings (~20k gas per mint)
- Simpler design

#### 3. Time-Locked Burn System
**Problem:** Users can immediately burn SBT to escape accountability  
**Solution:** 90-day waiting period between request and execution

**Implementation:**
- `requestBurn()` - Start 90-day clock
- `cancelBurnRequest()` - Change of mind
- `executeBurn()` - Delete after delay

**Benefits:**
- Protocols get 90-day warning
- Time to settle obligations
- Users can still opt-out
- Fraud prevention

#### 4. Reentrancy Protection
**Problem:** Potential reentrancy during mint/burn callbacks  
**Solution:** OpenZeppelin ReentrancyGuard

#### 5. Ownership Verification Helper
**Problem:** Off-chain systems might trust user-provided token IDs  
**Solution:** `verifyOwnership(address, tokenId)` function

#### 6. Multi-Chain Deployment
**Launch Chains:**
- Ethereum Mainnet
- Polygon
- Arbitrum
- Base

**Strategy:** Same address on all chains, backend syncs state

---

## v2.1 - Ecosystem Expansion (Q3 2026)
**Focus:** Adoption and tooling

### Features
- Additional L2 deployments (Optimism, zkSync)
- JavaScript/TypeScript SDK
- Analytics dashboard
- Batch verification tools
- Enhanced protocol integration examples

---

## v3.0 - Decentralization (2027)
**Focus:** Remove single points of failure

### Potential Features
- Multi-sig verification (3-of-5 verifiers)
- DAO governance for revocations
- Decentralized KYC verification network
- Cross-chain messaging (LayerZero/Chainlink)

---

## Security Audits
- [ ] Internal review (Q1 2026)
- [ ] External audit - Trail of Bits or OpenZeppelin (Q2 2026)
- [ ] Bug bounty program (Q3 2026)
- [ ] Mainnet deployment (Q4 2026)

---

## Go-Public Strategy

**Open source timing (when ANY of these conditions met):**
1. ✅ 3+ paying pilot protocols committed
2. ✅ $500k+ capital raised
3. ✅ Can publicly claim background/credentials
4. ✅ Mainnet launch imminent

**Until then:** Private repo, stealth customer development

---

## Timeline Summary
```
2026 Q1: Stealth validation (3-5 pilots)
2026 Q2: v2 development + audit
2026 Q3: Capital raise OR transition
2026 Q4: Public launch (open source)
2027:    v3 decentralization
```

---

## Budget Estimates

**v2 Development:**
- Security Audit: $30k-50k
- Legal Review: $10k-15k
- Multi-chain Deployment: $5k
- **Total:** $45k-70k

**Funding Strategy:**
- Protocol partnerships (pre-paid pilots)
- Angel/seed round ($500k-1M)
- Grants (Ethereum Foundation, L2 ecosystems)

---

## Success Metrics

**v1 Validation Success:**
- 3+ protocols interested in pilots
- Clear product-market fit
- Positive feedback on approach
- Understanding of customer needs

**v2 Launch Criteria:**
- Zero critical vulnerabilities in audit
- 5+ protocols integrated
- 100+ users verified
- 3-month incident-free testnet period
- Legal/compliance review complete

**Go-Public Criteria:**
- Customer traction OR funding OR background clearance
- Production-ready code
- Competitive moat established

---

*Last Updated: January 2026*