import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import React from "react";
import { Clock, Camera } from "lucide-react-native";
import Colors from "@/constants/colors";
import { TimeEntry } from "@/store/timeStore";

interface TimeCardProps {
  isClocked: boolean;
  currentEntry: TimeEntry | null;
  onClockAction: () => void;
  isLoading: boolean;
}

export default function TimeCard({ isClocked, currentEntry, onClockAction, isLoading }: TimeCardProps) {
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getElapsedTime = () => {
    if (!currentEntry?.clockIn) return "00:00";
    
    const start = new Date(currentEntry.clockIn);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.timeDisplay}>
        <Text style={styles.currentTime}>{getCurrentTime()}</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      {isClocked && currentEntry && (
        <View style={styles.activeSession}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionLabel}>Clocked in at</Text>
            <Text style={styles.sessionTime}>
              {new Date(currentEntry.clockIn).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
          <View style={styles.elapsedTime}>
            <Text style={styles.elapsedLabel}>Elapsed</Text>
            <Text style={styles.elapsedValue}>{getElapsedTime()}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.clockButton,
          isClocked ? styles.clockOutButton : styles.clockInButton,
          isLoading && styles.disabledButton,
        ]}
        onPress={onClockAction}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            {isClocked ? (
              <Clock size={24} color="#fff" />
            ) : (
              <Camera size={24} color="#fff" />
            )}
            <Text style={styles.clockButtonText}>
              {isClocked ? "Clock Out" : "Clock In"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.lightGray,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  timeDisplay: {
    alignItems: "center",
    marginBottom: 20,
  },
  currentTime: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  date: {
    fontSize: 16,
    color: Colors.light.darkGray,
    marginTop: 4,
  },
  activeSession: {
    flexDirection: "row",
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    width: "100%",
    justifyContent: "space-between",
  },
  sessionInfo: {
    alignItems: "center",
  },
  sessionLabel: {
    fontSize: 12,
    color: Colors.light.darkGray,
  },
  sessionTime: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 4,
  },
  elapsedTime: {
    alignItems: "center",
  },
  elapsedLabel: {
    fontSize: 12,
    color: Colors.light.darkGray,
  },
  elapsedValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.primary,
    marginTop: 4,
  },
  clockButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    minWidth: 140,
  },
  clockInButton: {
    backgroundColor: Colors.light.success,
  },
  clockOutButton: {
    backgroundColor: Colors.light.error,
  },
  disabledButton: {
    opacity: 0.6,
  },
  clockButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});