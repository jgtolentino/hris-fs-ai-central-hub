import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, CameraType } from 'expo-camera';
import { MapPin, Camera as CameraIcon, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import { colors } from '@/constants/colors';

export default function ClockInScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationName, setLocationName] = useState('Getting location...');
  const cameraRef = useRef<Camera>(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // Get location
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      if (locationStatus.status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        
        // Reverse geocode to get address
        const address = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        
        if (address[0]) {
          setLocationName(`${address[0].name || ''} ${address[0].street || ''}`);
        }
      }
    })();
  }, []);

  const takeSelfie = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setSelfieUri(photo.uri);
    }
  };

  const retakeSelfie = () => {
    setSelfieUri(null);
  };

  const confirmClockIn = async () => {
    if (!selfieUri || !location) {
      Alert.alert('Error', 'Please take a selfie and ensure location is enabled');
      return;
    }

    // Here you would upload to backend
    Alert.alert(
      'Success',
      'You have successfully clocked in!',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Clock In</Text>
        <View style={{ width: 24 }} />
      </View>

      {!selfieUri ? (
        <View style={styles.cameraContainer}>
          <Camera 
            style={styles.camera} 
            type={CameraType.front}
            ref={cameraRef}
          >
            <View style={styles.cameraOverlay}>
              <View style={styles.selfieGuide} />
            </View>
          </Camera>
          
          <TouchableOpacity style={styles.captureButton} onPress={takeSelfie}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <Text style={styles.instructionText}>
            Position your face within the circle and tap to capture
          </Text>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: selfieUri }} style={styles.selfiePreview} />
          
          <TouchableOpacity style={styles.retakeButton} onPress={retakeSelfie}>
            <CameraIcon size={20} color={colors.primary} />
            <Text style={styles.retakeText}>Retake Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.locationCard}>
        <MapPin size={20} color={colors.primary} />
        <View style={styles.locationInfo}>
          <Text style={styles.locationLabel}>Current Location</Text>
          <Text style={styles.locationText}>{locationName}</Text>
          {location && (
            <Text style={styles.coordinatesText}>
              {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.timeInfo}>
        <Text style={styles.timeLabel}>Clock In Time</Text>
        <Text style={styles.timeValue}>{new Date().toLocaleTimeString()}</Text>
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, (!selfieUri || !location) && styles.confirmButtonDisabled]}
        onPress={confirmClockIn}
        disabled={!selfieUri || !location}
      >
        <Text style={styles.confirmButtonText}>Confirm Clock In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
  },
  camera: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfieGuide: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: 'white',
    borderStyle: 'dashed',
  },
  captureButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    padding: 5,
  },
  captureButtonInner: {
    flex: 1,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
  instructionText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: colors.gray[600],
  },
  previewContainer: {
    flex: 1,
    margin: 20,
    alignItems: 'center',
  },
  selfiePreview: {
    width: 300,
    height: 300,
    borderRadius: 150,
    marginBottom: 20,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retakeText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginTop: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 2,
  },
  timeInfo: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: colors.gray[600],
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.error,
    padding: 20,
  },
});