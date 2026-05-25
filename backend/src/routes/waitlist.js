import express from 'express';
import rateLimit from 'express-rate-limit';
import { Resend } from 'resend';
import { supabase } from '../server.js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const NOTIFY_EMAIL = 'tonyballo@covenantprotocol.io';

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
 * Join the mainnet launch waitlist.
 * Upserts on email so duplicate submissions just update the record.
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

    const { error } = await supabase
      .from('waitlist')
      .upsert(
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          user_type,
          org_name: org_name?.trim() || null,
        },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('Waitlist upsert error:', error);
      return res.status(500).json({ error: 'Failed to join waitlist' });
    }

    // Fire-and-forget emails — never block the response
    if (resend) {
      const typeLabel = user_type === 'protocol' ? 'Protocol / Partner' : 'Individual Member';

      // Confirmation to the user
      resend.emails.send({
        from: 'Covenant Protocol <noreply@verify.covenantprotocol.io>',
        to: email.trim().toLowerCase(),
        subject: "You're on the list — Covenant Protocol",
        html: `
          <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
            <p style="font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; color: #9a8060; margin-bottom: 24px;">Covenant Protocol</p>
            <h2 style="font-size: 24px; font-weight: normal; margin-bottom: 16px;">You're on the waitlist.</h2>
            <p style="font-size: 16px; line-height: 1.7; color: #444;">Hi ${name.trim()},</p>
            <p style="font-size: 16px; line-height: 1.7; color: #444;">
              We've added you to our mainnet launch waitlist. When Covenant goes live, you'll be among the first to know.
            </p>
            <p style="font-size: 16px; line-height: 1.7; color: #444;">
              In the meantime, you can explore the live testnet demo at
              <a href="https://covenantprotocol.io/demo/intro" style="color: #9a8060;">covenantprotocol.io</a>.
            </p>
            <p style="font-size: 14px; color: #999; margin-top: 32px;">— The Covenant Team</p>
          </div>
        `,
      }).catch(err => console.error('Waitlist confirmation email failed:', err));

      // Notification to admin
      resend.emails.send({
        from: 'Covenant Protocol <noreply@verify.covenantprotocol.io>',
        to: NOTIFY_EMAIL,
        subject: `New waitlist signup — ${name.trim()}`,
        html: `
          <div style="font-family: monospace; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
            <p style="font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: #9a8060;">Covenant — Waitlist</p>
            <table style="margin-top: 16px; border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 6px 0; color: #666; width: 120px;">Name</td><td style="padding: 6px 0;">${name.trim()}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Email</td><td style="padding: 6px 0;">${email.trim().toLowerCase()}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Type</td><td style="padding: 6px 0;">${typeLabel}</td></tr>
              ${org_name ? `<tr><td style="padding: 6px 0; color: #666;">Org</td><td style="padding: 6px 0;">${org_name.trim()}</td></tr>` : ''}
            </table>
          </div>
        `,
      }).catch(err => console.error('Waitlist notify email failed:', err));
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Waitlist error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
