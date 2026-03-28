import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { supabase } from '../supabase';
import { TRPCError } from '@trpc/server';

export const scoutRouter = router({
  // Campaign management
  getCampaigns: protectedProcedure
    .input(z.object({
      status: z.enum(['planning', 'active', 'completed', 'archived']).optional(),
      clientName: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('scout_dash.campaigns')
        .select('*');

      if (input.status) {
        query = query.eq('status', input.status);
      }

      if (input.clientName) {
        query = query.ilike('client_name', `%${input.clientName}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data || [];
    }),

  // Store analytics (Philippine retail)
  getStores: protectedProcedure
    .input(z.object({
      region: z.string().optional(),
      storeType: z.enum(['sari-sari', 'mall', 'department', 'supermarket', 'convenience']).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('scout_dash.stores')
        .select('*');

      if (input.region) {
        query = query.eq('region', input.region);
      }

      if (input.storeType) {
        query = query.eq('store_type', input.storeType);
      }

      if (input.search) {
        query = query.or(`store_name.ilike.%${input.search}%,store_code.ilike.%${input.search}%`);
      }

      const { data, error } = await query.order('store_name');

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data || [];
    }),

  // Transaction analytics
  getTransactionAnalytics: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      storeId: z.string().optional(),
      campaignId: z.string().optional(),
      groupBy: z.enum(['store', 'product', 'date', 'payment_method']),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.rpc('get_transaction_analytics', {
        start_date: input.startDate,
        end_date: input.endDate,
        store_id: input.storeId,
        campaign_id: input.campaignId,
        group_by: input.groupBy,
      });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data || [];
    }),

  // Handshake events tracking
  recordHandshake: protectedProcedure
    .input(z.object({
      campaignId: z.string(),
      consumerId: z.string().optional(),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      interactionType: z.string(),
      demographicData: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase
        .from('scout_dash.handshake_events')
        .insert({
          campaign_id: input.campaignId,
          consumer_id: input.consumerId,
          event_timestamp: new Date().toISOString(),
          location_data: {
            lat: input.location.latitude,
            lng: input.location.longitude,
          },
          interaction_type: input.interactionType,
          demographic_data: input.demographicData,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data;
    }),

  // Product performance
  getProductPerformance: protectedProcedure
    .input(z.object({
      productId: z.string().optional(),
      storeType: z.string().optional(),
      period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.rpc('get_product_performance', {
        product_id: input.productId,
        store_type: input.storeType,
        period: input.period,
      });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data || [];
    }),

  // Executive dashboard metrics
  getExecutiveDashboard: protectedProcedure
    .query(async () => {
      const { data, error } = await supabase
        .from('unified_platform.executive_dashboard')
        .select('*')
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      // Additional real-time metrics
      const [activeCampaigns, monthlyRevenue, storeCount] = await Promise.all([
        supabase.from('scout_dash.campaigns').select('count').eq('status', 'active'),
        supabase.rpc('get_monthly_revenue'),
        supabase.from('scout_dash.stores').select('count'),
      ]);

      return {
        ...data,
        realtime: {
          activeCampaigns: activeCampaigns.data?.[0]?.count || 0,
          monthlyRevenue: monthlyRevenue.data || 0,
          totalStores: storeCount.data?.[0]?.count || 0,
        },
      };
    }),

  // Regional insights (Philippine-specific)
  getRegionalInsights: protectedProcedure
    .input(z.object({
      region: z.string(),
      metric: z.enum(['sales', 'footfall', 'conversion', 'basket_size']),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.rpc('get_regional_insights', {
        region_name: input.region,
        metric_type: input.metric,
      });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return data || [];
    }),
});