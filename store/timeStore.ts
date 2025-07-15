import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

export interface TimeEntry {
  id: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  photoUri?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  totalHours?: number;
  status: "active" | "completed";
}

interface TimeState {
  isClocked: boolean;
  currentEntry: TimeEntry | null;
  todaysEntries: TimeEntry[];
  isLoading: boolean;
  clockIn: (photoUri?: string, location?: any) => Promise<void>;
  clockOut: () => Promise<void>;
  getTodaysEntries: () => TimeEntry[];
  calculateTotalHours: (entry: TimeEntry) => number;
}

export const useTimeStore = create<TimeState>()(
  persist(
    (set, get) => ({
      isClocked: false,
      currentEntry: null,
      todaysEntries: [],
      isLoading: false,

      clockIn: async (photoUri?: string, location?: any) => {
        set({ isLoading: true });
        
        try {
          const now = new Date();
          const entry: TimeEntry = {
            id: Date.now().toString(),
            date: now.toISOString().split('T')[0],
            clockIn: now.toISOString(),
            photoUri,
            location,
            status: "active",
          };

          set((state) => ({
            isClocked: true,
            currentEntry: entry,
            todaysEntries: [...state.todaysEntries, entry],
            isLoading: false,
          }));
        } catch (error) {
          console.error("Clock in error:", error);
          set({ isLoading: false });
          throw error;
        }
      },

      clockOut: async () => {
        set({ isLoading: true });
        
        try {
          const state = get();
          if (!state.currentEntry) return;

          const now = new Date();
          const updatedEntry: TimeEntry = {
            ...state.currentEntry,
            clockOut: now.toISOString(),
            status: "completed",
            totalHours: get().calculateTotalHours({
              ...state.currentEntry,
              clockOut: now.toISOString(),
            }),
          };

          set((state) => ({
            isClocked: false,
            currentEntry: null,
            todaysEntries: state.todaysEntries.map((entry) =>
              entry.id === updatedEntry.id ? updatedEntry : entry
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error("Clock out error:", error);
          set({ isLoading: false });
          throw error;
        }
      },

      getTodaysEntries: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().todaysEntries.filter(entry => entry.date === today);
      },

      calculateTotalHours: (entry: TimeEntry) => {
        if (!entry.clockOut) return 0;
        
        const clockIn = new Date(entry.clockIn);
        const clockOut = new Date(entry.clockOut);
        const diffMs = clockOut.getTime() - clockIn.getTime();
        return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      },
    }),
    {
      name: "time-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        todaysEntries: state.todaysEntries,
        isClocked: state.isClocked,
        currentEntry: state.currentEntry,
      }),
    }
  )
);