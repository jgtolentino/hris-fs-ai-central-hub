import { StyleSheet, View, Text } from "react-native";
import React from "react";
import { Clock, Calendar, Coffee } from "lucide-react-native";
import Colors from "@/constants/colors";
import { TimeEntry } from "@/store/timeStore";

interface TodaysSummaryProps {
  entries: TimeEntry[];
}

export default function TodaysSummary({ entries }: TodaysSummaryProps) {
  const calculateTotalHours = () => {
    return entries.reduce((total, entry) => {
      if (entry.totalHours) {
        return total + entry.totalHours;
      }
      return total;
    }, 0);
  };

  const getFirstClockIn = () => {
    const firstEntry = entries.find(entry => entry.clockIn);
    return firstEntry ? new Date(firstEntry.clockIn).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : "--:--";
  };

  const getLastClockOut = () => {
    const completedEntries = entries.filter(entry => entry.clockOut);
    if (completedEntries.length === 0) return "--:--";
    
    const lastEntry = completedEntries[completedEntries.length - 1];
    return new Date(lastEntry.clockOut!).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const totalHours = calculateTotalHours();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Summary</Text>
      
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <View style={styles.summaryIcon}>
            <Clock size={16} color={Colors.light.primary} />
          </View>
          <Text style={styles.summaryLabel}>Total Hours</Text>
          <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
        </View>

        <View style={styles.summaryItem}>
          <View style={styles.summaryIcon}>
            <Calendar size={16} color={Colors.light.secondary} />
          </View>
          <Text style={styles.summaryLabel}>First In</Text>
          <Text style={styles.summaryValue}>{getFirstClockIn()}</Text>
        </View>

        <View style={styles.summaryItem}>
          <View style={styles.summaryIcon}>
            <Coffee size={16} color={Colors.light.accent} />
          </View>
          <Text style={styles.summaryLabel}>Last Out</Text>
          <Text style={styles.summaryValue}>{getLastClockOut()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: Colors.light.lightGray,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.light.darkGray,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 4,
  },
});