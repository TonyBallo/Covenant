import express from 'express';
import rateLimit from 'express-rate-limit';
import { supabase } from '../server.js';
import { createMintSignature } from '../services/signature.js';
import { mintSeal, getSealId, revokeSeal, getSealInfo } from '../services/blockchain.js';
import { attestOnPolygon, getPolygonAttestation } from '../services/polygon.js';

const router = express.Router();

// Rate limit all admin routes to 20 requests per 15 minutes per IP.
// Prevents brute-force attempts against the x-admin-secret header.
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests from this IP, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
router.use(adminLimiter);

// Require admin secret on all admin routes
router.use((req, res, next) => {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

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
      .eq('email_verified', true) 
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

    // Create new signature (jurisdictionCode defaults to 0 — global)
    const signature = await createMintSignature(
      submission.wallet_address,
      submission.tier_requested,
      0
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
 * Reject a KYC submission
 * POST /api/admin/reject/:id
 */
router.post('/reject/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Get submission
    const { data: submission, error: fetchError } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.status !== 'pending' && submission.status !== 'approved') {
      return res.status(400).json({ error: 'Can only reject pending or approved submissions' });
    }

    // Update status to rejected
    const { error: updateError } = await supabase
      .from('kyc_submissions')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    console.log(`❌ Rejected KYC for ${submission.wallet_address}: ${reason}`);

    res.json({
      success: true,
      submissionId: id,
      walletAddress: submission.wallet_address,
      reason,
      message: 'Submission rejected'
    });

  } catch (error) {
    console.error('Rejection failed:', error);
    res.status(500).json({
      error: 'Failed to reject submission',
      details: error.message
    });
  }
});
/**
 * Mint seal on-chain
 * POST /api/admin/mint
 * Body: { submissionId, walletAddress, tier, jurisdictionCode? }
 * jurisdictionCode defaults to 0 (global) if not provided.
 * The signature is always regenerated here so it binds to the correct jurisdictionCode.
 */
router.post('/mint', async (req, res) => {
  try {
    const { submissionId, walletAddress, tier, jurisdictionCode = 0 } = req.body;

    if (!walletAddress || !tier) {
      return res.status(400).json({
        error: 'Missing required fields: walletAddress, tier'
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

    // Regenerate signature bound to the exact jurisdictionCode being minted
    const signature = await createMintSignature(walletAddress, tier, jurisdictionCode);

    // Mint on-chain
    const receipt = await mintSeal(walletAddress, tier, signature, jurisdictionCode);

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
 * Attest seal on Polygon
 * POST /api/admin/attest/:id
 */
router.post('/attest/:id', async (req, res) => {
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

    if (submission.status !== 'approved') {
      return res.status(400).json({ 
        error: 'Can only attest approved submissions' 
      });
    }

    if (!submission.signature) {
      return res.status(400).json({ 
        error: 'No signature found - approve first' 
      });
    }

    // Get seal ID from Arbitrum
    const sealId = await getSealId(submission.wallet_address);

    if (sealId === 0) {
      return res.status(400).json({
        error: 'Seal not minted on Arbitrum yet'
      });
    }

    // Check if already attested
    const existingAttestation = await getPolygonAttestation(submission.wallet_address);
    if (existingAttestation.hasAttestation) {
      return res.status(400).json({
        error: 'Already attested on Polygon',
        polygonTier: existingAttestation.tier
      });
    }

    // Generate a Polygon-specific signature (jurisdictionCode 0 — global, chainId 80002)
    const polygonSignature = await createMintSignature(
      submission.wallet_address,
      submission.tier_requested,
      0,
      80002
    );

    // Attest on Polygon
    const result = await attestOnPolygon(
      submission.wallet_address,
      submission.tier_requested,
      sealId,
      polygonSignature
    );

    console.log(`✅ Attested seal #${sealId} on Polygon for ${submission.wallet_address}`);

    res.json({
      success: true,
      sealId,
      polygonTxHash: result.transactionHash,
      credentialHash: result.credentialHash,
      message: 'Seal attested on Polygon successfully!'
    });

  } catch (error) {
    console.error('Attestation failed:', error);
    res.status(500).json({ 
      error: 'Failed to attest on Polygon',
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
    const { sealId, walletAddress, reason } = req.body;

    if (!sealId || !reason) {
      return res.status(400).json({
        error: 'Missing required fields: sealId, reason'
      });
    }

    // Revoke on-chain
    const receipt = await revokeSeal(sealId, reason);

    // Update submission status to 'revoked' in Supabase
    if (walletAddress) {
      const { error: updateError } = await supabase
        .from('kyc_submissions')
        .update({
          status: 'revoked',
          reviewed_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress);

      if (updateError) {
        console.error('Failed to update submission status after revoke:', updateError);
      }
    }

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
 * Get all revoked submissions
 * GET /api/admin/revoked
 */
router.get('/revoked', async (_req, res) => {
  try {
    const { data: submissions, error } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('status', 'revoked')
      .order('reviewed_at', { ascending: false });

    if (error) throw error;

    // Enrich each entry with seal data from the seals table
    const enriched = await Promise.all((submissions || []).map(async (sub) => {
      const { data: seal } = await supabase
        .from('seals')
        .select('seal_id, tier')
        .eq('wallet_address', sub.wallet_address)
        .single();

      return {
        ...sub,
        sealId: seal?.seal_id || null,
        sealTier: seal?.tier || sub.tier_requested,
      };
    }));

    res.json({ count: enriched.length, submissions: enriched });

  } catch (error) {
    console.error('Failed to get revoked submissions:', error);
    res.status(500).json({
      error: 'Failed to fetch revoked submissions',
      details: error.message
    });
  }
});

/**
 * Look up a seal by wallet address
 * GET /api/admin/seal/:address
 */
router.get('/seal/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const info = await getSealInfo(address);
    res.json(info);
  } catch (error) {
    console.error('Seal lookup failed:', error);
    res.status(500).json({ error: 'Failed to look up seal', details: error.message });
  }
});

/**
 * Check Polygon attestation status
 * GET /api/admin/polygon-status/:address
 */
router.get('/polygon-status/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const attestation = await getPolygonAttestation(address);
    
    res.json({
      hasAttestation: attestation.hasAttestation,
      tier: attestation.tier,
      expiresAt: attestation.expiresAt,
      isRevoked: attestation.isRevoked
    });
  } catch (error) {
    console.error('Failed to check Polygon status:', error);
    res.status(500).json({ 
      error: 'Failed to check Polygon attestation',
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
      .eq('email_verified', true)
      .order('reviewed_at', { ascending: true });

    if (approvedError) throw approvedError;

    // For each approved submission, check on-chain state on both networks.
    // A submission stays in the ready-to-mint list until BOTH conditions are met:
    //   1. Seal is minted on Arbitrum (sealId > 0)
    //   2. Seal is attested on Polygon Amoy (PactWitness.hasAttestation)
    const readyToMint = [];

    for (const submission of approved) {
      try {
        const sealId = await getSealId(submission.wallet_address);
        const polygonStatus = await getPolygonAttestation(submission.wallet_address);

        const isMinted = sealId > 0;
        const needsAttestation = !polygonStatus.hasAttestation;

        // Keep in list if either action is still pending
        if (!isMinted || needsAttestation) {
          readyToMint.push({
            ...submission,
            isMinted,
            sealId: isMinted ? sealId : null
          });
        }
      } catch (checkError) {
        console.error(`Error checking ${submission.wallet_address}:`, checkError);
        // Include submission even if check fails - better to show it than hide it
        readyToMint.push({
          ...submission,
          isMinted: false,
          sealId: null
        });
      }
    }

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
