import express from 'express';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { Resend } from 'resend';
import { supabase } from '../server.js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const NOTIFY_EMAIL = 'tonyballo@covenantprotocol.io';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://covenantprotocol.io';
const TOKEN_TTL_HOURS = 24;

const router = express.Router();

const waitlistLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/waitlist
 * Stores a pending record and sends a confirmation email.
 * Nothing is written to the waitlist table until the link is clicked.
 */
router.post('/', waitlistLimiter, async (req, res) => {
  try {
    const { name, email, user_type, org_name } = req.body;

    if (!name || !email || !user_type) {
      return res.status(400).json({ error: 'name, email, and user_type are required' });
    }
    if (!['individual', 'protocol'].includes(user_type)) {
      return res.status(400).json({ error: 'user_type must be "individual" or "protocol"' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();

    const { error: dbError } = await supabase
      .from('waitlist_pending')
      .upsert(
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          user_type,
          org_name: org_name?.trim() || null,
          token,
          expires_at: expiresAt,
        },
        { onConflict: 'email' }
      );

    if (dbError) {
      console.error('Waitlist pending upsert error:', dbError);
      return res.status(500).json({ error: 'Failed to process signup' });
    }

    // Send confirmation email
    if (resend) {
      const confirmLink = `${FRONTEND_URL}/waitlist/confirm/${token}`;
      resend.emails.send({
        from: 'Covenant Protocol <noreply@verify.covenantprotocol.io>',
        to: email.trim().toLowerCase(),
        subject: 'Confirm your spot — Covenant Protocol',
        html: `
          <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
            <p style="font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; color: #9a8060; margin-bottom: 24px;">Covenant Protocol</p>
            <h2 style="font-size: 24px; font-weight: normal; margin-bottom: 16px;">Confirm your spot on the waitlist.</h2>
            <p style="font-size: 16px; line-height: 1.7; color: #444;">Hi ${name.trim()},</p>
            <p style="font-size: 16px; line-height: 1.7; color: #444;">
              Click the button below to confirm your email and secure your place on the Covenant mainnet waitlist.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmLink}" style="background-color: #9a8060; color: #fff; padding: 13px 32px; text-decoration: none; font-family: Arial, sans-serif; font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; display: inline-block;">
                Confirm my spot
              </a>
            </div>
            <p style="font-size: 13px; color: #999;">This link expires in ${TOKEN_TTL_HOURS} hours. If you didn't sign up, you can safely ignore this email.</p>
            <p style="font-size: 14px; color: #999; margin-top: 32px;">— The Covenant Team</p>
          </div>
        `,
      }).catch(err => console.error('Waitlist confirmation email failed:', err));
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Waitlist error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/waitlist/confirm/:token
 * Validates token, writes to waitlist, notifies admin, redirects to success page.
 */
router.get('/confirm/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const { data: pending, error: fetchError } = await supabase
      .from('waitlist_pending')
      .select('*')
      .eq('token', token)
      .single();

    if (fetchError || !pending) {
      return res.redirect(`${FRONTEND_URL}/waitlist/confirmed?status=invalid`);
    }

    if (new Date(pending.expires_at) < new Date()) {
      await supabase.from('waitlist_pending').delete().eq('token', token);
      return res.redirect(`${FRONTEND_URL}/waitlist/confirmed?status=expired`);
    }

    // Write to the real waitlist table
    const { error: insertError } = await supabase
      .from('waitlist')
      .upsert(
        {
          name: pending.name,
          email: pending.email,
          user_type: pending.user_type,
          org_name: pending.org_name,
        },
        { onConflict: 'email' }
      );

    if (insertError) {
      console.error('Waitlist insert error:', insertError);
      return res.redirect(`${FRONTEND_URL}/waitlist/confirmed?status=error`);
    }

    // Clean up pending record
    await supabase.from('waitlist_pending').delete().eq('token', token);

    // Notify admin
    if (resend) {
      const typeLabel = pending.user_type === 'protocol' ? 'Protocol / Partner' : 'Individual Member';
      resend.emails.send({
        from: 'Covenant Protocol <noreply@verify.covenantprotocol.io>',
        to: NOTIFY_EMAIL,
        subject: `New waitlist signup — ${pending.name}`,
        html: `
          <div style="font-family: monospace; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
            <p style="font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: #9a8060;">Covenant — Waitlist</p>
            <table style="margin-top: 16px; border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 6px 0; color: #666; width: 120px;">Name</td><td style="padding: 6px 0;">${pending.name}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0;">${pending.email}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Type</td><td style="padding: 6px 0;">${typeLabel}</td></tr>
              ${pending.org_name ? `<tr><td style="padding: 6px 0; color: #666;">Org</td><td style="padding: 6px 0;">${pending.org_name}</td></tr>` : ''}
            </table>
          </div>
        `,
      }).catch(err => console.error('Waitlist notify email failed:', err));
    }

    return res.redirect(`${FRONTEND_URL}/waitlist/confirmed?status=ok`);
  } catch (err) {
    console.error('Waitlist confirm error:', err);
    return res.redirect(`${FRONTEND_URL}/waitlist/confirmed?status=error`);
  }
});

export default router;
