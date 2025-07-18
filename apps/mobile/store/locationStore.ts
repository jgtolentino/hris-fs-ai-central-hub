import { create } from "zustand";
import * as Location from "expo-location";
import { Platform } from "react-native";

interface LocationState {
  currentLocation: Location.LocationObject | null;
  isWithinWorkArea: boolean;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
  checkWorkArea: (location: Location.LocationObject) => boolean;
}

// TBWA Office coordinates (example - replace with actual coordinates)
const WORK_AREA = {
  latitude: 14.5995,
  longitude: 120.9842,
  radius: 100, // meters
};

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  isWithinWorkArea: false,
  isLoading: false,
  error: null,

  requestLocation: async () => {
    if (Platform.OS === 'web') {
      // Web fallback - assume within work area for demo
      set({ isWithinWorkArea: true });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const isWithinWorkArea = get().checkWorkArea(location);

      set({
        currentLocation: location,
        isWithinWorkArea,
        isLoading: false,
      });
    } catch (error) {
      console.error('Location error:', error);
      set({
        error: error instanceof Error ? error.message : 'Location error',
        isLoading: false,
      });
    }
  },

  checkWorkArea: (location: Location.LocationObject) => {
    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      WORK_AREA.latitude,
      WORK_AREA.longitude
    );

    return distance <= WORK_AREA.radius;
  },
}));

// Calculate distance between two coordinates in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}