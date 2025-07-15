import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import { Stack } from "expo-router";
import { Camera, MapPin, Clock, Calendar } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useTimeStore } from "@/store/timeStore";
import { useLocationStore } from "@/store/locationStore";
import TimeCard from "@/components/time/TimeCard";
import LocationStatus from "@/components/time/LocationStatus";
import TodaysSummary from "@/components/time/TodaysSummary";
import RecentEntries from "@/components/time/RecentEntries";

export default function TimeScreen() {
  const { 
    isClocked, 
    currentEntry, 
    todaysEntries, 
    clockIn, 
    clockOut, 
    isLoading 
  } = useTimeStore();
  
  const { 
    currentLocation, 
    isWithinWorkArea, 
    requestLocation 
  } = useLocationStore();

  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    requestLocation();
  }, []);

  const handleClockAction = async () => {
    if (!isWithinWorkArea) {
      Alert.alert(
        "Location Required",
        "You must be within the work area to clock in/out. Please move closer to the office.",
        [{ text: "OK" }]
      );
      return;
    }

    if (isClocked) {
      // Clock out
      Alert.alert(
        "Clock Out",
        "Are you sure you want to clock out?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Clock Out", 
            onPress: () => clockOut(),
            style: "destructive"
          }
        ]
      );
    } else {
      // Clock in
      setShowCamera(true);
    }
  };

  const handlePhotoTaken = async (photoUri: string) => {
    setShowCamera(false);
    try {
      await clockIn(photoUri, currentLocation);
      Alert.alert("Success", "Clocked in successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to clock in. Please try again.");
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Timekeeping",
          headerStyle: { backgroundColor: Colors.light.background },
          headerTintColor: Colors.light.text,
        }} 
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Location Status */}
          <LocationStatus 
            location={currentLocation}
            isWithinWorkArea={isWithinWorkArea}
          />

          {/* Main Clock Action */}
          <TimeCard
            isClocked={isClocked}
            currentEntry={currentEntry}
            onClockAction={handleClockAction}
            isLoading={isLoading}
          />

          {/* Today's Summary */}
          <TodaysSummary entries={todaysEntries} />

          {/* Recent Entries */}
          <RecentEntries entries={todaysEntries} />

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <Calendar size={20} color={Colors.light.primary} />
                <Text style={styles.actionText}>View Timesheet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Clock size={20} color={Colors.light.secondary} />
                <Text style={styles.actionText}>Time Correction</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Camera Modal would go here */}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
  },
  quickActions: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.light.lightGray,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
  },
});