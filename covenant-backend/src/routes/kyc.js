import express from 'express';
import { supabase } from '../server.js';
import { createMintSignature } from '../services/signature.js';
import { hasSeal } from '../services/blockchain.js';

const router = express.Router();

/**
 * Submit KYC application
 * POST /api/kyc/submit
 */
router.post('/submit', async (req, res) => {
  try {
    const { walletAddress, email, phone, fullName, tierRequested } = req.body;

    // Validate input
    if (!walletAddress || !email || !fullName || !tierRequested) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Check if address already has a seal
    const alreadyHasSeal = await hasSeal(walletAddress);
    if (alreadyHasSeal) {
      return res.status(400).json({ 
        error: 'Address already has a seal' 
      });
    }

    // Check if already submitted
    const { data: existing } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return res.status(400).json({ 
        error: 'Pending submission already exists' 
      });
    }

    // Create or get user
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (!user) {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({ wallet_address: walletAddress })
        .select()
        .single();

      if (userError) throw userError;
      user = newUser;
    }

    // Create KYC submission
    const { data: submission, error: submitError } = await supabase
      .from('kyc_submissions')
      .insert({
        user_id: user.id,
        wallet_address: walletAddress,
        email,
        phone,
        full_name: fullName,
        tier_requested: tierRequested,
        status: 'pending'
      })
      .select()
      .single();

    if (submitError) throw submitError;

    console.log(`📝 KYC submitted for ${walletAddress}`);

    res.json({
      success: true,
      submissionId: submission.id,
      status: 'pending',
      message: 'KYC submission received. Awaiting review.'
    });

  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit KYC',
      details: error.message 
    });
  }
});

/**
 * Check KYC status
 * GET /api/kyc/status/:address
 */
router.get('/status/:address', async (req, res) => {
  try {
    const { address } = req.params;

    const { data: submissions, error } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('wallet_address', address)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    if (!submissions || submissions.length === 0) {
      return res.json({ 
        hasSubmission: false,
        status: null 
      });
    }

    const latest = submissions[0];

    res.json({
      hasSubmission: true,
      status: latest.status,
      tierRequested: latest.tier_requested,
      submittedAt: latest.submitted_at,
      reviewedAt: latest.reviewed_at
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      error: 'Failed to check status',
      details: error.message 
    });
  }
});

export default router;
