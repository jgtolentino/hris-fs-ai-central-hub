import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { supabase } from '../supabase';

// Transaction item schema matching Raspberry Pi output
const TransactionItemSchema = z.object({
  brandName: z.string().nullable(),
  productName: z.string(),
  genericName: z.string().optional(),
  localName: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number(),
  unit: z.string(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  category: z.string(),
  isUnbranded: z.boolean(),
  isBulk: z.boolean(),
  detectionMethod: z.enum(['stt', 'ocr', 'cv', 'hybrid', 'manual']),
  confidence: z.number(),
  brandConfidence: z.number().optional(),
  suggestedBrands: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Main transaction schema from Raspberry Pi
const EdgeTransactionSchema = z.object({
  storeId: z.string(),
  deviceId: z.string(),
  timestamp: z.string(),
  transactionId: z.string(),
  items: z.array(TransactionItemSchema),
  totals: z.object({
    totalAmount: z.number(),
    totalItems: z.number(),
    brandedAmount: z.number(),
    unbrandedAmount: z.number(),
    brandedCount: z.number(),
    unbrandedCount: z.number(),
  }),
  insights: z.object({
    brandedVsUnbranded: z.object({
      brandedPercentage: z.number(),
      unbrandedPercentage: z.number(),
    }),
    topCategories: z.array(z.object({
      category: z.string(),
      count: z.number(),
      value: z.number(),
    })),
    suggestions: z.array(z.string()),
  }),
  paymentMethod: z.string(),
  processingTime: z.number(),
  edgeVersion: z.string(),
});

export const transactionRouter = router({
  // Endpoint for Raspberry Pi edge devices
  submitEdgeTransaction: publicProcedure
    .input(EdgeTransactionSchema)
    .mutation(async ({ input }) => {
      try {
        // Insert main transaction record
        const { data: transaction, error: transactionError } = await supabase
          .from('edge_transactions')
          .insert({
            id: input.transactionId,
            store_id: input.storeId,
            device_id: input.deviceId,
            timestamp: input.timestamp,
            total_amount: input.totals.totalAmount,
            total_items: input.totals.totalItems,
            branded_amount: input.totals.brandedAmount,
            unbranded_amount: input.totals.unbrandedAmount,
            branded_count: input.totals.brandedCount,
            unbranded_count: input.totals.unbrandedCount,
            payment_method: input.paymentMethod,
            processing_time: input.processingTime,
            edge_version: input.edgeVersion,
            insights: input.insights,
          })
          .select()
          .single();

        if (transactionError) {
          throw transactionError;
        }

        // Insert transaction items
        const itemsToInsert = input.items.map(item => ({
          transaction_id: input.transactionId,
          brand_name: item.brandName,
          product_name: item.productName,
          generic_name: item.genericName,
          local_name: item.localName,
          sku: item.sku,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          total_price: item.totalPrice,
          category: item.category,
          is_unbranded: item.isUnbranded,
          is_bulk: item.isBulk,
          detection_method: item.detectionMethod,
          confidence: item.confidence,
          brand_confidence: item.brandConfidence,
          suggested_brands: item.suggestedBrands,
          notes: item.notes,
        }));

        const { error: itemsError } = await supabase
          .from('edge_transaction_items')
          .insert(itemsToInsert);

        if (itemsError) {
          throw itemsError;
        }

        // Update store analytics
        await supabase.rpc('update_store_analytics', {
          p_store_id: input.storeId,
          p_transaction_data: input,
        });

        return {
          success: true,
          transactionId: input.transactionId,
          message: 'Transaction processed successfully',
        };
      } catch (error) {
        console.error('Transaction processing error:', error);
        throw new Error('Failed to process transaction');
      }
    }),

  // Get transactions for a specific store
  getStoreTransactions: protectedProcedure
    .input(z.object({
      storeId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('edge_transactions')
        .select(`
          *,
          edge_transaction_items (*)
        `)
        .eq('store_id', input.storeId)
        .order('timestamp', { ascending: false });

      if (input.startDate) {
        query = query.gte('timestamp', input.startDate);
      }

      if (input.endDate) {
        query = query.lte('timestamp', input.endDate);
      }

      const { data, error } = await query
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw error;
      }

      return data;
    }),

  // Get analytics for branded vs unbranded products
  getBrandAnalytics: protectedProcedure
    .input(z.object({
      storeId: z.string().optional(),
      timeRange: z.enum(['day', 'week', 'month', 'quarter']).default('week'),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.rpc('get_brand_analytics', {
        p_store_id: input.storeId,
        p_time_range: input.timeRange,
      });

      if (error) {
        throw error;
      }

      return data;
    }),

  // Get top categories across all stores
  getTopCategories: protectedProcedure
    .input(z.object({
      timeRange: z.enum(['day', 'week', 'month']).default('week'),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.rpc('get_top_categories', {
        p_time_range: input.timeRange,
        p_limit: input.limit,
      });

      if (error) {
        throw error;
      }

      return data;
    }),

  // Get real-time transaction stream
  getTransactionStream: protectedProcedure
    .input(z.object({
      storeId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let query = supabase
        .from('edge_transactions')
        .select(`
          id,
          store_id,
          device_id,
          timestamp,
          total_amount,
          total_items,
          branded_count,
          unbranded_count
        `)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (input.storeId) {
        query = query.eq('store_id', input.storeId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data;
    }),

  // Get detection method effectiveness
  getDetectionAnalytics: protectedProcedure
    .input(z.object({
      storeId: z.string().optional(),
      timeRange: z.enum(['day', 'week', 'month']).default('week'),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.rpc('get_detection_analytics', {
        p_store_id: input.storeId,
        p_time_range: input.timeRange,
      });

      if (error) {
        throw error;
      }

      return data;
    }),

  // Get insights and suggestions
  getTransactionInsights: protectedProcedure
    .input(z.object({
      storeId: z.string(),
      timeRange: z.enum(['day', 'week', 'month']).default('week'),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.rpc('get_transaction_insights', {
        p_store_id: input.storeId,
        p_time_range: input.timeRange,
      });

      if (error) {
        throw error;
      }

      return data;
    }),

  // Get unbranded product opportunities
  getUnbrandedOpportunities: protectedProcedure
    .input(z.object({
      storeId: z.string().optional(),
      category: z.string().optional(),
      minVolume: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase.rpc('get_unbranded_opportunities', {
        p_store_id: input.storeId,
        p_category: input.category,
        p_min_volume: input.minVolume,
      });

      if (error) {
        throw error;
      }

      return data;
    }),
});