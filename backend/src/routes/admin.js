import express from 'express';
import rateLimit from 'express-rate-limit';
import { Resend } from 'resend';
import { supabase } from '../server.js';
import { createMintSignature } from '../services/signature.js';
import { mintSeal, getSealId, revokeSeal, getSealInfo } from '../services/blockchain.js';
import { attestOnPolygon, getPolygonAttestation } from '../services/polygon.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const FRONTEND_URL  = process.env.FRONTEND_URL || 'https://covenant-sigma.vercel.app';
const ARBISCAN_BASE = 'https://sepolia.arbiscan.io';

const TIER_LABELS = {
  1: { name: 'Bronze', numeral: 'I'  },
  2: { name: 'Silver', numeral: 'II' },
  3: { name: 'Gold',   numeral: 'III'},
  4: { name: 'Platinum', numeral: 'IV'},
  5: { name: 'Diamond',  numeral: 'V' },
};

// Expiry durations per tier — mirrors blockchain.js so the email shows the correct date
const EXPIRY_BY_TIER = {
  1: 365 * 24 * 60 * 60,
  2: 2 * 365 * 24 * 60 * 60,
};

function formatEmailDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

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

    // Send mint confirmation email — fire and forget, never blocks the response
    try {
      // Fetch the user's email from the submission record
      const { data: submission } = await supabase
        .from('kyc_submissions')
        .select('email, full_name, tier_requested')
        .eq('wallet_address', walletAddress)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      if (submission?.email) {
        const tierLabel  = TIER_LABELS[tier] ?? TIER_LABELS[1];
        const mintedAt   = Math.floor(Date.now() / 1000);
        const expiryDuration = EXPIRY_BY_TIER[tier];
        const expiresAt  = expiryDuration ? mintedAt + expiryDuration : null;

        const issuedStr  = formatEmailDate(mintedAt);
        const expiryStr  = expiresAt ? formatEmailDate(expiresAt) : 'No expiry';

        const statusUrl   = `${FRONTEND_URL}/demo/status`;
        const arbiscanUrl = `${ARBISCAN_BASE}/token/${process.env.CONTRACT_ADDRESS}?a=${sealId}`;

        await resend.emails.send({
          from: 'Covenant Protocol <onboarding@resend.dev>',
          to: submission.email,
          subject: 'Your Covenant Seal Has Been Issued',
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#08070a;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#08070a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#14000c;border:1px solid rgba(212,175,90,0.25);">

        <!-- Header -->
        <tr>
          <td style="background-color:#1f0112;border-bottom:1px solid rgba(212,175,90,0.2);padding:28px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-block;width:32px;height:32px;border:1px solid rgba(212,175,90,0.5);text-align:center;line-height:32px;margin-right:12px;vertical-align:middle;">
                    <span style="color:#d4af5a;font-size:16px;font-weight:bold;">C</span>
                  </div>
                  <span style="color:#f0ece3;font-size:13px;letter-spacing:0.25em;text-transform:uppercase;vertical-align:middle;">Covenant Protocol</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Hero -->
        <tr>
          <td style="padding:48px 40px 32px;text-align:center;border-bottom:1px solid rgba(212,175,90,0.1);">
            <p style="margin:0 0 16px;color:rgba(212,175,90,0.5);font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">Covenant Protocol</p>
            <h1 style="margin:0 0 20px;color:#f0ece3;font-size:28px;font-weight:normal;letter-spacing:0.05em;">Your pact has been sealed.</h1>
            <p style="margin:0;color:#a09488;font-size:18px;font-style:italic;line-height:1.6;">Your Covenant seal has been permanently bound to your wallet.</p>
          </td>
        </tr>

        <!-- Tier badge -->
        <tr>
          <td style="padding:32px 40px;text-align:center;border-bottom:1px solid rgba(212,175,90,0.1);">
            <div style="display:inline-block;border:1px solid rgba(212,175,90,0.4);padding:10px 28px;">
              <span style="color:#d4af5a;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">${tierLabel.name} &mdash; Tier ${tierLabel.numeral}</span>
            </div>
          </td>
        </tr>

        <!-- Seal details -->
        <tr>
          <td style="padding:32px 40px;border-bottom:1px solid rgba(212,175,90,0.1);">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-bottom:20px;">
                  <p style="margin:0 0 4px;color:#a09488;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;">Seal ID</p>
                  <p style="margin:0;color:#f0ece3;font-family:monospace;font-size:16px;font-weight:bold;">#${sealId}</p>
                </td>
                <td width="50%" style="padding-bottom:20px;">
                  <p style="margin:0 0 4px;color:#a09488;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;">Issued</p>
                  <p style="margin:0;color:#f0ece3;font-size:15px;">${issuedStr}</p>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <p style="margin:0 0 4px;color:#a09488;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;">Expires</p>
                  <p style="margin:0;color:#f0ece3;font-size:15px;">${expiryStr}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTAs -->
        <tr>
          <td style="padding:32px 40px;text-align:center;border-bottom:1px solid rgba(212,175,90,0.1);">
            <a href="${statusUrl}" style="display:inline-block;background-color:#d4af5a;color:#14000c;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:14px 32px;font-family:Arial,sans-serif;font-weight:bold;margin-bottom:12px;">View Your Seal</a>
            <br>
            <a href="${arbiscanUrl}" style="display:inline-block;border:1px solid rgba(212,175,90,0.4);color:#d4af5a;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;padding:12px 32px;font-family:Arial,sans-serif;margin-top:4px;">View on Arbiscan ↗</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="margin:0;color:rgba(160,148,136,0.5);font-size:12px;font-style:italic;">Covenant Protocol &mdash; covenantprotocol.io</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
          `
        });

        console.log(`📧 Mint confirmation email sent to ${submission.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send mint confirmation email:', emailError);
      // Never block the response for a failed email
    }

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
