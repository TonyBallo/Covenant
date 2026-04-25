# TODO

## Immediate
- [ ] Delete unused files: `frontend/src/pages/GetVerified.jsx`, `frontend/src/assets/react.svg`, `ignition/modules/Lock.js`, `landing/` directory, `stealth/` directory
- [ ] Tiers IV and V seal images (currently "Coming Soon" placeholders in Docs, StatusPage, ResultDisplay)
- [ ] Update `activateTiers.js` to point at new contract address `0xBfCA5341f3c370743d4A64Df7c732113A4f83187`

## Short-term
- [ ] **Expired seal renewal workflow** — Currently blocked. An expired user receives correct UI feedback (amber expired state on StatusPage, VendorDemo, and public lookup) but there is no path for them to resubmit for re-verification. The `ApplyForm` rejects addresses that already have a Supabase record, and the contract's `mint()` rejects addresses that already hold a seal token. Full renewal requires: (1) user-initiated burn of the expired seal on-chain, (2) Supabase record reset or a new `renewal` flow that bypasses the duplicate-submission guard, and (3) admin re-approval and remint with a fresh `expiresAt`. Until this is built, expired users should be directed to contact support.
- [ ] External security audit before any mainnet deployment (v2.4)
- [ ] JavaScript/TypeScript SDK for vendor protocol integrations (v2.4)
- [ ] Integration documentation (how vendors call `isValid()` on-chain)
- [ ] Move frontend contract address (`utils/contract.js`) to env var instead of hardcoded
- [ ] Tiers II–V upgrade paths — ApplyForm and backend currently only process Tier I KYC data; higher tier upgrades need expanded data collection forms

## Medium-term (Q2–Q3 2026)
- [ ] Mainnet deployment (Arbitrum, Polygon, Base)
- [ ] Protocol partnership outreach and pilot agreements
- [ ] Bug bounty program

## Long-term
- [ ] Multi-sig verification support
- [ ] DAO governance for protocol decisions
- [ ] Decentralized verifier network
- [ ] Cross-chain messaging (CCIP or LayerZero)
