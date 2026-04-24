# TODO

## Immediate
- [ ] Delete unused files: `frontend/src/pages/GetVerified.jsx`, `frontend/src/assets/react.svg`, `ignition/modules/Lock.js`, `landing/` directory, `stealth/` directory
- [ ] Tiers IV and V seal images (currently "Coming Soon" placeholders in Docs, StatusPage, ResultDisplay)
- [ ] Update `activateTiers.js` to point at new contract address `0xBfCA5341f3c370743d4A64Df7c732113A4f83187`

## Short-term
- [ ] External security audit before any mainnet deployment
- [ ] JavaScript/TypeScript SDK for vendor protocol integrations
- [ ] Integration documentation (how vendors call `isValid()` on-chain)
- [ ] Move frontend contract address (`utils/contract.js`) to env var instead of hardcoded

## Medium-term (Q2–Q3 2026)
- [ ] Mainnet deployment (Arbitrum, Polygon, Base)
- [ ] Protocol partnership outreach and pilot agreements
- [ ] Bug bounty program

## Long-term
- [ ] Multi-sig verification support
- [ ] DAO governance for protocol decisions
- [ ] Decentralized verifier network
- [ ] Cross-chain messaging (CCIP or LayerZero)

## Deferred — Trust Tree Redesign

The trust tree feature is partially implemented on `feature/trust-tree` but the current contract design does not match the intended use case. A redesign is needed before this ships.

**Current contract design (wrong):**
- `linkWallet(child, childTier, rootSignature)` — child is forced to be one tier below parent
- Branching cap is `parentTier - 1` children per node (baked in as a constant)
- Produces a tier-degradation hierarchy (Gold → Silver → Bronze) that doesn't serve the intended purpose

**Intended design:**
- Users with a seal want to link their secondary/spending wallets without re-doing KYC for each
- All linked wallets should inherit the root's **full tier** — no degradation
- The cap should be a **per-tier limit set by the owner** (not hardcoded), so it can be adjusted without redeployment
- Suggested default caps: Bronze=2, Silver=5, Gold=10, Platinum=20, Diamond=50

**Contract changes required:**
- Remove `childTier` parameter from `linkWallet` — child inherits root tier automatically
- Remove the "child tier = parent tier − 1" constraint
- Add `mapping(uint8 => uint256) public maxLinkedWallets` with `setMaxLinkedWallets(tier, max)` onlyOwner
- Replace current branching cap with: `treeChildren[root].length < maxLinkedWallets[rootTier]`
- Update signature scheme to drop `childTier` from the signed payload
- Redeployment and re-issuance of existing seals required

**Frontend/backend changes required after contract update:**
- Remove tier picker from the link form in StatusPage
- Update the tree breakdown display to show flat cap instead of branching tree
- Update `handleLinkWallet` to drop `childTier` from the signature and contract call
- Update `record-link` backend to reflect new event shape
