import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Expense, ExpenseCategory, CreateExpenseData } from "@/types/expenses";

interface ExpenseState {
  expenses: Expense[];
  categories: ExpenseCategory[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchExpenses: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  createExpense: (data: CreateExpenseData) => Promise<string>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  submitExpense: (id: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpenseById: (id: string) => Expense | undefined;
  getExpensesByStatus: (status: Expense["status"]) => Expense[];
}

const mockCategories: ExpenseCategory[] = [
  {
    id: '1',
    name: 'Meals & Entertainment',
    description: 'Business meals and client entertainment',
    isActive: true,
    requiresReceipt: true,
    maxAmount: 5000,
  },
  {
    id: '2',
    name: 'Travel',
    description: 'Transportation and accommodation',
    isActive: true,
    requiresReceipt: true,
  },
  {
    id: '3',
    name: 'Office Supplies',
    description: 'Office materials and equipment',
    isActive: true,
    requiresReceipt: true,
    maxAmount: 2000,
  },
  {
    id: '4',
    name: 'Software & Subscriptions',
    description: 'Software licenses and online subscriptions',
    isActive: true,
    requiresReceipt: true,
  },
  {
    id: '5',
    name: 'Training & Education',
    description: 'Professional development and training',
    isActive: true,
    requiresReceipt: true,
  },
];

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      categories: mockCategories,
      loading: false,
      error: null,

      fetchExpenses: async () => {
        set({ loading: true, error: null });
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockExpenses: Expense[] = [
            {
              id: '1',
              userId: 'current_user',
              expenseNumber: 'EXP-2025-001',
              title: 'Client lunch meeting',
              totalAmount: 2500,
              currency: 'PHP',
              exchangeRate: 1,
              status: 'submitted',
              submissionDate: '2025-01-15',
              submittedAt: new Date().toISOString(),
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              id: '2',
              userId: 'current_user',
              expenseNumber: 'EXP-2025-002',
              title: 'Office supplies',
              totalAmount: 1200,
              currency: 'PHP',
              exchangeRate: 1,
              status: 'approved',
              submissionDate: '2025-01-10',
              submittedAt: new Date(Date.now() - 432000000).toISOString(),
              approvedAt: new Date(Date.now() - 86400000).toISOString(),
              createdAt: new Date(Date.now() - 432000000).toISOString(),
            },
          ];

          set({ expenses: mockExpenses, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch expenses',
            loading: false 
          });
        }
      },

      fetchCategories: async () => {
        set({ categories: mockCategories });
      },

      createExpense: async (data: CreateExpenseData) => {
        set({ loading: true, error: null });
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const totalAmount = data.items.reduce((sum, item) => sum + item.amount, 0);
          
          const newExpense: Expense = {
            id: Date.now().toString(),
            userId: 'current_user',
            expenseNumber: `EXP-2025-${String(get().expenses.length + 1).padStart(3, '0')}`,
            title: data.title,
            totalAmount,
            currency: 'PHP',
            exchangeRate: 1,
            status: 'draft',
            createdAt: new Date().toISOString(),
          };

          set(state => ({
            expenses: [newExpense, ...state.expenses],
            loading: false,
          }));

          return newExpense.id;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create expense',
            loading: false 
          });
          throw error;
        }
      },

      updateExpense: async (id: string, updates: Partial<Expense>) => {
        set({ loading: true, error: null });
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => ({
            expenses: state.expenses.map(expense =>
              expense.id === id ? { ...expense, ...updates } : expense
            ),
            loading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update expense',
            loading: false 
          });
          throw error;
        }
      },

      submitExpense: async (id: string) => {
        await get().updateExpense(id, { 
          status: 'submitted',
          submittedAt: new Date().toISOString(),
          submissionDate: new Date().toISOString().split('T')[0],
        });
      },

      deleteExpense: async (id: string) => {
        set({ loading: true, error: null });
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => ({
            expenses: state.expenses.filter(expense => expense.id !== id),
            loading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete expense',
            loading: false 
          });
          throw error;
        }
      },

      getExpenseById: (id: string) => {
        return get().expenses.find(expense => expense.id === id);
      },

      getExpensesByStatus: (status: Expense["status"]) => {
        return get().expenses.filter(expense => expense.status === status);
      },
    }),
    {
      name: "expense-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        expenses: state.expenses,
      }),
    }
  )
);