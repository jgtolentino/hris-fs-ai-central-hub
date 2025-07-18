import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { supabase } from '../supabase';
import { TRPCError } from '@trpc/server';

export const hrRouter = router({
  // Employee management
  getEmployees: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      department: z.string().optional(),
      status: z.enum(['active', 'inactive', 'terminated']).optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('hr_admin.employees')
        .select('*, department:departments(*), position:positions(*)', { count: 'exact' });

      if (input.search) {
        query = query.or(`full_name.ilike.%${input.search}%,email.ilike.%${input.search}%,employee_id.ilike.%${input.search}%`);
      }

      if (input.department) {
        query = query.eq('department_id', input.department);
      }

      if (input.status) {
        query = query.eq('status', input.status);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((input.page - 1) * input.limit, input.page * input.limit - 1);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return {
        employees: data || [],
        total: count || 0,
        page: input.page,
        totalPages: Math.ceil((count || 0) / input.limit),
      };
    }),

  // Attendance tracking
  clockIn: protectedProcedure
    .input(z.object({
      latitude: z.number(),
      longitude: z.number(),
      office: z.string(),
      faceEncoding: z.any().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already clocked in
      const { data: existing } = await supabase
        .from('hr_admin.attendance')
        .select('id')
        .eq('employee_id', ctx.user.id)
        .eq('date', today)
        .single();

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Already clocked in for today',
        });
      }

      const { data, error } = await supabase
        .from('hr_admin.attendance')
        .insert({
          employee_id: ctx.user.id,
          date: today,
          clock_in: new Date().toISOString(),
          office_location: input.office,
          geo_location: { lat: input.latitude, lng: input.longitude },
          face_match: input.faceEncoding ? true : false,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data;
    }),

  clockOut: protectedProcedure
    .mutation(async ({ ctx }) => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('hr_admin.attendance')
        .update({ clock_out: new Date().toISOString() })
        .eq('employee_id', ctx.user.id)
        .eq('date', today)
        .is('clock_out', null)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      if (!data) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No active clock-in found' });

      return data;
    }),

  // Leave management
  requestLeave: protectedProcedure
    .input(z.object({
      leaveType: z.enum(['annual', 'sick', 'personal', 'maternity', 'paternity']),
      startDate: z.string(),
      endDate: z.string(),
      reason: z.string(),
      attachments: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await supabase
        .from('hr_admin.leave_requests')
        .insert({
          employee_id: ctx.user.id,
          leave_type: input.leaveType,
          start_date: input.startDate,
          end_date: input.endDate,
          reason: input.reason,
          attachments: input.attachments,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data;
    }),

  // Performance reviews
  getPerformanceReviews: protectedProcedure
    .input(z.object({
      employeeId: z.string().optional(),
      year: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      let query = supabase
        .from('hr_admin.performance_reviews')
        .select('*, employee:employees(*), reviewer:employees(*)');

      if (input.employeeId) {
        query = query.eq('employee_id', input.employeeId);
      } else {
        query = query.eq('employee_id', ctx.user.id);
      }

      if (input.year) {
        query = query.gte('review_period', `${input.year}-01-01`)
          .lte('review_period', `${input.year}-12-31`);
      }

      const { data, error } = await query.order('review_period', { ascending: false });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data || [];
    }),
});