import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { supabase } from '../supabase';
import { TRPCError } from '@trpc/server';

export const financeRouter = router({
  // Expense management
  submitExpense: protectedProcedure
    .input(z.object({
      merchantName: z.string(),
      amount: z.number().positive(),
      currency: z.string().default('PHP'),
      category: z.enum(['travel', 'meals', 'accommodation', 'transport', 'supplies', 'other']),
      description: z.string(),
      receiptUrl: z.string().optional(),
      projectId: z.string().optional(),
      tripId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check policy violations
      const violations = await checkExpensePolicies(input, ctx.user.id);

      const { data, error } = await supabase
        .from('financial_ops.expenses')
        .insert({
          employee_id: ctx.user.id,
          merchant_name: input.merchantName,
          amount: input.amount,
          currency: input.currency,
          expense_category: input.category,
          description: input.description,
          receipt_url: input.receiptUrl,
          project_id: input.projectId,
          business_trip_id: input.tripId,
          policy_violations: violations,
          status: violations.length > 0 ? 'flagged' : 'submitted',
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      // Create audit log
      await supabase.from('financial_ops.expense_audit_log').insert({
        expense_id: data.id,
        action: 'created',
        performed_by: ctx.user.id,
        details: { violations },
      });

      return data;
    }),

  getExpenses: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      status: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      let query = supabase
        .from('financial_ops.expenses')
        .select('*, employee:employees(*), approvals(*)', { count: 'exact' });

      // Manager sees team expenses, employee sees own
      if (ctx.user.role !== 'manager') {
        query = query.eq('employee_id', ctx.user.id);
      }

      if (input.status) {
        query = query.eq('status', input.status);
      }

      if (input.startDate) {
        query = query.gte('expense_date', input.startDate);
      }

      if (input.endDate) {
        query = query.lte('expense_date', input.endDate);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((input.page - 1) * input.limit, input.page * input.limit - 1);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return {
        expenses: data || [],
        total: count || 0,
        page: input.page,
        totalPages: Math.ceil((count || 0) / input.limit),
      };
    }),

  approveExpense: protectedProcedure
    .input(z.object({
      expenseId: z.string(),
      action: z.enum(['approve', 'reject']),
      comments: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify manager role
      if (ctx.user.role !== 'manager' && ctx.user.role !== 'finance') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to approve expenses' });
      }

      const { data: expense } = await supabase
        .from('financial_ops.expenses')
        .select('*')
        .eq('id', input.expenseId)
        .single();

      if (!expense) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Expense not found' });
      }

      // Update expense status
      const newStatus = input.action === 'approve' ? 'approved' : 'rejected';
      await supabase
        .from('financial_ops.expenses')
        .update({ status: newStatus })
        .eq('id', input.expenseId);

      // Create approval record
      const { data: approval } = await supabase
        .from('financial_ops.expense_approvals')
        .insert({
          expense_id: input.expenseId,
          approver_id: ctx.user.id,
          action: input.action,
          comments: input.comments,
        })
        .select()
        .single();

      // Audit log
      await supabase.from('financial_ops.expense_audit_log').insert({
        expense_id: input.expenseId,
        action: input.action,
        performed_by: ctx.user.id,
        details: { comments: input.comments },
      });

      return approval;
    }),

  // Budget management
  getBudgets: protectedProcedure
    .input(z.object({
      departmentId: z.string().optional(),
      year: z.number().default(new Date().getFullYear()),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('financial_ops.budgets')
        .select('*, department:departments(*), account:accounts(*)');

      if (input.departmentId) {
        query = query.eq('department_id', input.departmentId);
      }

      query = query.eq('fiscal_year', input.year);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data || [];
    }),

  // Financial analytics
  getExpenseAnalytics: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      groupBy: z.enum(['category', 'department', 'employee', 'month']),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.rpc('get_expense_analytics', {
        start_date: input.startDate,
        end_date: input.endDate,
        group_by: input.groupBy,
      });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data || [];
    }),
});

async function checkExpensePolicies(expense: any, employeeId: string): Promise<any[]> {
  const violations = [];

  // Get active policies
  const { data: policies } = await supabase
    .from('financial_ops.expense_policies')
    .select('*')
    .eq('is_active', true);

  for (const policy of policies || []) {
    // Check daily limit
    if (policy.max_amount_per_day) {
      const { data: todayExpenses } = await supabase
        .from('financial_ops.expenses')
        .select('amount')
        .eq('employee_id', employeeId)
        .eq('expense_date', new Date().toISOString().split('T')[0]);

      const todayTotal = todayExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
      if (todayTotal + expense.amount > policy.max_amount_per_day) {
        violations.push({
          policy: 'daily_limit',
          message: `Exceeds daily limit of ${policy.max_amount_per_day}`,
        });
      }
    }

    // Check category limits
    if (policy.category_limits?.[expense.category]) {
      if (expense.amount > policy.category_limits[expense.category]) {
        violations.push({
          policy: 'category_limit',
          message: `Exceeds ${expense.category} limit of ${policy.category_limits[expense.category]}`,
        });
      }
    }

    // Check receipt requirement
    if (policy.requires_receipt_above && expense.amount > policy.requires_receipt_above && !expense.receiptUrl) {
      violations.push({
        policy: 'receipt_required',
        message: `Receipt required for amounts above ${policy.requires_receipt_above}`,
      });
    }
  }

  return violations;
}