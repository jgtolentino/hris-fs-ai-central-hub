import { StyleSheet, View, Text, FlatList } from "react-native";
import React from "react";
import { Clock, CheckCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import { TimeEntry } from "@/store/timeStore";

interface RecentEntriesProps {
  entries: TimeEntry[];
}

export default function RecentEntries({ entries }: RecentEntriesProps) {
  const renderEntry = ({ item }: { item: TimeEntry }) => (
    <View style={styles.entryItem}>
      <View style={styles.entryIcon}>
        {item.status === "completed" ? (
          <CheckCircle size={16} color={Colors.light.success} />
        ) : (
          <Clock size={16} color={Colors.light.warning} />
        )}
      </View>
      
      <View style={styles.entryContent}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryTime}>
            {new Date(item.clockIn).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
            {item.clockOut && (
              <Text> - {new Date(item.clockOut).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</Text>
            )}
          </Text>
          {item.totalHours && (
            <Text style={styles.entryDuration}>{item.totalHours.toFixed(1)}h</Text>
          )}
        </View>
        
        <Text style={styles.entryStatus}>
          {item.status === "completed" ? "Completed" : "In Progress"}
        </Text>
      </View>
    </View>
  );

  if (entries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Clock size={32} color={Colors.light.darkGray} />
        <Text style={styles.emptyText}>No time entries today</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Entries</Text>
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
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
  entryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.light.lightGray,
    borderRadius: 8,
    marginBottom: 8,
  },
  entryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  entryContent: {
    flex: 1,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryTime: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  entryStatus: {
    fontSize: 12,
    color: Colors.light.darkGray,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.darkGray,
    marginTop: 8,
  },
});