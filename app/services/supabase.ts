import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: {
      getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
      },
      setItem: (key: string, value: string) => {
        SecureStore.setItemAsync(key, value);
      },
      removeItem: (key: string) => {
        SecureStore.deleteItemAsync(key);
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Expense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  merchant: string;
  description?: string;
  receipt_url?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'reimbursed';
  date: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  reimbursed_at?: string;
}

// Expense service functions
export const expenseService = {
  // Create new expense
  async createExpense(expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('expenses')
      .insert([{
        ...expense,
        user_id: user.id,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all user expenses
  async getExpenses(filters?: { status?: string; from?: string; to?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.from) {
      query = query.gte('date', filters.from);
    }
    if (filters?.to) {
      query = query.lte('date', filters.to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get expense by ID
  async getExpenseById(id: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update expense
  async updateExpense(id: string, updates: Partial<Expense>) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete expense (only drafts)
  async deleteExpense(id: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('status', 'draft');

    if (error) throw error;
  },

  // Upload receipt
  async uploadReceipt(file: { uri: string; name: string; type: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: fileName,
      type: file.type,
    } as any);

    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, formData, {
        contentType: file.type,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName);

    return publicUrl;
  },

  // Get expense statistics
  async getExpenseStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const currentMonth = new Date();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('expenses')
      .select('amount, status')
      .eq('user_id', user.id)
      .gte('date', firstDay.toISOString())
      .lte('date', lastDay.toISOString());

    if (error) throw error;

    const stats = {
      totalAmount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      count: data?.length || 0,
    };

    data?.forEach(expense => {
      stats.totalAmount += expense.amount;
      if (expense.status === 'pending') {
        stats.pendingAmount += expense.amount;
      } else if (expense.status === 'approved' || expense.status === 'reimbursed') {
        stats.approvedAmount += expense.amount;
      }
    });

    return stats;
  },
};