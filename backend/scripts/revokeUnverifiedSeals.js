/**
 * Revoke all minted seals that predate the phone verification requirement
 * (i.e. kyc_submissions rows with status='minted' and phone IS NULL).
 *
 * Usage:
 *   node scripts/revokeUnverifiedSeals.js            # dry run — lists candidates only
 *   node scripts/revokeUnverifiedSeals.js --execute  # actually revokes
 *
 * Run from the backend/ directory so dotenv picks up .env correctly.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { revokeSeal, getSealInfo } from '../src/services/blockchain.js';

dotenv.config();

const DRY_RUN = !process.argv.includes('--execute');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const REASON =
  'Seal revoked: issued before mandatory phone verification requirement. Please reapply at covenantprotocol.io.';

async function main() {
  // Source of truth for minted wallets is the seals table, not kyc_submissions status,
  // since the mint route never updates kyc_submissions.status to 'minted'.
  const { data: seals, error: sealsError } = await supabase
    .from('seals')
    .select('wallet_address');
  if (sealsError) throw sealsError;

  const mintedWallets = (seals || []).map(s => s.wallet_address);
  if (mintedWallets.length === 0) {
    console.log('No seals found in the seals table.');
    return;
  }

  const { data: submissions, error } = await supabase
    .from('kyc_submissions')
    .select('id, wallet_address, email, full_name, phone, tier_requested')
    .in('wallet_address', mintedWallets)
    .in('status', ['approved', 'minted'])
    .or('phone.is.null,phone.eq.');

  if (error) throw error;

  if (!submissions || submissions.length === 0) {
    console.log('No unverified minted seals found — nothing to revoke.');
    return;
  }

  console.log(`Found ${submissions.length} minted seal(s) without phone verification:\n`);
  for (const s of submissions) {
    console.log(`  Wallet : ${s.wallet_address}`);
    console.log(`  Name   : ${s.full_name}`);
    console.log(`  Email  : ${s.email}`);
    console.log(`  Tier   : ${s.tier_requested}`);
    console.log('');
  }

  if (DRY_RUN) {
    console.log('Dry run — no changes made. Re-run with --execute to revoke.');
    return;
  }

  let revoked = 0;
  let skipped = 0;

  for (const submission of submissions) {
    try {
      const sealInfo = await getSealInfo(submission.wallet_address);

      if (!sealInfo.found) {
        console.log(`⚠️  ${submission.wallet_address}: no on-chain seal found — marking revoked in DB only`);
        await supabase
          .from('kyc_submissions')
          .update({ status: 'revoked', rejection_reason: REASON, reviewed_at: new Date().toISOString() })
          .eq('id', submission.id);
        skipped++;
        continue;
      }

      if (sealInfo.revoked) {
        console.log(`ℹ️  ${submission.wallet_address}: seal #${sealInfo.sealId} already revoked on-chain — syncing DB`);
        await supabase
          .from('kyc_submissions')
          .update({ status: 'revoked', rejection_reason: REASON, reviewed_at: new Date().toISOString() })
          .eq('id', submission.id);
        skipped++;
        continue;
      }

      console.log(`🚫 Revoking seal #${sealInfo.sealId} for ${submission.wallet_address}...`);

      await revokeSeal(sealInfo.sealId, REASON);

      await supabase
        .from('kyc_submissions')
        .update({ status: 'revoked', rejection_reason: REASON, reviewed_at: new Date().toISOString() })
        .eq('id', submission.id);

      console.log(`✅ Seal #${sealInfo.sealId} revoked.\n`);
      revoked++;
    } catch (err) {
      console.error(`❌ Failed for ${submission.wallet_address}:`, err.message, '\n');
    }
  }

  console.log(`Done. Revoked: ${revoked}  Skipped/synced: ${skipped}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
