import express from 'express';
import { supabase } from '../server.js';
import { createMintSignature } from '../services/signature.js';
import { mintSeal, getSealId, revokeSeal } from '../services/blockchain.js';

const router = express.Router();

/**
 * Get all pending KYC submissions
 * GET /api/admin/pending
 */
router.get('/pending', async (req, res) => {
  try {
    const { data: submissions, error } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) throw error;

    res.json({
      count: submissions.length,
      submissions
    });

  } catch (error) {
    console.error('Failed to get pending submissions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pending submissions',
      details: error.message 
    });
  }
});

/**
 * Approve a KYC submission (generates signature)
 * POST /api/admin/approve/:id
 */
router.post('/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get submission
    const { data: submission, error: fetchError } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.status === 'rejected') {
      return res.status(400).json({ 
        error: 'Cannot approve rejected submission' 
      });
    }

    // If already approved, return existing signature
    if (submission.status === 'approved' && submission.signature) {
      console.log(`♻️  Returning existing signature for ${submission.wallet_address}`);
      return res.json({
        success: true,
        submissionId: id,
        walletAddress: submission.wallet_address,
        tier: submission.tier_requested,
        signature: submission.signature,
        message: 'KYC already approved. Using existing signature.'
      });
    }

    // Create new signature
    const signature = await createMintSignature(
      submission.wallet_address,
      submission.tier_requested
    );

    // Update submission with signature
    const { error: updateError } = await supabase
      .from('kyc_submissions')
      .update({ 
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        signature: signature  // STORE IT
      })
      .eq('id', id);

    if (updateError) throw updateError;

    console.log(`✅ Approved KYC for ${submission.wallet_address}`);

    res.json({
      success: true,
      submissionId: id,
      walletAddress: submission.wallet_address,
      tier: submission.tier_requested,
      signature,
      message: 'KYC approved. Ready to mint.'
    });

  } catch (error) {
    console.error('Approval failed:', error);
    res.status(500).json({ 
      error: 'Failed to approve KYC',
      details: error.message 
    });
  }
});

/**
 * Mint seal on-chain
 * POST /api/admin/mint
 */
router.post('/mint', async (req, res) => {
  try {
    const { submissionId, walletAddress, tier, signature } = req.body;

    if (!walletAddress || !tier || !signature) {
      return res.status(400).json({ 
        error: 'Missing required fields: walletAddress, tier, signature' 
      });
    }

    // Check if already minted
    const existingSealId = await getSealId(walletAddress);
    if (existingSealId > 0) {
      return res.status(400).json({ 
        error: 'Seal already minted for this address',
        sealId: existingSealId
      });
    }

    // Mint on-chain
    const receipt = await mintSeal(walletAddress, tier, signature);

    // Get the seal ID
    const sealId = await getSealId(walletAddress);

    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    // Record minted seal
    const { error: sealError } = await supabase
      .from('seals')
      .insert({
        user_id: user.id,
        wallet_address: walletAddress,
        seal_id: sealId,
        tier: tier,
        transaction_hash: receipt.transactionHash
      });

    if (sealError) {
      console.error('Failed to record seal:', sealError);
      // Don't fail the request - seal is minted, just log failed
    }

    console.log(`✅ Seal #${sealId} minted for ${walletAddress}`);

    res.json({
      success: true,
      sealId,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      message: 'Seal minted successfully!'
    });

  } catch (error) {
    console.error('Minting failed:', error);
    res.status(500).json({ 
      error: 'Failed to mint seal',
      details: error.message 
    });
  }
});

/**
 * Revoke a seal
 * POST /api/admin/revoke
 */
router.post('/revoke', async (req, res) => {
  try {
    const { sealId, reason } = req.body;

    if (!sealId || !reason) {
      return res.status(400).json({ 
        error: 'Missing required fields: sealId, reason' 
      });
    }

    // Revoke on-chain
    const receipt = await revokeSeal(sealId, reason);

    console.log(`🚫 Seal #${sealId} revoked`);

    res.json({
      success: true,
      sealId,
      transactionHash: receipt.transactionHash,
      reason,
      message: 'Seal revoked successfully'
    });

  } catch (error) {
    console.error('Revocation failed:', error);
    res.status(500).json({ 
      error: 'Failed to revoke seal',
      details: error.message 
    });
  }
});

/**
 * Get all approved submissions ready to mint
 * GET /api/admin/ready-to-mint
 */
router.get('/ready-to-mint', async (req, res) => {
  try {
    // Get approved submissions
    const { data: approved, error: approvedError } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: true });

    if (approvedError) throw approvedError;

    // Get already minted seals
    const { data: minted, error: mintedError } = await supabase
      .from('seals')
      .select('wallet_address');

    if (mintedError) throw mintedError;

    const mintedAddresses = new Set(minted.map(s => s.wallet_address));

    // Filter out already minted
    const readyToMint = approved.filter(
      sub => !mintedAddresses.has(sub.wallet_address)
    );

    res.json({
      count: readyToMint.length,
      submissions: readyToMint
    });

  } catch (error) {
    console.error('Failed to get ready-to-mint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ready-to-mint submissions',
      details: error.message 
    });
  }
});

export default router;
