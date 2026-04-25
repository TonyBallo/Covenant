/**
 * uploadToIPFS.js
 *
 * Uploads Covenant Seal images and metadata to IPFS via Pinata.
 * Run from the project root after adding your Pinata credentials to .env.
 *
 * Usage:
 *   node scripts/uploadToIPFS.js
 *
 * Required env vars (root .env):
 *   PINATA_API_KEY    — Pinata API key
 *   PINATA_SECRET     — Pinata API secret
 *
 * Input:
 *   frontend/public/tiers/tier-{1,2,3}.png   — seal images
 *   scripts/ipfs/tier-{1,2,3}.json           — metadata templates
 *
 * Output:
 *   Prints IPFS URIs for all six uploaded files.
 *   Updates scripts/ipfs/tier-{1,2,3}.json with real image hashes in-place.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET  = process.env.PINATA_SECRET;
const PINATA_URL     = "https://api.pinata.cloud/pinning/pinFileToIPFS";

if (!PINATA_API_KEY || !PINATA_SECRET) {
  console.error("❌  PINATA_API_KEY and PINATA_SECRET must be set in .env");
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function pinFile(filePath, name) {
  const form = new FormData();
  const buffer = fs.readFileSync(filePath);
  form.append("file", new Blob([buffer]), name);
  form.append("pinataMetadata", JSON.stringify({ name }));

  const res = await fetch(PINATA_URL, {
    method: "POST",
    headers: {
      pinata_api_key:        PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata upload failed for "${name}": ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.IpfsHash;
}

async function pinJSON(obj, name) {
  const buffer = Buffer.from(JSON.stringify(obj, null, 2));
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "application/json" }), name);
  form.append("pinataMetadata", JSON.stringify({ name }));

  const res = await fetch(PINATA_URL, {
    method: "POST",
    headers: {
      pinata_api_key:        PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET,
    },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata upload failed for "${name}": ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.IpfsHash;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const tiers = [1, 2, 3, 4, 5];
  const results = [];

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Covenant IPFS Upload");
  console.log("═══════════════════════════════════════════════════════════\n");

  for (const tier of tiers) {
    const imagePath    = path.join(ROOT, "frontend", "public", "tiers", `tier-${tier}.png`);
    const metaPath     = path.join(ROOT, "scripts", "ipfs", `tier-${tier}.json`);

    // ── Upload image ──────────────────────────────────────────────────────────
    console.log(`📤 [Tier ${tier}] Uploading image…`);
    const imageHash = await pinFile(imagePath, `covenant-seal-tier-${tier}.png`);
    const imageURI  = `ipfs://${imageHash}`;
    console.log(`   ✅ Image: ${imageURI}`);

    // ── Patch metadata with real image URI ───────────────────────────────────
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    meta.image = imageURI;
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");

    // ── Upload metadata ───────────────────────────────────────────────────────
    console.log(`📤 [Tier ${tier}] Uploading metadata…`);
    const metaHash = await pinJSON(meta, `covenant-seal-tier-${tier}.json`);
    const metaURI  = `ipfs://${metaHash}`;
    console.log(`   ✅ Metadata: ${metaURI}\n`);

    results.push({ tier, imageURI, metaURI });
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Upload complete — call setTierMetadataURI with these URIs");
  console.log("═══════════════════════════════════════════════════════════");
  for (const { tier, imageURI, metaURI } of results) {
    console.log(`  Tier ${tier} image:    ${imageURI}`);
    console.log(`  Tier ${tier} metadata: ${metaURI}`);
  }
  console.log("═══════════════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
