import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './context';

// Load environment variables
dotenv.config({ path: '../../.env.local' });

const app = express();
const PORT = process.env.API_PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for image data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// tRPC middleware
app.use('/trpc', createExpressMiddleware({
  router: appRouter,
  createContext,
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Direct REST endpoint for Raspberry Pi edge devices
app.post('/api/transactions', async (req, res) => {
  try {
    // Forward to tRPC transaction router
    const caller = appRouter.createCaller({
      user: null, // Public endpoint
      session: null,
    });
    
    const result = await caller.transaction.submitEdgeTransaction(req.body);
    res.json(result);
  } catch (error) {
    console.error('Transaction API error:', error);
    res.status(500).json({ 
      error: 'Failed to process transaction',
      details: error.message 
    });
  }
});

// Legacy REST endpoints for backward compatibility
app.post('/api/auth/login', async (req, res) => {
  try {
    const caller = appRouter.createCaller({
      user: null,
      session: null,
    });
    
    const result = await caller.auth.signIn(req.body);
    res.json(result);
  } catch (error) {
    console.error('Auth API error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 HRIS API Server Started!
==========================
  
Server running at: http://localhost:${PORT}
Health check: http://localhost:${PORT}/health
tRPC endpoint: http://localhost:${PORT}/trpc

Available endpoints:
- GET  /health
- POST /api/transactions (Edge devices)
- POST /api/auth/login (Legacy)
- /trpc/* (All tRPC procedures)

tRPC Routers:
- auth.* (Authentication)
- hr.* (Human Resources)
- finance.* (Financial Operations)
- scout.* (Analytics & Insights)
- transaction.* (Edge Transactions)
- operations.* (Project Management)
- corporate.* (Corporate Operations)
- creative.* (Creative Operations)

Edge Transaction Processing:
- Raspberry Pi devices POST to /api/transactions
- STT and OpenCV processing results
- Branded/unbranded product detection
- Real-time analytics and insights
  `);
});

export default app;