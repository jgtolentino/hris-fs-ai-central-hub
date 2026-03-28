import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import NetInfo from '@react-native-community/netinfo';

export interface Expense {
  id: string;
  merchantName: string;
  amount: number;
  currency: string;
  category: string;
  expenseDate: Date;
  description?: string;
  tripId?: string;
  projectId?: string;
  paymentMethod?: string;
  hasReceipt: boolean;
  receiptUrl?: string;
  status: string;
  policyViolations?: any[];
  ocrConfidence?: number;
  ocrMetadata?: any;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ExpenseState {
  expenses: Expense[];
  offlineQueue: Expense[];
  isOnline: boolean;
  isSyncing: boolean;
  filters: {
    status?: string;
    category?: string;
    dateFrom?: Date;
    dateTo?: Date;
    tripId?: string;
    projectId?: string;
  };
  
  // Actions
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; offline?: boolean; id?: string }>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Offline queue management
  addToOfflineQueue: (expense: Expense) => void;
  removeFromOfflineQueue: (id: string) => void;
  syncOfflineExpenses: () => Promise<void>;
  
  // Filter actions
  setFilters: (filters: any) => void;
  clearFilters: () => void;
  
  // Network status
  setOnlineStatus: (isOnline: boolean) => void;
  
  // Fetch expenses
  fetchExpenses: () => Promise<void>;
  fetchExpenseById: (id: string) => Promise<Expense | null>;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      offlineQueue: [],
      isOnline: true,
      isSyncing: false,
      filters: {},

      setExpenses: (expenses) => set({ expenses }),

      addExpense: async (expenseData) => {
        const { isOnline } = get();
        const newExpense: Expense = {
          ...expenseData,
          id: `temp_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (!isOnline) {
          // Add to offline queue
          get().addToOfflineQueue(newExpense);
          return { success: true, offline: true, id: newExpense.id };
        }

        try {
          // Upload receipt if exists
          let receiptUrl = expenseData.receiptUrl;
          if (receiptUrl && receiptUrl.startsWith('file://')) {
            const uploadResult = await uploadReceipt(receiptUrl);
            if (uploadResult.url) {
              receiptUrl = uploadResult.url;
            }
          }

          // Submit to Supabase
          const { data, error } = await supabase
            .from('expenses')
            .insert({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              merchant_name: expenseData.merchantName,
              amount: expenseData.amount,
              currency: expenseData.currency,
              expense_category: expenseData.category,
              expense_date: expenseData.expenseDate,
              description: expenseData.description,
              trip_id: expenseData.tripId,
              project_id: expenseData.projectId,
              payment_method: expenseData.paymentMethod,
              has_receipt: expenseData.hasReceipt,
              receipt_url: receiptUrl,
              status: expenseData.status || 'Submitted',
              policy_violations: expenseData.policyViolations || [],
              ocr_confidence: expenseData.ocrConfidence,
              ocr_metadata: expenseData.ocrMetadata,
            })
            .select()
            .single();

          if (error) throw error;

          // Add to local state
          const expense = {
            ...data,
            expenseDate: new Date(data.expense_date),
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          };

          set((state) => ({
            expenses: [...state.expenses, expense],
          }));

          // Trigger notification/workflow if needed
          await triggerApprovalWorkflow(data.id);

          return { success: true, id: data.id };
        } catch (error) {
          console.error('Error submitting expense:', error);
          // Fallback to offline queue
          get().addToOfflineQueue(newExpense);
          return { success: true, offline: true, id: newExpense.id };
        }
      },

      updateExpense: async (id, updates) => {
        const { isOnline } = get();
        
        if (!isOnline) {
          // Queue update for later
          set((state) => ({
            expenses: state.expenses.map((exp) =>
              exp.id === id ? { ...exp, ...updates, updatedAt: new Date() } : exp
            ),
          }));
          return;
        }

        try {
          const { error } = await supabase
            .from('expenses')
            .update({
              merchant_name: updates.merchantName,
              amount: updates.amount,
              currency: updates.currency,
              expense_category: updates.category,
              description: updates.description,
              status: updates.status,
              updated_at: new Date(),
            })
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            expenses: state.expenses.map((exp) =>
              exp.id === id ? { ...exp, ...updates, updatedAt: new Date() } : exp
            ),
          }));
        } catch (error) {
          console.error('Error updating expense:', error);
          throw error;
        }
      },

      deleteExpense: async (id) => {
        const { isOnline } = get();
        
        if (!isOnline) {
          // Mark for deletion when online
          set((state) => ({
            expenses: state.expenses.filter((exp) => exp.id !== id),
          }));
          return;
        }

        try {
          const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            expenses: state.expenses.filter((exp) => exp.id !== id),
          }));
        } catch (error) {
          console.error('Error deleting expense:', error);
          throw error;
        }
      },

      addToOfflineQueue: (expense) => {
        set((state) => ({
          offlineQueue: [...state.offlineQueue, expense],
          expenses: [...state.expenses, expense],
        }));
      },

      removeFromOfflineQueue: (id) => {
        set((state) => ({
          offlineQueue: state.offlineQueue.filter((exp) => exp.id !== id),
        }));
      },

      syncOfflineExpenses: async () => {
        const { offlineQueue, isOnline } = get();
        
        if (!isOnline || offlineQueue.length === 0) return;
        
        set({ isSyncing: true });

        try {
          for (const expense of offlineQueue) {
            try {
              // Remove from queue first
              get().removeFromOfflineQueue(expense.id);
              
              // Submit expense
              const result = await get().addExpense(expense);
              
              if (result.success && !result.offline) {
                // Remove temp expense and replace with real one
                set((state) => ({
                  expenses: state.expenses.filter((exp) => exp.id !== expense.id),
                }));
              }
            } catch (error) {
              console.error('Error syncing expense:', error);
              // Re-add to queue if failed
              get().addToOfflineQueue(expense);
            }
          }
        } finally {
          set({ isSyncing: false });
        }
      },

      setFilters: (filters) => {
        set({ filters });
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline });
        if (isOnline) {
          // Trigger sync when coming online
          get().syncOfflineExpenses();
        }
      },

      fetchExpenses: async () => {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) return;

          const { filters } = get();
          let query = supabase
            .from('expenses')
            .select('*')
            .eq('user_id', userData.user.id)
            .order('expense_date', { ascending: false });

          // Apply filters
          if (filters.status) {
            query = query.eq('status', filters.status);
          }
          if (filters.category) {
            query = query.eq('expense_category', filters.category);
          }
          if (filters.dateFrom) {
            query = query.gte('expense_date', filters.dateFrom.toISOString());
          }
          if (filters.dateTo) {
            query = query.lte('expense_date', filters.dateTo.toISOString());
          }
          if (filters.tripId) {
            query = query.eq('trip_id', filters.tripId);
          }
          if (filters.projectId) {
            query = query.eq('project_id', filters.projectId);
          }

          const { data, error } = await query;

          if (error) throw error;

          const expenses = data.map((item) => ({
            ...item,
            expenseDate: new Date(item.expense_date),
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
          }));

          set({ expenses });
        } catch (error) {
          console.error('Error fetching expenses:', error);
        }
      },

      fetchExpenseById: async (id) => {
        try {
          const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          return {
            ...data,
            expenseDate: new Date(data.expense_date),
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          };
        } catch (error) {
          console.error('Error fetching expense:', error);
          return null;
        }
      },
    }),
    {
      name: 'expense-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        offlineQueue: state.offlineQueue,
        filters: state.filters,
      }),
    }
  )
);

// Helper functions
async function uploadReceipt(localUri: string): Promise<{ url?: string; error?: any }> {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    
    const fileName = `receipts/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('expense-receipts')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('expense-receipts')
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl };
  } catch (error) {
    console.error('Error uploading receipt:', error);
    return { error };
  }
}

async function triggerApprovalWorkflow(expenseId: string) {
  try {
    // This would call your backend API to trigger the approval workflow
    // For now, we'll just log it
    console.log('Triggering approval workflow for expense:', expenseId);
    
    // Example: Send notification to manager
    // await supabase.functions.invoke('notify-expense-approval', {
    //   body: { expenseId },
    // });
  } catch (error) {
    console.error('Error triggering approval workflow:', error);
  }
}

// Network monitoring
NetInfo.addEventListener((state) => {
  useExpenseStore.getState().setOnlineStatus(state.isConnected ?? false);
});