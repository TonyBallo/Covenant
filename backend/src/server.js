import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import kycRoutes from './routes/kyc.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Required for express-rate-limit to read real IP behind Railway's reverse proxy
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://covenant-sigma.vercel.app',
    'https://covenant-lookup.vercel.app',
    /\.vercel\.app$/  // Allow all Vercel preview deployments
  ],
  allowedHeaders: ['Content-Type', 'x-admin-secret'],
  credentials: true
}));
app.use(express.json());

// Initialize Supabase client using the service key (bypasses row-level security —
// required for server-side writes. Never expose this key to the frontend.)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// Routes
app.use('/api/kyc', kycRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message 
  });
});

// Hourly cleanup: deletes submissions where the user never clicked the verification
// email link. Keeps the database free of abandoned applications and limits exposure
// of unverified personal data.
setInterval(async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { error } = await supabase
      .from('kyc_submissions')
      .delete()
      .eq('email_verified', false)
      .lt('submitted_at', oneHourAgo.toISOString());
    
    if (error) {
      console.error('Cleanup job failed:', error);
    } else {
      console.log(`🧹 Cleanup: Removed unverified submissions older than 1 hour`);
    }
  } catch (err) {
    console.error('Cleanup job error:', err);
  }
}, 60 * 60 * 1000); // Every hour

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Covenant Backend running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.SUPABASE_URL}`);
  console.log(`⛓️  Contract: ${process.env.CONTRACT_ADDRESS}`);
  console.log(`
Available endpoints:
  GET  /health
  
  KYC Routes:
  POST /api/kyc/submit (rate limited: 3/15min per IP)
  GET  /api/kyc/verify/:token
  GET  /api/kyc/status/:address
  
  Admin Routes:
  GET  /api/admin/pending
  POST /api/admin/approve/:id
  POST /api/admin/reject/:id
  POST /api/admin/mint
  POST /api/admin/revoke
  GET  /api/admin/ready-to-mint
  `);
});
