import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { Feather } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface CameraComponentProps {
  onPictureTaken: (data: { image: string; location: Location.LocationObject | null; timestamp: Date }) => void;
}

export default function CameraComponent({ onPictureTaken }: CameraComponentProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationName, setLocationName] = useState<string>('Getting location...');
  const [type, setType] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  useEffect(() => {
    (async () => {
      // Request permissions
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      
      let mediaLibraryStatus = { status: 'granted' };
      if (Platform.OS !== 'web') {
        mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();
      }
      
      const allPermissionsGranted = 
        cameraStatus === 'granted' && 
        locationStatus === 'granted' && 
        mediaLibraryStatus.status === 'granted';
      
      setHasPermission(allPermissionsGranted);

      // Get location if permission granted
      if (locationStatus === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setLocation(location);
          
          // Get location name/address
          updateLocationName(location);
        } catch (error) {
          console.warn('Location error:', error);
          setLocationName('Location unavailable');
        }
      }
    })();
  }, []);

  const updateLocationName = async (location: Location.LocationObject) => {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (addresses.length > 0) {
        const address = addresses[0];
        let locationDisplayName = '';
        
        // Try to get the most specific location name first
        if (address.name) {
          locationDisplayName = address.name;
        } else if (address.street) {
          locationDisplayName = address.street;
        } else if (address.city) {
          locationDisplayName = address.city;
        } else if (address.region) {
          locationDisplayName = address.region;
        } else {
          // Fallback to coordinates if no name available
          locationDisplayName = `${location.coords.latitude.toFixed(2)}, ${location.coords.longitude.toFixed(2)}`;
        }
        
        setLocationName(locationDisplayName);
      } else {
        // Fallback to coordinates
        setLocationName(`${location.coords.latitude.toFixed(2)}, ${location.coords.longitude.toFixed(2)}`);
      }
    } catch (error) {
      console.warn('Reverse geocoding error:', error);
      // Fallback to coordinates
      setLocationName(`${location.coords.latitude.toFixed(2)}, ${location.coords.longitude.toFixed(2)}`);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && !isTakingPicture) {
      setIsTakingPicture(true);
      try {
        // Take the picture
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
        });
        
        if (photo) {
          // Return the photo data
          onPictureTaken({
            image: photo.uri,
            location: location,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      } finally {
        setIsTakingPicture(false);
      }
    }
  };

  const openLocationInMaps = () => {
    if (location) {
      const url = Platform.select({
        ios: `maps:0,0?q=${location.coords.latitude},${location.coords.longitude}`,
        android: `geo:0,0?q=${location.coords.latitude},${location.coords.longitude}`,
        web: `https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`,
      });
      
      Linking.openURL(url || `https://www.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`);
    }
  };

  const refreshLocation = async () => {
    if (location) {
      try {
        setLocationName('Getting location...');
        const freshLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(freshLocation);
        await updateLocationName(freshLocation);
      } catch (error) {
        console.warn('Location refresh error:', error);
        setLocationName('Location unavailable');
      }
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>No access to camera or location</Text>
        <Text style={[styles.message, { color: colors.text }]}>Please enable permissions in settings</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        ref={cameraRef} 
        facing={type} 
        flash={flash}
      >
        {/* Top controls */}
        <View style={styles.topControls}>
          <TouchableOpacity onPress={() => setFlash(flash === 'off' ? 'on' : 'off')}>
            <Feather 
              name={flash === 'on' ? 'zap' : 'zap-off'} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setType(type === 'back' ? 'front' : 'back')}>
            <Feather 
              name="refresh-cw" 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
        
        {/* Location display */}
        <View style={styles.locationContainer}>
          <TouchableOpacity 
            style={styles.locationButton}
            onPress={openLocationInMaps}
          >
            <Feather name="map-pin" size={16} color="white" />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationName}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={refreshLocation}
          >
            <Feather name="refresh-cw" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
      
      {/* Camera button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.captureButton, isTakingPicture && styles.buttonDisabled]}
          onPress={takePicture}
          disabled={isTakingPicture}
        >
          {isTakingPicture ? (
            <Feather name="loader" size={32} color="white" />
          ) : (
            <Feather name="circle" size={64} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  locationContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
  },
  locationText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  refreshButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'white',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  message: {
    textAlign: 'center',
    fontSize: 18,
    margin: 20,
  },
});