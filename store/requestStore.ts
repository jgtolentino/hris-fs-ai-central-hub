import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface RequestCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export interface OrgRequest {
  id: string;
  requestNumber: string;
  requestTypeId: string;
  employeeId: string;
  title: string;
  description: string;
  formData: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'completed';
  currentApproverId?: string;
  approvalStep: number;
  totalSteps: number;
  dueDate?: string;
  completedAt?: string;
  estimatedCost?: number;
  actualCost?: number;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

interface RequestState {
  requests: OrgRequest[];
  categories: RequestCategory[];
  pendingCount: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchRequests: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  createRequest: (data: any) => Promise<string>;
  updateRequest: (id: string, updates: Partial<OrgRequest>) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  getRequestById: (id: string) => OrgRequest | undefined;
}

const mockCategories: RequestCategory[] = [
  {
    id: '1',
    code: 'hr',
    name: 'HR/Employee Relations',
    description: 'Time corrections, leave requests, profile updates',
    icon: 'user',
    color: '#10B981',
    isActive: true,
  },
  {
    id: '2',
    code: 'finance',
    name: 'Finance/Expense',
    description: 'Cash advance, expense reimbursement, travel authorization',
    icon: 'credit-card',
    color: '#8B5CF6',
    isActive: true,
  },
  {
    id: '3',
    code: 'it',
    name: 'IT/Technology',
    description: 'Hardware requests, software access, technical support',
    icon: 'laptop',
    color: '#EF4444',
    isActive: true,
  },
  {
    id: '4',
    code: 'admin',
    name: 'Admin/Operations',
    description: 'Office supplies, maintenance, facility requests',
    icon: 'building',
    color: '#F59E0B',
    isActive: true,
  },
  {
    id: '5',
    code: 'compliance',
    name: 'Compliance/Legal',
    description: 'Government forms, certifications, legal documents',
    icon: 'shield',
    color: '#0066CC',
    isActive: true,
  },
];

export const useRequestStore = create<RequestState>()(
  persist(
    (set, get) => ({
      requests: [],
      categories: mockCategories,
      pendingCount: 0,
      loading: false,
      error: null,

      fetchRequests: async () => {
        set({ loading: true, error: null });
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockRequests: OrgRequest[] = [
            {
              id: '1',
              requestNumber: 'REQ-2025-001',
              requestTypeId: '1',
              employeeId: 'current_user',
              title: 'Time correction for January 14',
              description: 'Missed clock out due to system issue',
              formData: { date: '2025-01-14', reason: 'System issue' },
              priority: 'normal',
              status: 'submitted',
              approvalStep: 1,
              totalSteps: 2,
              metadata: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '2',
              requestNumber: 'ITR-2025-001',
              requestTypeId: '3',
              employeeId: 'current_user',
              title: 'Laptop replacement request',
              description: 'Current laptop is running slow and needs replacement',
              formData: { equipment: 'laptop', urgency: 'normal' },
              priority: 'normal',
              status: 'approved',
              approvalStep: 2,
              totalSteps: 2,
              completedAt: new Date().toISOString(),
              metadata: {},
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];

          const pendingCount = mockRequests.filter(r => 
            ['submitted', 'in_review'].includes(r.status)
          ).length;

          set({ 
            requests: mockRequests, 
            pendingCount,
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch requests',
            loading: false 
          });
        }
      },

      fetchCategories: async () => {
        set({ categories: mockCategories });
      },

      createRequest: async (data: any) => {
        set({ loading: true, error: null });
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const newRequest: OrgRequest = {
            id: Date.now().toString(),
            requestNumber: `REQ-2025-${String(get().requests.length + 1).padStart(3, '0')}`,
            requestTypeId: data.requestTypeId,
            employeeId: 'current_user',
            title: data.title,
            description: data.description,
            formData: data.formData || {},
            priority: data.priority || 'normal',
            status: 'draft',
            approvalStep: 1,
            totalSteps: 1,
            metadata: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set(state => ({
            requests: [newRequest, ...state.requests],
            loading: false,
          }));

          return newRequest.id;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create request',
            loading: false 
          });
          throw error;
        }
      },

      updateRequest: async (id: string, updates: Partial<OrgRequest>) => {
        set({ loading: true, error: null });
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => ({
            requests: state.requests.map(request =>
              request.id === id ? { ...request, ...updates, updatedAt: new Date().toISOString() } : request
            ),
            loading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update request',
            loading: false 
          });
          throw error;
        }
      },

      deleteRequest: async (id: string) => {
        set({ loading: true, error: null });
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => ({
            requests: state.requests.filter(request => request.id !== id),
            loading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete request',
            loading: false 
          });
          throw error;
        }
      },

      getRequestById: (id: string) => {
        return get().requests.find(request => request.id === id);
      },
    }),
    {
      name: "request-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        requests: state.requests,
      }),
    }
  )
);