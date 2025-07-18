import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { supabase } from './supabase'
import transactionsRouter from './routes/transactions'

// Load environment variables
dotenv.config({ path: '../../.env.local' })

const app = express()
const PORT = process.env.API_PORT || 4000

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' })) // Increase limit for image data
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes
app.use('/api', transactionsRouter)

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { error } = await supabase.from('profiles').select('count').limit(1)
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: error ? 'not configured' : 'connected',
      message: error ? 'Database tables need to be created' : 'All systems operational'
    })
  } catch (err) {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'error',
      message: 'Service is running but database connection failed'
    })
  }
})

// Auth endpoint (works without anon key)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  
  // For now, we'll use the service role key to authenticate
  // In production, you'd use the anon key for client auth
  try {
    const { data: user } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()
    
    if (user) {
      res.json({
        user,
        token: 'temp-token', // In production, generate proper JWT
        message: 'Login successful (using service role key)'
      })
    } else {
      res.status(401).json({ error: 'Invalid credentials' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication service unavailable' })
  }
})

// Expenses endpoints
app.get('/api/expenses', async (req, res) => {
  try {
    const { data: expenses, error } = await supabase
      .from('finance_expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) throw error
    
    res.json({ 
      expenses: expenses || [],
      total: expenses?.length || 0
    })
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to fetch expenses',
      details: error.message
    })
  }
})

app.post('/api/expenses', async (req, res) => {
  try {
    const expense = req.body
    
    const { data, error } = await supabase
      .from('finance_expenses')
      .insert({
        ...expense,
        profile_id: expense.profile_id || 'temp-user-id', // Would come from auth
        status: 'Submitted'
      })
      .select()
      .single()
    
    if (error) throw error
    
    res.json({ 
      success: true,
      expense: data
    })
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to create expense',
      details: error.message
    })
  }
})

// Attendance endpoints
app.post('/api/attendance/clock-in', async (req, res) => {
  try {
    const { latitude, longitude, office } = req.body
    
    const { data, error } = await supabase
      .from('hr_attendance')
      .insert({
        profile_id: 'temp-user-id', // Would come from auth
        date: new Date().toISOString().split('T')[0],
        clock_in: new Date().toISOString(),
        office_location: office,
        geo_location: { latitude, longitude },
        status: 'Present'
      })
      .select()
      .single()
    
    if (error) throw error
    
    res.json({ 
      success: true,
      attendance: data
    })
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to clock in',
      details: error.message
    })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 HRIS API Server Started!
==========================
  
Server running at: http://localhost:${PORT}
Health check: http://localhost:${PORT}/health

Available endpoints:
- GET  /health
- POST /api/auth/login
- GET  /api/expenses
- POST /api/expenses
- POST /api/attendance/clock-in
- POST /api/transactions (Edge devices)
- GET  /api/transactions (Analytics)
- GET  /api/transactions/:id (Specific transaction)

Note: Using service role key for all operations.
The anon key is needed for client-side auth.
  `)
})