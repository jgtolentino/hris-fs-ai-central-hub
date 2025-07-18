#!/bin/bash

# Bootstrap script to create sample files for immediate development
# Run this AFTER scaffold-monorepo.sh

set -e

echo "🚀 Creating bootstrap sample files..."

# Create shared Button component
cat > shared/components/ui/Button.tsx << 'EOF'
import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native'
import { cn } from '@shared/lib/utils'

interface ButtonProps {
  onPress: () => void
  title: string
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle
}: ButtonProps) {
  const baseStyle = 'rounded-lg items-center justify-center'
  
  const variants = {
    primary: 'bg-tbwa-yellow',
    secondary: 'bg-gray-200 dark:bg-gray-700',
    danger: 'bg-red-500'
  }
  
  const sizes = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4'
  }
  
  const textVariants = {
    primary: 'text-black font-semibold',
    secondary: 'text-gray-800 dark:text-gray-200',
    danger: 'text-white font-semibold'
  }
  
  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        style,
        { opacity: disabled || loading ? 0.6 : 1 }
      ]}
      className={cn(baseStyle, variants[variant], sizes[size])}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#000' : '#fff'} />
      ) : (
        <Text 
          style={textStyle}
          className={cn(textVariants[variant], textSizes[size])}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

// Web-compatible version
export function WebButton(props: ButtonProps) {
  // Implementation for web using regular button element
  return <Button {...props} />
}
EOF

# Create shared ExpenseCard component
cat > shared/components/ui/ExpenseCard.tsx << 'EOF'
import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { formatCurrency, formatDate } from '@shared/lib/formatters'

interface ExpenseCardProps {
  expense: {
    id: string
    merchant_name: string
    amount: number
    expense_date: string
    expense_category: string
    status: 'Pending' | 'Approved' | 'Rejected'
    receipt_url?: string
  }
  onPress?: () => void
}

export function ExpenseCard({ expense, onPress }: ExpenseCardProps) {
  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-green-100 text-green-800',
    Rejected: 'bg-red-100 text-red-800'
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            {expense.merchant_name}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {expense.expense_category}
          </Text>
        </View>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(expense.amount)}
        </Text>
      </View>
      
      <View className="flex-row justify-between items-center">
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          {formatDate(expense.expense_date)}
        </Text>
        <View className={`px-3 py-1 rounded-full ${statusColors[expense.status]}`}>
          <Text className="text-xs font-medium">{expense.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
EOF

# Create shared utils
cat > shared/lib/utils/cn.ts << 'EOF'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

cat > shared/lib/formatters.ts << 'EOF'
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(
  date: Date | string,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
  }[format]
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj)
}

export function formatDateTime(
  date: Date | string,
  includeSeconds: boolean = false
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
  }).format(dateObj)
}
EOF

# Create API router with sample endpoints
cat > backend/api/src/router.ts << 'EOF'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
import { createContext } from './context'

const t = initTRPC.context<typeof createContext>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Unauthorized')
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})

// Expense procedures
const expenseRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      status: z.enum(['All', 'Pending', 'Approved', 'Rejected']).optional()
    }))
    .query(async ({ ctx, input }) => {
      // Fetch expenses from database
      const expenses = await ctx.db.expense.findMany({
        where: {
          user_id: ctx.user.id,
          ...(input.status && input.status !== 'All' ? { status: input.status } : {})
        },
        take: input.limit,
        skip: input.offset,
        orderBy: { created_at: 'desc' }
      })
      
      return {
        items: expenses,
        total: await ctx.db.expense.count({ where: { user_id: ctx.user.id } })
      }
    }),
    
  create: protectedProcedure
    .input(z.object({
      merchant_name: z.string(),
      amount: z.number().positive(),
      expense_date: z.string(),
      expense_category: z.string(),
      description: z.string().optional(),
      receipt_data: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.db.expense.create({
        data: {
          ...input,
          user_id: ctx.user.id,
          status: 'Pending'
        }
      })
      
      return expense
    })
})

// Attendance procedures
const attendanceRouter = router({
  clockIn: protectedProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      office: z.string(),
      selfie_data: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const attendance = await ctx.db.attendance.create({
        data: {
          user_id: ctx.user.id,
          date: new Date().toISOString(),
          clock_in: new Date().toISOString(),
          ...input
        }
      })
      
      return attendance
    }),
    
  clockOut: protectedProcedure
    .mutation(async ({ ctx }) => {
      const today = new Date().toISOString().split('T')[0]
      
      const attendance = await ctx.db.attendance.update({
        where: {
          user_id_date: {
            user_id: ctx.user.id,
            date: today
          }
        },
        data: {
          clock_out: new Date().toISOString()
        }
      })
      
      return attendance
    })
})

// AI Agent procedures
const agentRouter = router({
  chat: protectedProcedure
    .input(z.object({
      agent: z.enum(['maya', 'learnbot', 'yayo']),
      message: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      // Route to appropriate agent
      const agentModule = await import(`../agents/${input.agent}`)
      const agent = new agentModule.default()
      
      const response = await agent.processQuery(input.message)
      
      return {
        agent: input.agent,
        response,
        timestamp: new Date().toISOString()
      }
    })
})

// Main app router
export const appRouter = router({
  expense: expenseRouter,
  attendance: attendanceRouter,
  agent: agentRouter,
  
  // Health check
  health: publicProcedure.query(() => ({
    status: 'ok',
    timestamp: new Date().toISOString()
  }))
})

export type AppRouter = typeof appRouter
EOF

# Create context for tRPC
cat > backend/api/src/context.ts << 'EOF'
import { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone'
import { supabase } from './supabase'

export async function createContext({ req }: CreateHTTPContextOptions) {
  // Get auth token from header
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  let user = null
  if (token) {
    const { data } = await supabase.auth.getUser(token)
    user = data.user
  }
  
  return {
    user,
    db: {
      expense: {
        findMany: async (args: any) => {
          const { data } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', args.where.user_id)
            .order('created_at', { ascending: false })
            .range(args.skip, args.skip + args.take - 1)
          
          return data || []
        },
        count: async (args: any) => {
          const { count } = await supabase
            .from('expenses')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', args.where.user_id)
          
          return count || 0
        },
        create: async (args: any) => {
          const { data } = await supabase
            .from('expenses')
            .insert(args.data)
            .select()
            .single()
          
          return data
        }
      },
      attendance: {
        create: async (args: any) => {
          const { data } = await supabase
            .from('attendance')
            .insert(args.data)
            .select()
            .single()
          
          return data
        },
        update: async (args: any) => {
          const { data } = await supabase
            .from('attendance')
            .update(args.data)
            .eq('user_id', args.where.user_id_date.user_id)
            .eq('date', args.where.user_id_date.date)
            .select()
            .single()
          
          return data
        }
      }
    }
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
EOF

# Create agent YAML configurations
mkdir -p backend/agents/configs

cat > backend/agents/configs/maya.yaml << 'EOF'
agent:
  name: Maya
  version: "1.0.0"
  description: Documentation and SOP Assistant
  avatar: "🤖"
  
capabilities:
  - document_search
  - sop_guidance
  - policy_clarification
  - form_assistance
  - process_explanation
  
config:
  model: claude-3-sonnet
  temperature: 0.3
  max_tokens: 2000
  
prompts:
  system: |
    You are Maya, the documentation and SOP assistant for HRIS-FS-AI Central Hub.
    Your role is to help employees understand policies, procedures, and documentation.
    Always be helpful, accurate, and cite specific documents when possible.
    
  examples:
    - user: "How do I submit an expense report?"
      assistant: "To submit an expense report, follow these steps:
        1. Open the Expenses tab in the mobile app
        2. Tap 'New Expense'
        3. Take a photo of your receipt
        4. Fill in the merchant name, amount, and category
        5. Add any notes if needed
        6. Tap 'Submit for Approval'
        
        The receipt will be processed by OCR automatically. Your manager will be notified for approval."
        
    - user: "What's the policy on remote work?"
      assistant: "According to the Remote Work Policy (RWP-2024):
        - Employees can work remotely up to 3 days per week
        - Must maintain core hours of 10 AM - 3 PM in their timezone
        - Requires manager approval
        - Must use company VPN for data access
        
        Would you like me to help you submit a remote work request?"
        
integrations:
  - knowledge_base: supabase
  - document_store: confluence
  - policy_engine: internal
EOF

cat > backend/agents/configs/learnbot.yaml << 'EOF'
agent:
  name: LearnBot
  version: "1.0.0"
  description: Training and Onboarding Assistant
  avatar: "🎓"
  
capabilities:
  - interactive_tutorials
  - feature_walkthroughs
  - best_practices
  - skill_assessment
  - learning_paths
  
config:
  model: claude-3-sonnet
  temperature: 0.7
  max_tokens: 2500
  
learning_modules:
  onboarding:
    - welcome_to_hris
    - navigation_basics
    - submitting_first_expense
    - time_tracking_101
    - using_ai_assistants
    
  advanced:
    - bulk_expense_processing
    - team_management
    - report_generation
    - workflow_automation
    
prompts:
  system: |
    You are LearnBot, the training and learning assistant.
    Your goal is to help users master the HRIS platform through interactive learning.
    Use encouraging language, provide step-by-step guidance, and celebrate progress.
    
  tutorial_template: |
    📚 {module_name}
    
    Learning Objectives:
    {objectives}
    
    Steps:
    {steps}
    
    ✅ Practice Exercise:
    {exercise}
    
    🎉 Great job! You've completed this module.
    
gamification:
  badges:
    - first_expense: "Expense Explorer"
    - week_streak: "Consistency Champion"
    - help_colleague: "Team Player"
  
  points:
    tutorial_complete: 10
    perfect_week: 50
    feature_mastery: 25
EOF

cat > backend/agents/configs/yayo.yaml << 'EOF'
agent:
  name: YaYo
  version: "1.0.0"
  description: UX/UI Optimization Agent
  avatar: "🎨"
  
capabilities:
  - ui_tips
  - workflow_optimization
  - accessibility_guidance
  - personalization_suggestions
  - usability_insights
  
config:
  model: claude-3-sonnet
  temperature: 0.8
  max_tokens: 1500
  
optimization_areas:
  - navigation_efficiency
  - form_completion_time
  - error_reduction
  - feature_discovery
  - user_satisfaction
  
prompts:
  system: |
    You are YaYo, the UX/UI optimization assistant.
    You help users work more efficiently by suggesting interface improvements and shortcuts.
    Be friendly, creative, and always focus on saving user time and reducing friction.
    
  suggestions:
    - context: "User spent >30s on expense form"
      tip: "💡 Quick tip: Use the camera button to auto-fill expense details with OCR!"
      
    - context: "User navigated back 3+ times"
      tip: "🎯 Try using the quick actions menu (swipe right) for faster navigation!"
      
    - context: "Dark mode available"
      tip: "🌙 Working late? Enable dark mode in Settings for easier viewing!"
      
personalization:
  track_metrics:
    - avg_task_completion_time
    - error_frequency
    - feature_usage
    - navigation_patterns
    
  adapt_suggestions:
    - beginner: focus_on_basics
    - intermediate: introduce_shortcuts
    - advanced: power_user_features
EOF

cat > backend/agents/configs/jason-ocr.yaml << 'EOF'
agent:
  name: Jason OCR
  version: "1.0.0"
  description: Intelligent Document Processing Agent
  avatar: "📸"
  
capabilities:
  - receipt_scanning
  - invoice_processing
  - document_extraction
  - handwriting_recognition
  - multi_language_ocr
  
config:
  model: jason-ocr-v3
  confidence_threshold: 0.85
  supported_formats:
    - jpeg
    - png
    - pdf
    - heic
    
processing_pipeline:
  1_preprocessing:
    - image_enhancement
    - noise_reduction
    - perspective_correction
    - contrast_adjustment
    
  2_detection:
    - text_region_detection
    - table_structure_recognition
    - logo_identification
    
  3_extraction:
    - merchant_name
    - total_amount
    - line_items
    - tax_amount
    - date_time
    - payment_method
    
  4_validation:
    - amount_verification
    - date_sanity_check
    - merchant_database_lookup
    
  5_enhancement:
    - category_suggestion
    - expense_policy_check
    - duplicate_detection
    
output_schema:
  receipt:
    merchant_name: string
    merchant_address: string
    transaction_date: date
    total_amount: number
    subtotal: number
    tax_amount: number
    tip_amount: number
    payment_method: string
    line_items:
      - description: string
        quantity: number
        unit_price: number
        total_price: number
    confidence_scores:
      overall: number
      merchant: number
      amount: number
      date: number
      
integrations:
  - expense_categories: auto_categorization
  - policy_engine: compliance_check
  - accounting_codes: gl_mapping
EOF

# Create sample test data
cat > backend/db/seed-data.ts << 'EOF'
export const sampleExpenses = [
  {
    id: '1',
    user_id: 'user123',
    merchant_name: 'Starbucks',
    amount: 15.50,
    expense_date: '2024-01-15',
    expense_category: 'Meals',
    status: 'Approved',
    receipt_url: 'https://example.com/receipt1.jpg',
    description: 'Client meeting coffee'
  },
  {
    id: '2',
    user_id: 'user123',
    merchant_name: 'Uber',
    amount: 35.00,
    expense_date: '2024-01-16',
    expense_category: 'Transportation',
    status: 'Pending',
    receipt_url: 'https://example.com/receipt2.jpg',
    description: 'Airport to office'
  },
  {
    id: '3',
    user_id: 'user123',
    merchant_name: 'Marriott Hotel',
    amount: 250.00,
    expense_date: '2024-01-14',
    expense_category: 'Accommodation',
    status: 'Approved',
    receipt_url: 'https://example.com/receipt3.jpg',
    description: 'Business trip - NYC'
  }
]

export const sampleAttendance = [
  {
    id: '1',
    user_id: 'user123',
    date: '2024-01-17',
    clock_in: '2024-01-17T09:00:00Z',
    clock_out: '2024-01-17T18:00:00Z',
    office: 'Manila',
    status: 'Present'
  },
  {
    id: '2',
    user_id: 'user123',
    date: '2024-01-16',
    clock_in: '2024-01-16T08:45:00Z',
    clock_out: '2024-01-16T17:30:00Z',
    office: 'Manila',
    status: 'Present'
  }
]

export const sampleTickets = [
  {
    id: '1',
    user_id: 'user123',
    title: 'New laptop request',
    category: 'IT',
    priority: 'Medium',
    status: 'Open',
    description: 'Current laptop is 4 years old and running slow'
  },
  {
    id: '2',
    user_id: 'user123',
    title: 'Update emergency contact',
    category: 'HR',
    priority: 'Low',
    status: 'Resolved',
    description: 'Need to update spouse phone number'
  }
]
EOF

# Create mobile app sample screen
cat > apps/mobile/app/screens/DashboardScreen.tsx << 'EOF'
import React from 'react'
import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, ExpenseCard } from '@shared/components/ui'
import { useExpenses } from '@shared/hooks/useExpenses'
import { useAuth } from '@shared/hooks/useAuth'
import { formatCurrency } from '@shared/lib/formatters'

export function DashboardScreen() {
  const { user } = useAuth()
  const { expenses, isLoading, refetch } = useExpenses({ limit: 5 })
  
  const totalPending = expenses
    ?.filter(e => e.status === 'Pending')
    .reduce((sum, e) => sum + e.amount, 0) || 0

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View className="px-4 py-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name || 'Employee'}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 mt-1">
            Here's your activity summary
          </Text>
        </View>
        
        {/* Stats Cards */}
        <View className="px-4 mb-6">
          <View className="bg-tbwa-yellow rounded-lg p-4 mb-3">
            <Text className="text-sm font-medium text-black/70">
              Pending Expenses
            </Text>
            <Text className="text-2xl font-bold text-black mt-1">
              {formatCurrency(totalPending)}
            </Text>
          </View>
          
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4">
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                This Month
              </Text>
              <Text className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(1250.50)}
              </Text>
            </View>
            <View className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4">
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Days Present
              </Text>
              <Text className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                15/20
              </Text>
            </View>
          </View>
        </View>
        
        {/* Recent Expenses */}
        <View className="px-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Expenses
            </Text>
            <Button
              title="View All"
              variant="secondary"
              size="sm"
              onPress={() => {}}
            />
          </View>
          
          {expenses?.slice(0, 5).map(expense => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onPress={() => {}}
            />
          ))}
        </View>
        
        {/* Quick Actions */}
        <View className="px-4 py-6">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Quick Actions
          </Text>
          <View className="gap-3">
            <Button
              title="Submit New Expense"
              variant="primary"
              onPress={() => {}}
            />
            <Button
              title="Clock In/Out"
              variant="secondary"
              onPress={() => {}}
            />
            <Button
              title="Ask AI Assistant"
              variant="secondary"
              onPress={() => {}}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
EOF

# Create hooks
cat > shared/hooks/useExpenses.ts << 'EOF'
import { useQuery } from '@tanstack/react-query'
import { trpc } from '@shared/lib/trpc'

interface UseExpensesOptions {
  limit?: number
  offset?: number
  status?: 'All' | 'Pending' | 'Approved' | 'Rejected'
}

export function useExpenses(options: UseExpensesOptions = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', options],
    queryFn: () => trpc.expense.list.query(options)
  })

  return {
    expenses: data?.items,
    total: data?.total,
    isLoading,
    error,
    refetch
  }
}
EOF

cat > shared/hooks/useAuth.ts << 'EOF'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: 'employee' | 'manager' | 'admin'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User, token: string) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        // Implement login logic
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        
        if (response.ok) {
          const { user, token } = await response.json()
          set({ user, token, isAuthenticated: true })
        } else {
          throw new Error('Login failed')
        }
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },
      
      setUser: (user, token) => {
        set({ user, token, isAuthenticated: true })
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)
EOF

echo "✅ Bootstrap samples created successfully!"
echo ""
echo "Sample files created:"
echo "  - Shared UI components (Button, ExpenseCard)"
echo "  - API router with tRPC endpoints"
echo "  - AI agent YAML configurations"
echo "  - Sample test data"
echo "  - Mobile dashboard screen"
echo "  - React hooks for data fetching"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Start development: npm run dev"
echo "3. Check apps at:"
echo "   - Mobile: Expo app"
echo "   - Web Admin: http://localhost:3001"
echo "   - API: http://localhost:4000"