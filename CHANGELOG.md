# Changelog

## [Unreleased - v2.0]

### Added
- Signature-based verification (cryptographic proof)
- Time-locked burn system (90-day delay)
- `requestBurn()`, `cancelBurnRequest()`, `executeBurn()` functions
- Burn pending status in verification queries
- `verifyOwnership()` helper function
- ReentrancyGuard protection
- Multi-chain deployment strategy

### Changed
- `getVerificationStatus()` now returns 5 values (added burn status)
- `mint()` now requires Covenant signature instead of data hash
- `upgradeTier()` now requires new signature
- `burn()` replaced with time-locked burn flow

### Removed
- Identity hash from TokenData struct (privacy/gas optimization)
- Immediate burn capability (replaced with time-lock)

### Security
- Prevents immediate accountability escape via burn
- Cryptographic proof of verification
- Reentrancy protection
- 90-day window for fraud investigation
- Zero PII attack surface on blockchain

### Performance
- ~33% gas reduction on mints
- ~40% gas reduction on tier upgrades

---

## [1.0.0] - 2026-01-25

### Added
- Initial soulbound NFT implementation
- Tiered verification system (BRONZE, SILVER, GOLD, PLATINUM)
- Owner-controlled minting and revocation
- One-way tier upgrades
- User-controlled burn function
- Comprehensive event logging
- ERC-721 compliance with transfer blocks

### Deployed
- Sepolia testnet: 0x2E47219B0910dc76233cdAb56aDDaa8d196c030A

### Known Issues
- Immediate burn allows accountability escape (fixed in v2)
- No reentrancy protection (fixed in v2)
- Identity hash on-chain (removed in v2)