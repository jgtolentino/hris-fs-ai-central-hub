import { StyleSheet, View, Text } from "react-native";
import React from "react";
import { MapPin, CheckCircle, XCircle } from "lucide-react-native";
import Colors from "@/constants/colors";
import * as Location from "expo-location";

interface LocationStatusProps {
  location: Location.LocationObject | null;
  isWithinWorkArea: boolean;
}

export default function LocationStatus({ location, isWithinWorkArea }: LocationStatusProps) {
  return (
    <View style={[styles.container, isWithinWorkArea ? styles.validLocation : styles.invalidLocation]}>
      <View style={styles.iconContainer}>
        {isWithinWorkArea ? (
          <CheckCircle size={20} color={Colors.light.success} />
        ) : (
          <XCircle size={20} color={Colors.light.error} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isWithinWorkArea ? "Within Work Area" : "Outside Work Area"}
        </Text>
        <Text style={styles.subtitle}>
          {location 
            ? `Location verified • ${location.coords.accuracy?.toFixed(0)}m accuracy`
            : "Checking location..."
          }
        </Text>
      </View>
      <MapPin size={16} color={Colors.light.darkGray} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  validLocation: {
    backgroundColor: "#f0fdf4",
    borderColor: Colors.light.success,
  },
  invalidLocation: {
    backgroundColor: "#fef2f2",
    borderColor: Colors.light.error,
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.light.darkGray,
    marginTop: 2,
  },
});