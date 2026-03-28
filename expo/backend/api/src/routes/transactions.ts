import { Router } from 'express';
import { z } from 'zod';
import { createSupabaseClient } from '../supabase';
import { Request, Response } from 'express';

const router = Router();

// Validation schemas matching the Raspberry Pi processor output
const TransactionItemSchema = z.object({
  brandName: z.string().nullable(),
  productName: z.string(),
  genericName: z.string().nullable(),
  localName: z.string().nullable(),
  sku: z.string().nullable(),
  quantity: z.number().positive(),
  unit: z.string(),
  unitPrice: z.number().positive(),
  totalPrice: z.number().positive(),
  category: z.string(),
  isUnbranded: z.boolean(),
  isBulk: z.boolean(),
  detectionMethod: z.enum(['stt', 'ocr', 'cv', 'manual', 'hybrid']),
  confidence: z.number().min(0).max(1),
  brandConfidence: z.number().min(0).max(1).optional(),
  suggestedBrands: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const TransactionSchema = z.object({
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

// POST /api/transactions - Receive transaction from Raspberry Pi
router.post('/transactions', async (req: Request, res: Response) => {
  try {
    console.log('📊 Received transaction from edge device:', req.body.deviceId);
    
    // Validate incoming data
    const validatedData = TransactionSchema.parse(req.body);
    const supabase = createSupabaseClient();
    
    // Store main transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('scout_dash.transactions')
      .insert({
        transaction_id: validatedData.transactionId,
        store_id: validatedData.storeId,
        device_id: validatedData.deviceId,
        timestamp: validatedData.timestamp,
        total_amount: validatedData.totals.totalAmount,
        total_items: validatedData.totals.totalItems,
        branded_amount: validatedData.totals.brandedAmount,
        unbranded_amount: validatedData.totals.unbrandedAmount,
        branded_count: validatedData.totals.brandedCount,
        unbranded_count: validatedData.totals.unbrandedCount,
        payment_method: validatedData.paymentMethod,
        processing_time: validatedData.processingTime,
        edge_version: validatedData.edgeVersion,
        insights: validatedData.insights,
        raw_data: validatedData, // Store complete JSON for analysis
      })
      .select()
      .single();

    if (transactionError) {
      console.error('❌ Transaction insert error:', transactionError);
      return res.status(500).json({ 
        error: 'Failed to store transaction',
        details: transactionError.message 
      });
    }

    // Store individual items
    const itemsToInsert = validatedData.items.map(item => ({
      transaction_id: validatedData.transactionId,
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
      .from('scout_dash.transaction_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('❌ Transaction items insert error:', itemsError);
      return res.status(500).json({ 
        error: 'Failed to store transaction items',
        details: itemsError.message 
      });
    }

    // Update store analytics in real-time
    await updateStoreAnalytics(supabase, validatedData.storeId, validatedData);

    // Trigger real-time analytics processing
    await processRealTimeAnalytics(supabase, validatedData);

    console.log('✅ Transaction processed successfully:', validatedData.transactionId);
    
    res.json({ 
      success: true, 
      transactionId: validatedData.transactionId,
      message: 'Transaction processed successfully',
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Transaction processing error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid transaction data',
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/transactions - Get transactions with filters
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const supabase = createSupabaseClient();
    
    const { 
      storeId, 
      deviceId, 
      startDate, 
      endDate, 
      limit = 50, 
      offset = 0 
    } = req.query;

    let query = supabase
      .from('scout_dash.transactions')
      .select(`
        *,
        transaction_items (*)
      `)
      .order('timestamp', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    // Apply filters
    if (storeId) query = query.eq('store_id', storeId);
    if (deviceId) query = query.eq('device_id', deviceId);
    if (startDate) query = query.gte('timestamp', startDate);
    if (endDate) query = query.lte('timestamp', endDate);

    const { data, error } = await query;

    if (error) {
      console.error('❌ Query error:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }

    res.json({
      transactions: data,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: data?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/transactions/:id - Get specific transaction
router.get('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const supabase = createSupabaseClient();
    const { id } = req.params;

    const { data, error } = await supabase
      .from('scout_dash.transactions')
      .select(`
        *,
        transaction_items (*)
      `)
      .eq('transaction_id', id)
      .single();

    if (error) {
      console.error('❌ Transaction fetch error:', error);
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(data);

  } catch (error) {
    console.error('❌ Get transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to update store analytics
async function updateStoreAnalytics(supabase: any, storeId: string, transaction: any) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Update daily store analytics
    const { data: existingAnalytics } = await supabase
      .from('scout_dash.store_analytics')
      .select('*')
      .eq('store_id', storeId)
      .eq('date', today)
      .single();

    const updateData = {
      store_id: storeId,
      date: today,
      total_transactions: (existingAnalytics?.total_transactions || 0) + 1,
      total_revenue: (existingAnalytics?.total_revenue || 0) + transaction.totals.totalAmount,
      branded_revenue: (existingAnalytics?.branded_revenue || 0) + transaction.totals.brandedAmount,
      unbranded_revenue: (existingAnalytics?.unbranded_revenue || 0) + transaction.totals.unbrandedAmount,
      total_items_sold: (existingAnalytics?.total_items_sold || 0) + transaction.totals.totalItems,
      updated_at: new Date().toISOString(),
    };

    if (existingAnalytics) {
      await supabase
        .from('scout_dash.store_analytics')
        .update(updateData)
        .eq('id', existingAnalytics.id);
    } else {
      await supabase
        .from('scout_dash.store_analytics')
        .insert(updateData);
    }

  } catch (error) {
    console.error('❌ Store analytics update error:', error);
  }
}

// Helper function for real-time analytics processing
async function processRealTimeAnalytics(supabase: any, transaction: any) {
  try {
    // Update brand performance metrics
    for (const item of transaction.items) {
      if (!item.isUnbranded && item.brandName) {
        const { data: brandMetrics } = await supabase
          .from('scout_dash.brand_performance')
          .select('*')
          .eq('brand_name', item.brandName)
          .single();

        const updateData = {
          brand_name: item.brandName,
          total_units_sold: (brandMetrics?.total_units_sold || 0) + item.quantity,
          total_revenue: (brandMetrics?.total_revenue || 0) + item.totalPrice,
          avg_price: item.unitPrice,
          category: item.category,
          last_sold: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (brandMetrics) {
          await supabase
            .from('scout_dash.brand_performance')
            .update(updateData)
            .eq('id', brandMetrics.id);
        } else {
          await supabase
            .from('scout_dash.brand_performance')
            .insert(updateData);
        }
      }
    }

    // Update regional insights
    const { data: storeInfo } = await supabase
      .from('scout_dash.stores')
      .select('region, province, city')
      .eq('store_id', transaction.storeId)
      .single();

    if (storeInfo) {
      const { data: regionalData } = await supabase
        .from('scout_dash.regional_insights')
        .select('*')
        .eq('region', storeInfo.region)
        .single();

      const updateData = {
        region: storeInfo.region,
        province: storeInfo.province,
        city: storeInfo.city,
        total_transactions: (regionalData?.total_transactions || 0) + 1,
        total_revenue: (regionalData?.total_revenue || 0) + transaction.totals.totalAmount,
        branded_percentage: calculateBrandedPercentage(transaction),
        top_categories: updateTopCategories(regionalData?.top_categories || [], transaction.insights.topCategories),
        updated_at: new Date().toISOString(),
      };

      if (regionalData) {
        await supabase
          .from('scout_dash.regional_insights')
          .update(updateData)
          .eq('id', regionalData.id);
      } else {
        await supabase
          .from('scout_dash.regional_insights')
          .insert(updateData);
      }
    }

  } catch (error) {
    console.error('❌ Real-time analytics processing error:', error);
  }
}

// Helper functions
function calculateBrandedPercentage(transaction: any): number {
  return (transaction.totals.brandedAmount / transaction.totals.totalAmount) * 100;
}

function updateTopCategories(existing: any[], newCategories: any[]): any[] {
  const merged = [...existing];
  
  newCategories.forEach(newCat => {
    const existingIndex = merged.findIndex(cat => cat.category === newCat.category);
    if (existingIndex >= 0) {
      merged[existingIndex].count += newCat.count;
      merged[existingIndex].value += newCat.value;
    } else {
      merged.push(newCat);
    }
  });
  
  return merged.sort((a, b) => b.value - a.value).slice(0, 10);
}

export default router;