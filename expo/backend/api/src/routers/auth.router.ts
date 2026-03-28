import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { supabase } from '../supabase';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  signUp: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      fullName: z.string(),
      department: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.fullName,
            department: input.department,
          }
        }
      });

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        });
      }

      return {
        user: data.user,
        session: data.session,
      };
    }),

  signIn: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: error.message,
        });
      }

      return {
        user: data.user,
        session: data.session,
      };
    }),

  signOut: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return { success: true };
    }),

  getSession: publicProcedure
    .query(async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return session;
    }),

  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ctx.user.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Profile not found',
        });
      }

      return data;
    }),
});