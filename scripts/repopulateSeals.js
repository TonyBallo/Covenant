/**
 * repopulateSeals.js
 *
 * Migrates all seal state from an old Pact contract to a freshly deployed one.
 * Run this after redeploying the contract to restore holder state.
 *
 * Usage:
 *   npx hardhat run scripts/repopulateSeals.js --network arbitrumSepolia
 *
 * Required env vars (root .env):
 *   OLD_CONTRACT_ADDRESS     — the contract being migrated FROM
 *   NEW_CONTRACT_ADDRESS     — the freshly deployed contract to migrate TO
 *   ARBITRUM_SEPOLIA_RPC_URL — RPC used to read from the old contract
 *   ARBITRUM_SEPOLIA_PRIVATE_KEY — must be the owner of the NEW contract
 *
 * Optional env vars:
 *   MIGRATE_FROM_BLOCK       — earliest block to scan for events (default: 0)
 *                              Set this to the old contract's deployment block
 *                              to speed up the scan significantly.
 *   INCLUDE_REVOKED          — set to "true" to re-mint AND re-revoke seals
 *                              that were revoked on the old contract.
 *                              Default: false (revoked seals are skipped).
 *
 * Flags:
 *   Pass --dry-run as the last argument to preview all actions without
 *   writing any transactions.
 *   e.g. npx hardhat run scripts/repopulateSeals.js --network arbitrumSepolia -- --dry-run
 */

const hre = require("hardhat");
const { ethers } = require("hardhat");

// ─── ABI ──────────────────────────────────────────────────────────────────────
// Minimal ABI for reading state from the old contract.
const OLD_CONTRACT_ABI = [
  "event SealMinted(address indexed to, uint256 indexed sealId, uint8 tier)",
  "event SealRevoked(uint256 indexed sealId, address indexed owner, string reason)",
  "function sealData(uint256 sealId) view returns (uint8 tier, bytes covenantSignature, uint256 mintedAt, uint256 expiresAt, bool revoked, string revocationReason)",
  "function addressToSealId(address user) view returns (uint256)",
];

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  // ─── Config ───────────────────────────────────────────────────────────────
  const OLD_ADDRESS = process.env.OLD_CONTRACT_ADDRESS;
  const NEW_ADDRESS = process.env.NEW_CONTRACT_ADDRESS;
  const FROM_BLOCK  = parseInt(process.env.MIGRATE_FROM_BLOCK || "0", 10);
  const INCLUDE_REVOKED = process.env.INCLUDE_REVOKED === "true";

  if (!OLD_ADDRESS) throw new Error("OLD_CONTRACT_ADDRESS is not set in .env");
  if (!NEW_ADDRESS) throw new Error("NEW_CONTRACT_ADDRESS is not set in .env");

  // ─── Connections ──────────────────────────────────────────────────────────
  const [owner] = await ethers.getSigners();
  const { chainId } = await ethers.provider.getNetwork();

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Covenant Seal Migration");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Network      : ${hre.network.name} (chainId ${chainId})`);
  console.log(`  Owner wallet : ${owner.address}`);
  console.log(`  Old contract : ${OLD_ADDRESS}`);
  console.log(`  New contract : ${NEW_ADDRESS}`);
  console.log(`  Scan from    : block ${FROM_BLOCK}`);
  console.log(`  Incl. revoked: ${INCLUDE_REVOKED}`);
  console.log(`  Dry run      : ${isDryRun}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // Read-only provider pointed at the old contract.
  // Uses the same RPC as the Hardhat network config but instantiated
  // separately so we can query historical state without a signer.
  const readProvider = new ethers.JsonRpcProvider(
    process.env.ARBITRUM_SEPOLIA_RPC_URL || hre.network.config.url
  );
  const oldContract = new ethers.Contract(OLD_ADDRESS, OLD_CONTRACT_ABI, readProvider);

  // New contract — needs a signer (owner) for write calls.
  const newContract = await ethers.getContractAt("Pact", NEW_ADDRESS, owner);

  // Confirm the signer is the owner of the new contract.
  const contractOwner = await newContract.owner();
  if (contractOwner.toLowerCase() !== owner.address.toLowerCase()) {
    throw new Error(
      `Signer ${owner.address} is not the owner of the new contract (owner: ${contractOwner}). ` +
      `Check ARBITRUM_SEPOLIA_PRIVATE_KEY.`
    );
  }

  // ─── Step 1: Read all events from the old contract ────────────────────────
  console.log("📖 Reading SealMinted events from old contract…");
  const mintFilter   = oldContract.filters.SealMinted();
  const revokeFilter = oldContract.filters.SealRevoked();

  const [mintEvents, revokeEvents] = await Promise.all([
    oldContract.queryFilter(mintFilter,   FROM_BLOCK, "latest"),
    oldContract.queryFilter(revokeFilter, FROM_BLOCK, "latest"),
  ]);

  console.log(`   Found ${mintEvents.length} mint event(s) and ${revokeEvents.length} revoke event(s)\n`);

  if (mintEvents.length === 0) {
    console.log("Nothing to migrate. Exiting.");
    return;
  }

  // Build a map of sealId → revocation reason for quick lookup.
  // A seal could be revoked more than once (shouldn't happen, but be safe).
  const revokedMap = new Map(); // sealId (string) => reason (string)
  for (const ev of revokeEvents) {
    revokedMap.set(ev.args.sealId.toString(), ev.args.reason);
  }

  // ─── Step 2: Collect unique tiers and activate them on the new contract ───
  const tiersNeeded = new Set();
  for (const ev of mintEvents) {
    tiersNeeded.add(Number(ev.args.tier));
  }

  console.log(`🔓 Activating tiers on new contract: [${[...tiersNeeded].join(", ")}]`);
  for (const tier of tiersNeeded) {
    if (tier === 0) continue; // NONE is not a real tier
    const isActive = await newContract.tierActive(tier);
    if (!isActive) {
      if (isDryRun) {
        console.log(`   [dry-run] Would activate tier ${tier}`);
      } else {
        const tx = await newContract.setTierActive(tier, true);
        await tx.wait();
        console.log(`   ✅ Tier ${tier} activated`);
      }
    } else {
      console.log(`   ✓  Tier ${tier} already active`);
    }
  }
  console.log();

  // ─── Step 3: Migrate seals ────────────────────────────────────────────────
  const tierNames = ["", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  let minted = 0, revoked = 0, skipped = 0, failed = 0;

  console.log(`⛓️  Migrating ${mintEvents.length} seal(s)…\n`);

  for (let i = 0; i < mintEvents.length; i++) {
    const ev      = mintEvents[i];
    const to      = ev.args.to;
    const sealId  = ev.args.sealId.toString();
    const tierNum = Number(ev.args.tier);
    const label   = `[${i + 1}/${mintEvents.length}] ${tierNames[tierNum] || `Tier ${tierNum}`} — ${to}`;

    const isRevoked = revokedMap.has(sealId);

    // Skip revoked seals unless explicitly requested.
    if (isRevoked && !INCLUDE_REVOKED) {
      console.log(`   ⏭️  ${label}`);
      console.log(`       Revoked on old contract — skipping (set INCLUDE_REVOKED=true to migrate)`);
      skipped++;
      continue;
    }

    try {
      // Check if this address already has a seal on the new contract.
      const existingId = await newContract.addressToSealId(to);
      if (Number(existingId) > 0) {
        console.log(`   ⏭️  ${label}`);
        console.log(`       Already minted on new contract (seal #${existingId})`);
        skipped++;
        continue;
      }

      // Fetch original seal data so we can preserve expiresAt.
      const data = await oldContract.sealData(sealId);
      const expiresAt = Number(data.expiresAt);

      // Generate a fresh signature for the new contract / chain.
      // Jurisdiction defaults to 0 (global) — the old contract didn't track it.
      const jurisdictionCode = 0;
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint8", "uint8", "uint256"],
        [to, tierNum, jurisdictionCode, chainId]
      );
      const signature = await owner.signMessage(ethers.getBytes(messageHash));

      if (isDryRun) {
        console.log(`   ✅ [dry-run] Would mint ${label}`);
        if (expiresAt > 0) {
          console.log(`       expiresAt: ${new Date(expiresAt * 1000).toISOString()}`);
        }
        if (isRevoked) {
          console.log(`       Then revoke: "${revokedMap.get(sealId)}"`);
        }
        minted++;
        if (isRevoked) revoked++;
        continue;
      }

      // Mint on the new contract.
      const mintTx = await newContract.mint(to, tierNum, jurisdictionCode, signature, expiresAt, {
        gasLimit: 300000,
      });
      const mintReceipt = await mintTx.wait();
      const newSealId = await newContract.addressToSealId(to);

      console.log(`   ✅ ${label}`);
      console.log(`       New seal #${newSealId} — tx: ${mintReceipt.hash}`);
      minted++;

      // If this seal was revoked on the old contract, revoke it on the new one too.
      if (isRevoked) {
        const reason = revokedMap.get(sealId);
        const revokeTx = await newContract.revoke(Number(newSealId), reason, {
          gasLimit: 200000,
        });
        await revokeTx.wait();
        console.log(`       🚫 Revoked: "${reason}"`);
        revoked++;
      }

    } catch (err) {
      console.error(`   ❌ ${label}`);
      console.error(`       ${err.message}`);
      failed++;
    }
  }

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  Migration complete" + (isDryRun ? " (dry run — no transactions sent)" : ""));
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`  Minted  : ${minted}`);
  console.log(`  Revoked : ${revoked}`);
  console.log(`  Skipped : ${skipped}`);
  console.log(`  Failed  : ${failed}`);
  console.log("═══════════════════════════════════════════════════════════");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
