import express from 'express';
import rateLimit from 'express-rate-limit';
import { supabase } from '../server.js';
import {
  getTreeStatus,
  verifyLinkTx,
  verifyUnlinkTx,
  getBlockTimestamp,
} from '../services/treechain.js';

const router = express.Router();

const treeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(treeLimiter);

/**
 * GET /api/tree/status/:address
 * Returns the trust tree position of an address.
 * Public — only reveals whether the address is linked and its effective tier.
 * Siblings and full tree structure are never exposed.
 */
router.get('/status/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const status = await getTreeStatus(address);
    res.json(status);
  } catch (error) {
    console.error('Tree status lookup failed:', error);
    res.status(500).json({ error: 'Failed to get tree status', details: error.message });
  }
});

/**
 * POST /api/tree/record-link
 * Body: { txHash }
 * Called by the frontend after the user's linkWallet() tx confirms on Arbitrum.
 * Parses the WalletLinked event from the receipt and persists the link to Supabase.
 * Idempotent — re-submitting the same txHash returns success without duplicating the row.
 */
router.post('/record-link', async (req, res) => {
  try {
    const { txHash } = req.body;
    if (!txHash) return res.status(400).json({ error: 'txHash is required' });

    // Verify the on-chain event first (validates tx source + contract)
    const event = await verifyLinkTx(txHash);

    // Idempotency guard
    const { data: existing } = await supabase
      .from('tree_links')
      .select('id')
      .eq('tx_hash', txHash)
      .maybeSingle();

    if (existing) {
      return res.json({ success: true, alreadyExists: true, message: 'Link already recorded' });
    }

    const linkedAt = await getBlockTimestamp(event.blockNumber);

    const { error: insertError } = await supabase
      .from('tree_links')
      .insert({
        root_address:   event.root,
        parent_address: event.parent,
        child_address:  event.child,
        child_tier:     event.childTier,
        tx_hash:        txHash,
        linked_at:      linkedAt,
      });

    if (insertError) throw insertError;

    console.log(`🌿 Link recorded: ${event.parent} → ${event.child} (tier ${event.childTier}) root: ${event.root}`);

    res.json({
      success:   true,
      root:      event.root,
      parent:    event.parent,
      child:     event.child,
      childTier: event.childTier,
      linkedAt,
    });
  } catch (error) {
    console.error('record-link failed:', error);
    res.status(500).json({ error: 'Failed to record link', details: error.message });
  }
});

/**
 * POST /api/tree/record-unlink
 * Body: { txHash }
 * Called by the frontend after the user's unlinkWallet() tx confirms on Arbitrum.
 * Marks the matching tree_links row as inactive by setting unlinked_at.
 * The row is kept for audit trail — never deleted.
 */
router.post('/record-unlink', async (req, res) => {
  try {
    const { txHash } = req.body;
    if (!txHash) return res.status(400).json({ error: 'txHash is required' });

    const event = await verifyUnlinkTx(txHash);
    const unlinkedAt = await getBlockTimestamp(event.blockNumber);

    // Find the active link row for this child under this root
    const { data: link, error: findError } = await supabase
      .from('tree_links')
      .select('id')
      .eq('child_address', event.child)
      .eq('root_address', event.root)
      .is('unlinked_at', null)
      .maybeSingle();

    if (findError) throw findError;

    if (!link) {
      // On-chain is source of truth — the unlink happened even if we have no DB row
      return res.json({
        success: true,
        message: 'No active link row found; on-chain state is canonical',
        root:  event.root,
        child: event.child,
      });
    }

    const { error: updateError } = await supabase
      .from('tree_links')
      .update({ unlinked_at: unlinkedAt })
      .eq('id', link.id);

    if (updateError) throw updateError;

    console.log(`✂️  Unlink recorded: child ${event.child} from root ${event.root}`);

    res.json({
      success:    true,
      root:       event.root,
      child:      event.child,
      unlinkedAt,
    });
  } catch (error) {
    console.error('record-unlink failed:', error);
    res.status(500).json({ error: 'Failed to record unlink', details: error.message });
  }
});

export default router;
