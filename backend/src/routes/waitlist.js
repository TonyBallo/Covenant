import express from 'express';
import rateLimit from 'express-rate-limit';
import { supabase } from '../server.js';

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

    return res.json({ success: true });
  } catch (err) {
    console.error('Waitlist error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
