import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, MapPin, Calendar, Activity } from 'lucide-react-native';
import * as Location from 'expo-location';
import { format } from 'date-fns';
import { colors } from '@/constants/colors';

export default function TimeScreen() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [todayHours, setTodayHours] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for clock-in');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const handleClockIn = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services to clock in');
      return;
    }

    // Navigate to camera for selfie verification
    router.push('/time/clock-in');
  };

  const handleClockOut = () => {
    Alert.alert(
      'Clock Out',
      'Are you sure you want to clock out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clock Out', 
          onPress: () => {
            setIsClockedIn(false);
            setClockInTime(null);
            Alert.alert('Success', 'You have clocked out successfully');
          }
        }
      ]
    );
  };

  const calculateWorkHours = () => {
    if (!clockInTime) return '0h 0m';
    const diff = new Date().getTime() - clockInTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.currentTime}>{format(currentTime, 'HH:mm:ss')}</Text>
        <Text style={styles.currentDate}>{format(currentTime, 'EEEE, MMMM d, yyyy')}</Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Clock size={24} color={isClockedIn ? colors.success : colors.gray[500]} />
          <Text style={styles.statusTitle}>
            {isClockedIn ? 'Clocked In' : 'Not Clocked In'}
          </Text>
        </View>
        
        {isClockedIn && clockInTime && (
          <View style={styles.statusDetails}>
            <Text style={styles.statusText}>
              Since: {format(clockInTime, 'HH:mm')}
            </Text>
            <Text style={styles.statusText}>
              Duration: {calculateWorkHours()}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.clockButton, isClockedIn && styles.clockOutButton]}
          onPress={isClockedIn ? handleClockOut : handleClockIn}
        >
          <Text style={styles.clockButtonText}>
            {isClockedIn ? 'Clock Out' : 'Clock In'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Activity size={20} color={colors.primary} />
          <Text style={styles.statValue}>8.5h</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Calendar size={20} color={colors.primary} />
          <Text style={styles.statValue}>42h</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={20} color={colors.primary} />
          <Text style={styles.statValue}>168h</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/time/history')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Clock size={16} color={colors.gray[600]} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>
                {i % 2 === 0 ? 'Clock Out' : 'Clock In'}
              </Text>
              <Text style={styles.activityTime}>
                Today at {9 + i * 3}:{i}0 AM
              </Text>
            </View>
            <View style={styles.activityLocation}>
              <MapPin size={14} color={colors.gray[500]} />
              <Text style={styles.locationText}>TBWA Office</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.reportButton}
        onPress={() => router.push('/time/report')}
      >
        <Text style={styles.reportButtonText}>Generate Time Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
  },
  currentTime: {
    fontSize: 48,
    fontWeight: '300',
    color: colors.text,
  },
  currentDate: {
    fontSize: 16,
    color: colors.gray[600],
    marginTop: 8,
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  statusDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  statusText: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: 8,
  },
  clockButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  clockOutButton: {
    backgroundColor: colors.error,
  },
  clockButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[600],
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  activityTime: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 2,
  },
  activityLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  reportButton: {
    backgroundColor: colors.gray[100],
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  reportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});