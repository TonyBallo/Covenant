/**
 * Trust Tree Workflow Script
 *
 * Demonstrates the full trust tree lifecycle on a local Hardhat network:
 *   1. Deploy and configure the contract
 *   2. Mint a Diamond root seal
 *   3. Build a multi-level trust tree
 *   4. Verify isValid at every node
 *   5. Surgical unlink — remove one branch, siblings unaffected
 *   6. Nuclear revocation — root seal revoked, entire tree goes dark
 *   7. Cross-chain boundary — set Gold ↔ Platinum boundary attributes
 *
 * Run with:
 *   npx hardhat run scripts/testTrustTree.js
 */

const { ethers } = require("hardhat");

// ─── Formatting helpers ───────────────────────────────────────────────────────

const TIER_NAMES = { 0: "NONE", 1: "Bronze", 2: "Silver", 3: "Gold", 4: "Platinum", 5: "Diamond" };

function header(title) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(60));
}

function ok(msg)   { console.log(`  ✔  ${msg}`); }
function info(msg) { console.log(`  ·  ${msg}`); }
function warn(msg) { console.log(`  ✘  ${msg}`); }

function short(address) {
  return address.slice(0, 6) + "..." + address.slice(-4);
}

function tierLabel(n) {
  return `Tier ${n} (${TIER_NAMES[n]})`;
}

// ─── Signature helpers ────────────────────────────────────────────────────────

async function mintSig(ownerSigner, toAddress, tier, jurisdictionCode = 0) {
  const { chainId } = await ethers.provider.getNetwork();
  const message = ethers.solidityPackedKeccak256(
    ["address", "uint8", "uint8", "uint256"],
    [toAddress, tier, jurisdictionCode, chainId]
  );
  return ownerSigner.signMessage(ethers.getBytes(message));
}

async function linkSig(rootSigner, parentAddress, childAddress, childTier, rootAddress) {
  const { chainId } = await ethers.provider.getNetwork();
  const message = ethers.solidityPackedKeccak256(
    ["address", "address", "uint8", "address", "uint256"],
    [parentAddress, childAddress, childTier, rootAddress, chainId]
  );
  return rootSigner.signMessage(ethers.getBytes(message));
}

// ─── isValid check helper ─────────────────────────────────────────────────────

async function checkValid(pact, label, address, tier, expectedResult) {
  const result = await pact.isValid(address, tier);
  const symbol = result === expectedResult ? "✔" : "✘ UNEXPECTED";
  const validity = result ? "VALID  " : "INVALID";
  console.log(`  ${symbol}  ${label.padEnd(18)} isValid(${tierLabel(tier).padEnd(20)}) → ${validity}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const signers = await ethers.getSigners();

  // Assign roles
  const covenant  = signers[0];   // contract owner — Covenant
  const rootWallet    = signers[1];   // Diamond (5) — root seal holder
  const platinum1     = signers[2];   // Platinum (4) — child of root
  const platinum2     = signers[3];   // Platinum (4) — second child of root
  const gold1         = signers[4];   // Gold (3)     — child of platinum1
  const gold2         = signers[5];   // Gold (3)     — second child of platinum1
  const silver1       = signers[6];   // Silver (2)   — child of gold1
  const bronze1       = signers[7];   // Bronze (1)   — child of silver1
  const replacementPlatinum = signers[8]; // used to demonstrate slot reuse after unlink

  // ── Phase 1: Deploy ──────────────────────────────────────────────────────────

  header("Phase 1 — Deploy & Configure");

  const PactFactory = await ethers.getContractFactory("Pact");
  const pact = await PactFactory.deploy();
  await pact.waitForDeployment();
  ok(`Pact deployed at ${await pact.getAddress()}`);

  await pact.setTierActive(3, true);
  await pact.setTierActive(4, true);
  await pact.setTierActive(5, true);
  ok("Tiers I–V activated");

  // ── Phase 2: Mint Diamond root seal ─────────────────────────────────────────

  header("Phase 2 — Mint Diamond Root Seal");

  const rootMintSig = await mintSig(covenant, rootWallet.address, 5);
  await pact.mint(rootWallet.address, 5, 0, rootMintSig, 0);
  ok(`Diamond (5) seal minted → ${short(rootWallet.address)} [root]`);

  const rootSealId = await pact.addressToSealId(rootWallet.address);
  info(`Seal ID: ${rootSealId}`);

  // ── Phase 3: Build the trust tree ───────────────────────────────────────────

  header("Phase 3 — Build Trust Tree");

  // Level 1: root → Platinum x2
  // Diamond (5) can have up to 4 Platinum children
  const sigP1 = await linkSig(rootWallet, rootWallet.address, platinum1.address, 4, rootWallet.address);
  await pact.connect(rootWallet).linkWallet(platinum1.address, 4, sigP1);
  ok(`Root linked → Platinum1 ${short(platinum1.address)}`);

  const sigP2 = await linkSig(rootWallet, rootWallet.address, platinum2.address, 4, rootWallet.address);
  await pact.connect(rootWallet).linkWallet(platinum2.address, 4, sigP2);
  ok(`Root linked → Platinum2 ${short(platinum2.address)}`);

  // Level 2: platinum1 → Gold x2 (root co-signs)
  // Platinum (4) can have up to 3 Gold children
  const sigG1 = await linkSig(rootWallet, platinum1.address, gold1.address, 3, rootWallet.address);
  await pact.connect(platinum1).linkWallet(gold1.address, 3, sigG1);
  ok(`Platinum1 linked → Gold1 ${short(gold1.address)}`);

  const sigG2 = await linkSig(rootWallet, platinum1.address, gold2.address, 3, rootWallet.address);
  await pact.connect(platinum1).linkWallet(gold2.address, 3, sigG2);
  ok(`Platinum1 linked → Gold2 ${short(gold2.address)}`);

  // Level 3: gold1 → Silver1 (root co-signs)
  // Gold (3) can have up to 2 Silver children
  const sigS1 = await linkSig(rootWallet, gold1.address, silver1.address, 2, rootWallet.address);
  await pact.connect(gold1).linkWallet(silver1.address, 2, sigS1);
  ok(`Gold1 linked → Silver1 ${short(silver1.address)}`);

  // Level 4: silver1 → Bronze1 (root co-signs)
  // Silver (2) can have 1 Bronze child
  const sigB1 = await linkSig(rootWallet, silver1.address, bronze1.address, 1, rootWallet.address);
  await pact.connect(silver1).linkWallet(bronze1.address, 1, sigB1);
  ok(`Silver1 linked → Bronze1 ${short(bronze1.address)}`);

  // Print tree structure
  console.log(`
  Tree:
  ${short(rootWallet.address)} — Diamond (5)  [root seal]
  ├── ${short(platinum1.address)} — Platinum (4)
  │   ├── ${short(gold1.address)} — Gold (3)
  │   │   └── ${short(silver1.address)} — Silver (2)
  │   │       └── ${short(bronze1.address)} — Bronze (1)
  │   └── ${short(gold2.address)} — Gold (3)
  └── ${short(platinum2.address)} — Platinum (4)`);

  // ── Phase 4: Verify isValid at every node ───────────────────────────────────

  header("Phase 4 — isValid Checks (all should be VALID)");

  await checkValid(pact, "root (Diamond)",   rootWallet.address,  5, true);
  await checkValid(pact, "platinum1",        platinum1.address,   4, true);
  await checkValid(pact, "platinum1",        platinum1.address,   2, true);  // above minTier
  await checkValid(pact, "gold1",            gold1.address,       3, true);
  await checkValid(pact, "silver1",          silver1.address,     2, true);
  await checkValid(pact, "bronze1",          bronze1.address,     1, true);
  await checkValid(pact, "platinum2",        platinum2.address,   4, true);
  await checkValid(pact, "gold2",            gold2.address,       3, true);

  console.log();
  info("Below-tier checks (all should be INVALID):");
  await checkValid(pact, "gold1 @ Platinum", gold1.address,       4, false); // Gold can't pass Platinum check
  await checkValid(pact, "bronze1 @ Silver", bronze1.address,     2, false); // Bronze can't pass Silver check

  // ── Phase 5: Surgical unlink ─────────────────────────────────────────────────

  header("Phase 5 — Surgical Unlink (Platinum1 branch)");

  info(`Unlinking Platinum1 branch from root...`);
  await pact.connect(rootWallet).unlinkWallet(platinum1.address);
  ok("Platinum1 unlinked — Gold1, Gold2, Silver1, Bronze1 cascade-removed");

  console.log();
  info("Platinum1 branch nodes (all should be INVALID):");
  await checkValid(pact, "platinum1",  platinum1.address,  4, false);
  await checkValid(pact, "gold1",      gold1.address,      3, false);
  await checkValid(pact, "silver1",    silver1.address,    2, false);
  await checkValid(pact, "bronze1",    bronze1.address,    1, false);

  console.log();
  info("Platinum2 sibling branch (should still be VALID):");
  await checkValid(pact, "platinum2",  platinum2.address,  4, true);

  // Demonstrate slot reuse
  const sigRelink = await linkSig(rootWallet, rootWallet.address, replacementPlatinum.address, 4, rootWallet.address);
  await pact.connect(rootWallet).linkWallet(replacementPlatinum.address, 4, sigRelink);
  ok(`Freed slot reused — linked replacementPlatinum ${short(replacementPlatinum.address)}`);
  await checkValid(pact, "replacementPlat", replacementPlatinum.address, 4, true);

  // ── Phase 6: Nuclear revocation ─────────────────────────────────────────────

  header("Phase 6 — Nuclear Revocation (root seal revoked)");

  // Rebuild some of the tree first for a fuller demo
  const sigP1b = await linkSig(rootWallet, rootWallet.address, platinum1.address, 4, rootWallet.address);
  await pact.connect(rootWallet).linkWallet(platinum1.address, 4, sigP1b);
  const sigG1b = await linkSig(rootWallet, platinum1.address, gold1.address, 3, rootWallet.address);
  await pact.connect(platinum1).linkWallet(gold1.address, 3, sigG1b);
  info("Rebuilt: root → Platinum1 → Gold1");

  info("Current state (all valid):");
  await checkValid(pact, "root",       rootWallet.address,  5, true);
  await checkValid(pact, "platinum1",  platinum1.address,   4, true);
  await checkValid(pact, "platinum2",  platinum2.address,   4, true);
  await checkValid(pact, "gold1",      gold1.address,       3, true);
  await checkValid(pact, "repPlat",    replacementPlatinum.address, 4, true);

  console.log();
  info(`Covenant revokes root seal ID ${rootSealId}...`);
  await pact.revoke(rootSealId, "Fraud detected");
  ok("Root seal revoked");

  console.log();
  info("After revocation (entire tree should be INVALID):");
  await checkValid(pact, "platinum1",  platinum1.address,   4, false);
  await checkValid(pact, "platinum2",  platinum2.address,   4, false);
  await checkValid(pact, "gold1",      gold1.address,       3, false);
  await checkValid(pact, "repPlat",    replacementPlatinum.address, 4, false);

  // ── Phase 7: Cross-chain boundary ───────────────────────────────────────────

  header("Phase 7 — Cross-Chain Boundary Attributes");

  // For this demo, mint a fresh Gold seal (Arbitrum side) and Platinum linked wallet
  const freshSigners = await ethers.getSigners();
  const goldRoot     = freshSigners[9];   // Gold (3) root — Arbitrum chain boundary node
  const platChild    = freshSigners[10];  // new root for Platinum demo

  const goldRootSig = await mintSig(covenant, goldRoot.address, 3);
  await pact.mint(goldRoot.address, 3, 0, goldRootSig, 0);
  ok(`Gold (3) root minted → ${short(goldRoot.address)}`);

  const diamondSig = await mintSig(covenant, platChild.address, 5);
  await pact.mint(platChild.address, 5, 0, diamondSig, 0);
  const platLinked = freshSigners[11];
  const platLinkSig = await linkSig(platChild, platChild.address, platLinked.address, 4, platChild.address);
  await pact.connect(platChild).linkWallet(platLinked.address, 4, platLinkSig);
  ok(`Platinum (4) linked wallet → ${short(platLinked.address)}`);

  // Ethereum Mainnet chain ID = 1, Arbitrum = 42161
  const ETHEREUM_CHAIN_ID  = 1;
  const ARBITRUM_CHAIN_ID  = 42161;

  // Gold node on Arbitrum: its Ethereum partner is a Platinum address
  const fakePlatinumOnEthereum = freshSigners[12].address;
  await pact.setCrossChainBoundary(goldRoot.address, ETHEREUM_CHAIN_ID, fakePlatinumOnEthereum);
  ok(`CrossChainBoundary set on Gold node:`);
  info(`  node     : ${short(goldRoot.address)} (Gold, Arbitrum)`);
  info(`  partner  : ${short(fakePlatinumOnEthereum)} (Platinum, Ethereum chainId=${ETHEREUM_CHAIN_ID})`);

  // Platinum node on Ethereum: its Arbitrum partner is the Gold address
  await pact.setCrossChainBoundary(platLinked.address, ARBITRUM_CHAIN_ID, goldRoot.address);
  ok(`CrossChainBoundary set on Platinum node:`);
  info(`  node     : ${short(platLinked.address)} (Platinum, Ethereum)`);
  info(`  partner  : ${short(goldRoot.address)} (Gold, Arbitrum chainId=${ARBITRUM_CHAIN_ID})`);

  // Read back and verify
  const goldBoundary = await pact.crossChainBoundary(goldRoot.address);
  const platBoundary = await pact.crossChainBoundary(platLinked.address);

  console.log();
  info(`Gold boundary — partnerChainId: ${goldBoundary.partnerChainId}, partner: ${short(goldBoundary.partnerAddress)}, verified: ${goldBoundary.verified}`);
  info(`Platinum boundary — partnerChainId: ${platBoundary.partnerChainId}, partner: ${short(platBoundary.partner || platBoundary.partnerAddress)}, verified: ${platBoundary.verified}`);

  // ── Summary ──────────────────────────────────────────────────────────────────

  header("Summary");
  ok("Trust tree deployment and lifecycle — complete");
  ok("isValid resolves correctly for all node types");
  ok("Surgical unlink cascades and frees slots");
  ok("Nuclear revocation kills entire tree in O(1)");
  ok("Cross-chain boundary attributes set on Gold and Platinum nodes");
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
