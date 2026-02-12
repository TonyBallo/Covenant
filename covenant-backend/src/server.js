import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import kycRoutes from './routes/kyc.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://covenant-sigma.vercel.app',
    'https://covenant-lookup.vercel.app',
    /\.vercel\.app$/  // Allow all Vercel preview deployments
  ],
  credentials: true
}));
app.use(express.json());

// Initialize Supabase client
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Covenant Backend running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.SUPABASE_URL}`);
  console.log(`⛓️  Contract: ${process.env.CONTRACT_ADDRESS}`);
  console.log(`
Available endpoints:
  GET  /health
  
  KYC Routes:
  POST /api/kyc/submit
  GET  /api/kyc/status/:address
  
  Admin Routes:
  GET  /api/admin/pending
  POST /api/admin/approve/:id
  POST /api/admin/mint
  POST /api/admin/revoke
  GET  /api/admin/ready-to-mint
  `);
});
