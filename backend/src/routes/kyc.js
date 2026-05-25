import express from 'express';
import rateLimit from 'express-rate-limit';
import { Resend } from 'resend';
import crypto from 'crypto';
import twilio from 'twilio';
import { supabase } from '../server.js';
import { createMintSignature } from '../services/signature.js';
import { getSealInfo } from '../services/blockchain.js';

const router = express.Router();
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;
const TWILIO_VERIFY_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com', 'icloud.com', 'me.com', 'mac.com',
  'outlook.com', 'hotmail.com', 'live.com',
  'yahoo.com', 'proton.me', 'protonmail.com',
]);

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info',
  'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.de',
  'grr.la', 'sharklasers.com', 'guerrillamailblock.com',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io',
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  'yopmail.com', 'yopmail.fr',
  'trashmail.com', 'trashmail.at', 'trashmail.io',
  'trashmail.me', 'trashmail.net', 'trashmail.org',
  'getairmail.com', 'fakeinbox.com', 'mailnull.com',
  'maildrop.cc', 'spamgourmet.com', 'dispostable.com',
  'spam4.me', 'throwam.com', 'mohmal.com',
  'mintemail.com', 'tempr.email', 'discard.email',
  'harakirimail.com', 'mailnesia.com', 'mytrashmail.com',
  'nwytg.com', 'mytemp.email', 'tempinbox.com',
  'mailtemp.net', 'getnada.com', 'filzmail.com',
  'zetmail.com', 'jetable.fr', 'spambox.us',
]);

function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email || '').trim());
}

function isEmailDomainAllowed(email) {
  const parts = (email || '').toLowerCase().trim().split('@');
  if (parts.length !== 2 || !parts[1]) return false;
  const domain = parts[1];
  if (PERSONAL_EMAIL_DOMAINS.has(domain)) return true;
  if (domain.endsWith('.edu') || domain.endsWith('.gov')) return true;
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return false;
  return true;
}

// Frontend URL used for email verification redirect after clicking the link.
// Must point to the deployed frontend (Vercel). Falls back to the primary deployment.
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://covenant-sigma.vercel.app';

// Rate limit KYC submissions to 3 per IP per 15 minutes.
// Prevents spam applications and protects the Resend email quota.
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'Too many applications from this IP, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many OTP requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

function normalizePhone(phone) {
  const cleaned = (phone || '').replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (/^\d{10}$/.test(cleaned)) return `+1${cleaned}`;
  if (/^1\d{10}$/.test(cleaned)) return `+${cleaned}`;
  return cleaned;
}

function generatePhoneToken(phone) {
  const expiry = Date.now() + 30 * 60 * 1000;
  const payload = JSON.stringify({ phone, expiry });
  const sig = crypto.createHmac('sha256', process.env.ADMIN_SECRET || 'dev-secret')
    .update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ payload, sig })).toString('base64');
}

function validatePhoneToken(token, phone) {
  try {
    const { payload, sig } = JSON.parse(Buffer.from(token, 'base64').toString());
    const expected = crypto.createHmac('sha256', process.env.ADMIN_SECRET || 'dev-secret')
      .update(payload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return false;
    const { phone: tokenPhone, expiry } = JSON.parse(payload);
    if (tokenPhone !== phone) return false;
    if (Date.now() > expiry) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Send SMS OTP
 * POST /api/kyc/send-otp
 */
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    const normalized = normalizePhone(phone);

    if (!twilioClient) return res.status(503).json({ error: 'SMS service not configured' });

    await twilioClient.verify.v2.services(TWILIO_VERIFY_SID)
      .verifications.create({ to: normalized, channel: 'sms' });

    res.json({ success: true });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send verification code. Check the number and try again.' });
  }
});

/**
 * Verify SMS OTP and return a short-lived phone token
 * POST /api/kyc/verify-otp
 */
router.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });

    const normalized = normalizePhone(phone);

    if (!twilioClient) return res.status(503).json({ error: 'SMS service not configured' });

    const check = await twilioClient.verify.v2.services(TWILIO_VERIFY_SID)
      .verificationChecks.create({ to: normalized, code });

    if (check.status !== 'approved') {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    res.json({ success: true, phoneVerificationToken: generatePhoneToken(normalized) });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

/**
 * Submit KYC application
 * POST /api/kyc/submit
 */
router.post('/submit', submitLimiter, async (req, res) => {
  try {
    const { walletAddress, email, phone, fullName, tierRequested, phoneVerificationToken } = req.body;

    // Validate input
    if (!walletAddress || !email || !fullName || !tierRequested || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isValidEmailFormat(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!isEmailDomainAllowed(email)) {
      return res.status(400).json({
        error: 'Please use a personal email (Gmail, iCloud, Outlook, etc.), institutional (.edu/.gov), or verified business email. Disposable addresses are not accepted.'
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!phoneVerificationToken || !validatePhoneToken(phoneVerificationToken, normalizedPhone)) {
      return res.status(400).json({ error: 'Phone verification required. Please verify your number before submitting.' });
    }

    // Check on-chain seal state to gate new applications vs upgrade applications
    const sealInfo = await getSealInfo(walletAddress);
    if (sealInfo.found) {
      if (sealInfo.revoked) {
        return res.status(400).json({ error: 'Address has a revoked seal and cannot apply' });
      }
      if (tierRequested <= sealInfo.tier) {
        return res.status(400).json({ error: 'Address already has a seal at this tier or higher' });
      }
      // tier_requested > current tier — valid upgrade application, fall through
    }

    // Check if already submitted (pending)
    const { data: existing } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('status', 'pending')
      .single();

    if (existing) {
      const tokenExpired = existing.verification_expires_at
        ? new Date() > new Date(existing.verification_expires_at)
        : false;

      // Allow retry only if unverified AND the token has expired (email was never received)
      if (existing.email_verified || !tokenExpired) {
        return res.status(400).json({
          error: existing.email_verified
            ? 'Pending submission already exists'
            : 'A verification email was recently sent. Please wait 15 minutes before trying again.'
        });
      }

      // Token expired and never verified — safe to delete and allow fresh submission
      await supabase.from('kyc_submissions').delete().eq('id', existing.id);
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

    // Generate verification token (random 32-byte hex)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create KYC submission (unverified)
    const { data: submission, error: submitError } = await supabase
      .from('kyc_submissions')
      .insert({
        user_id: user.id,
        wallet_address: walletAddress,
        email,
        phone: normalizedPhone,
        full_name: fullName,
        tier_requested: tierRequested,
        status: 'pending',
        email_verified: false,
        verification_token: verificationToken,
        verification_expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (submitError) throw submitError;

    // Send verification email
    const magicLink = `${process.env.BACKEND_URL || 'https://covenant-production-4cf7.up.railway.app'}/api/kyc/verify/${verificationToken}`;
    
    try {
      if (!resend) throw new Error('RESEND_API_KEY not configured');
      await resend.emails.send({
        from: 'Covenant Protocol <noreply@verify.covenantprotocol.io>',
        to: email,
        subject: 'Verify your email - Covenant Protocol',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">Verify Your Email</h2>
            <p>Hi ${fullName},</p>
            <p>Thanks for applying for Covenant verification! Click the button below to verify your email and complete your application:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="background-color: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">This link expires in 15 minutes.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the request - submission is saved, user can try again
    }

    console.log(`📝 KYC submitted for ${walletAddress} - awaiting email verification`);

    res.json({
      success: true,
      submissionId: submission.id,
      message: 'Application received. Please check your email to verify and complete your submission.'
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
 * Verify email via magic link
 * GET /api/kyc/verify/:token
 */
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Find submission by token
    const { data: submission, error: fetchError } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (fetchError || !submission) {
      return res.redirect(`${FRONTEND_URL}/demo/verify-failed?reason=invalid`);
    }

    // Check if already verified
    if (submission.email_verified) {
      return res.redirect(`${FRONTEND_URL}/demo/verify-success?already=true`);
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(submission.verification_expires_at);
    if (now > expiresAt) {
      return res.redirect(`${FRONTEND_URL}/demo/verify-failed?reason=expired`);
    }

    // Mark as verified
    const { error: updateError } = await supabase
      .from('kyc_submissions')
      .update({ 
        email_verified: true,
        verification_token: null // Clear token after use
      })
      .eq('id', submission.id);

    if (updateError) throw updateError;

    console.log(`✅ Email verified for ${submission.wallet_address}`);

    // Redirect to success page
    res.redirect(`${FRONTEND_URL}/demo/verify-success`);

  } catch (error) {
    console.error('Verification error:', error);
    res.redirect(`${FRONTEND_URL}/demo/verify-failed?reason=error`);
  }
});

/**
 * Get cross-chain status for an address
 * GET /api/kyc/cross-chain-status/:address
 */
router.get('/cross-chain-status/:address', async (req, res) => {
  try {
    const { address } = req.params;

    // Check Arbitrum Sepolia seal
    const ethereumSeal = await hasSeal(address);
    
    // Check Polygon attestation
    let polygonAttestation = false;
    try {
      const { getPolygonAttestation } = await import('../services/polygon.js');
      const attestation = await getPolygonAttestation(address);
      polygonAttestation = attestation.hasAttestation;
    } catch (err) {
      console.error('Polygon check failed:', err);
      // If Polygon check fails, just show Ethereum
    }

    res.json({
      ethereum: ethereumSeal,
      polygon: polygonAttestation
    });

  } catch (error) {
    console.error('Cross-chain status check error:', error);
    res.status(500).json({ 
      error: 'Failed to check cross-chain status',
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
      reviewedAt: latest.reviewed_at,
      rejectionReason: latest.rejection_reason,
      emailVerified: latest.email_verified
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
