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
