import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LeaveRequest, LeaveBalance, LeaveType, CreateLeaveRequestData } from "@/types/leave";

interface LeaveState {
  requests: LeaveRequest[];
  balances: LeaveBalance[];
  leaveTypes: LeaveType[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchLeaveRequests: () => Promise<void>;
  fetchLeaveBalances: () => Promise<void>;
  fetchLeaveTypes: () => Promise<void>;
  createLeaveRequest: (data: CreateLeaveRequestData) => Promise<string>;
  updateLeaveRequest: (id: string, updates: Partial<LeaveRequest>) => Promise<void>;
  cancelLeaveRequest: (id: string) => Promise<void>;
  getLeaveRequestById: (id: string) => LeaveRequest | undefined;
  getBalanceByType: (leaveTypeId: string) => LeaveBalance | undefined;
  calculateWorkingDays: (startDate: string, endDate: string) => number;
}

const mockLeaveTypes: LeaveType[] = [
  {
    id: '1',
    code: 'vacation',
    name: 'Vacation Leave',
    description: 'Annual vacation leave',
    maxDaysPerYear: 15,
    requiresMedicalCert: false,
    isActive: true,
  },
  {
    id: '2',
    code: 'sick',
    name: 'Sick Leave',
    description: 'Medical/health-related leave',
    maxDaysPerYear: 7,
    requiresMedicalCert: true,
    isActive: true,
  },
  {
    id: '3',
    code: 'personal',
    name: 'Personal Leave',
    description: 'Personal/emergency leave',
    maxDaysPerYear: 3,
    requiresMedicalCert: false,
    isActive: true,
  },
  {
    id: '4',
    code: 'maternity',
    name: 'Maternity Leave',
    description: 'Maternity/paternity leave',
    maxDaysPerYear: 105,
    requiresMedicalCert: true,
    isActive: true,
  },
];

export const useLeaveStore = create<LeaveState>()(
  persist(
    (set, get) => ({
      requests: [],
      balances: [],
      leaveTypes: mockLeaveTypes,
      loading: false,
      error: null,

      fetchLeaveRequests: async () => {
        set({ loading: true, error: null });
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockRequests: LeaveRequest[] = [
            {
              id: '1',
              employeeId: 'current_user',
              leaveTypeId: '1',
              startDate: '2025-02-10',
              endDate: '2025-02-14',
              daysRequested: 5,
              reason: 'Family vacation',
              status: 'pending',
              createdAt: new Date().toISOString(),
            },
            {
              id: '2',
              employeeId: 'current_user',
              leaveTypeId: '2',
              startDate: '2025-01-08',
              endDate: '2025-01-09',
              daysRequested: 2,
              reason: 'Flu symptoms',
              status: 'approved',
              approvedAt: new Date(Date.now() - 86400000).toISOString(),
              createdAt: new Date(Date.now() - 172800000).toISOString(),
            },
          ];

          set({ requests: mockRequests, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch leave requests',
            loading: false 
          });
        }
      },

      fetchLeaveBalances: async () => {
        set({ loading: true, error: null });
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockBalances: LeaveBalance[] = [
            {
              id: '1',
              employeeId: 'current_user',
              leaveTypeId: '1',
              year: 2025,
              allocatedDays: 15,
              usedDays: 2,
              pendingDays: 5,
              availableDays: 8,
              lastUpdated: new Date().toISOString(),
            },
            {
              id: '2',
              employeeId: 'current_user',
              leaveTypeId: '2',
              year: 2025,
              allocatedDays: 7,
              usedDays: 2,
              pendingDays: 0,
              availableDays: 5,
              lastUpdated: new Date().toISOString(),
            },
            {
              id: '3',
              employeeId: 'current_user',
              leaveTypeId: '3',
              year: 2025,
              allocatedDays: 3,
              usedDays: 0,
              pendingDays: 0,
              availableDays: 3,
              lastUpdated: new Date().toISOString(),
            },
          ];

          set({ balances: mockBalances, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch leave balances',
            loading: false 
          });
        }
      },

      fetchLeaveTypes: async () => {
        set({ leaveTypes: mockLeaveTypes });
      },

      createLeaveRequest: async (data: CreateLeaveRequestData) => {
        set({ loading: true, error: null });
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const daysRequested = get().calculateWorkingDays(data.startDate, data.endDate);
          
          const newRequest: LeaveRequest = {
            id: Date.now().toString(),
            employeeId: 'current_user',
            leaveTypeId: data.leaveTypeId,
            startDate: data.startDate,
            endDate: data.endDate,
            daysRequested,
            reason: data.reason,
            status: 'pending',
            medicalCertUrl: data.medicalCertUrl,
            createdAt: new Date().toISOString(),
          };

          set(state => ({
            requests: [newRequest, ...state.requests],
            loading: false,
          }));

          return newRequest.id;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create leave request',
            loading: false 
          });
          throw error;
        }
      },

      updateLeaveRequest: async (id: string, updates: Partial<LeaveRequest>) => {
        set({ loading: true, error: null });
        try {
          // Mock API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          set(state => ({
            requests: state.requests.map(request =>
              request.id === id ? { ...request, ...updates } : request
            ),
            loading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update leave request',
            loading: false 
          });
          throw error;
        }
      },

      cancelLeaveRequest: async (id: string) => {
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
            error: error instanceof Error ? error.message : 'Failed to cancel leave request',
            loading: false 
          });
          throw error;
        }
      },

      getLeaveRequestById: (id: string) => {
        return get().requests.find(request => request.id === id);
      },

      getBalanceByType: (leaveTypeId: string) => {
        return get().balances.find(balance => balance.leaveTypeId === leaveTypeId);
      },

      calculateWorkingDays: (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let workingDays = 0;
        
        const current = new Date(start);
        while (current <= end) {
          const dayOfWeek = current.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
            workingDays++;
          }
          current.setDate(current.getDate() + 1);
        }
        
        return workingDays;
      },
    }),
    {
      name: "leave-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        requests: state.requests,
        balances: state.balances,
      }),
    }
  )
);