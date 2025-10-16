import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { apiService } from '@/services/api';
import { DonationData, fraudDetector } from '@/utils/fraudDetection';
import { addWatermark, generateWatermarkText } from '@/utils/watermark';
import { Feather } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Button from './Button';
import CameraComponent from './Camera';
import Input from './Input';

interface FormData {
  donationName: string;
  description: string;
  quantity: string;
  receiver: string;
  donationType: string;
}

type PhotoData = {
  image: string;
  location: Location.LocationObject | null;
  timestamp: Date;
};

const DonationForm = () => {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [step, setStep] = useState(1);
  const [donationPhoto, setDonationPhoto] = useState<PhotoData | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<PhotoData | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoTypeToCapture, setPhotoTypeToCapture] = useState<'donation' | 'selfie'>('donation');
  const [formData, setFormData] = useState<FormData>({} as FormData);
  const [donationType, setDonationType] = useState('food');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fraudErrors, setFraudErrors] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false); // New state to track submission

  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const { user, addCredits } = useUser();

  const donationTypes = [
    { id: 'food', name: 'Food', icon: 'coffee' },
    { id: 'blood', name: 'Blood', icon: 'droplet' },
    { id: 'clothes', name: 'Clothes', icon: 'shopping-bag' },
    { id: 'books', name: 'Books', icon: 'book-open' },
    { id: 'other', name: 'Other', icon: 'gift' },
  ];

  const checkPermissions = async () => {
    try {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      
      // Media library is not available on web
      let mediaLibraryStatus;
      if (Platform.OS !== 'web') {
        try {
          mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();
        } catch (error) {
          console.warn('Media library permission error (might be web platform):', error);
          // On web, we don't need media library permissions for basic functionality
          mediaLibraryStatus = { status: 'granted' };
        }
      } else {
        // On web, we don't need media library permissions for basic functionality
        mediaLibraryStatus = { status: 'granted' };
      }
      
      return (
        cameraStatus.status === 'granted' && 
        locationStatus.status === 'granted' && 
        mediaLibraryStatus.status === 'granted'
      );
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  };

  const handlePhotoUpload = async (type: 'donation' | 'selfie') => {
    const hasPermissions = await checkPermissions();
    
    if (!hasPermissions) {
      Alert.alert(
        'Permissions Required',
        'This app needs camera, location, and media library permissions to capture photos. Please enable them in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => {
              // In a real app, you would open the settings here
              // For now, we'll just proceed and let the Camera component handle it
            }
          }
        ]
      );
    }
    
    setPhotoTypeToCapture(type);
    setIsCameraOpen(true);
  };

  const onCameraCapture = (data: PhotoData) => {
    // Validate location data
    if (!data.location) {
      Alert.alert(
        'Location Warning',
        'Could not get your precise location. The donation can still be submitted, but verification might take longer.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue Anyway', 
            onPress: () => {
              if (photoTypeToCapture === 'donation') {
                setDonationPhoto(data);
              } else {
                setSelfiePhoto(data);
              }
              setIsCameraOpen(false);
            }
          }
        ]
      );
      return;
    }

    if (photoTypeToCapture === 'donation') {
      setDonationPhoto(data);
    } else {
      setSelfiePhoto(data);
    }
    setIsCameraOpen(false);
  };

  const onSubmit = (data: FormData) => {
    setFormData({ ...data, donationType });
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    console.log('Submit button pressed');
    console.log('Donation photo:', donationPhoto);
    console.log('Selfie photo:', selfiePhoto);
    
    if (!donationPhoto || !selfiePhoto) {
      console.log('Missing photos');
      Alert.alert('Missing Photos', 'Please capture both donation photo and selfie.');
      return;
    }

    // Validate location data for both photos
    if (!donationPhoto.location && !selfiePhoto.location) {
      console.log('Missing location data');
      Alert.alert(
        'Location Warning',
        'Location data is missing from both photos. Submission is still possible, but verification might take longer.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsProcessing(false) },
          { text: 'Submit Anyway', onPress: () => proceedWithSubmission() }
        ]
      );
      return;
    }

    console.log('Starting submission process');
    setIsProcessing(true);
    setFraudErrors([]); // Clear previous fraud errors
    
    try {
      // Fraud detection
      if (user) {
        const donationData: DonationData = {
          userId: user.id,
          donationType: formData.donationType,
          location: donationPhoto.location || selfiePhoto.location, // Use whichever is available
          timestamp: new Date(),
          description: formData.description,
        };
      
        const fraudResult = fraudDetector.analyzeDonation(user.id, donationData);
      
        if (fraudResult.isFraudulent) {
          console.warn('Fraud detection triggered:', fraudResult.reasons);
          
          // Set fraud errors to display in UI
          setFraudErrors(fraudResult.reasons);
        
          // For high risk, reject immediately and stop processing
          if (fraudResult.riskLevel === 'high') {
            setIsProcessing(false); // Stop showing processing state
            Alert.alert(
              'Donation Flagged',
              'This donation has been flagged for review due to suspicious activity. It will be reviewed by our team.',
              [{ text: 'OK' }]
            );
            // In a real app, you would send this to admin for review
            return;
          } 
          // For medium/low risk, show warning but allow submission to continue
          else if (fraudResult.riskLevel === 'medium' || fraudResult.riskLevel === 'low') {
            setIsProcessing(false); // Stop showing processing state
            const reasonsText = fraudResult.reasons.join('\n');
            Alert.alert(
              'Potential Issue Detected',
              `We noticed some unusual patterns in your donation:

${reasonsText}

Please address these issues or you can still submit, but it will be reviewed.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Submit Anyway', onPress: () => {
                    setIsProcessing(true); // Resume processing when user confirms
                    proceedWithSubmission();
                  }
                }
              ]
            );
            return;
          }
        }
      
        // Add to fraud detection history
        fraudDetector.addDonationToHistory(user.id, donationData);
      }
    
      proceedWithSubmission();
    } catch (error: any) {
      console.error('Error in fraud detection:', error);
      setIsProcessing(false); // Reset processing state on error
      Alert.alert(
        'Submission Error',
        `There was an error processing your donation: ${error.message || error.toString() || 'Please try again.'}`,
        [{ text: 'OK' }]
      );
    }
  };

const proceedWithSubmission = async () => {
  console.log('Proceeding with submission');
  try {
    // Add watermarks to photos and compress them
    const watermarkText = generateWatermarkText(new Date());
    console.log('Generating watermarks and compressing images');
    
    // Compress and watermark donation photo
    const watermarkedDonationPhoto = donationPhoto 
      ? await addWatermark(donationPhoto.image, watermarkText)
      : '';
    console.log('Donation photo watermarked:', watermarkedDonationPhoto);
    
    // Compress and watermark selfie photo
    const watermarkedSelfiePhoto = selfiePhoto 
      ? await addWatermark(selfiePhoto.image, watermarkText)
      : '';
    console.log('Selfie photo watermarked:', watermarkedSelfiePhoto);

    // Add credits based on donation type (simplified logic)
    let creditsToAdd = 0;
    switch (formData.donationType) {
      case 'food':
        creditsToAdd = 100;
        break;
      case 'blood':
        creditsToAdd = 300;
        break;
      case 'clothes':
        creditsToAdd = 150;
        break;
      case 'books':
        creditsToAdd = 75;
        break;
      default:
        creditsToAdd = 50;
    }

    // Submit donation to API
    if (user && watermarkedDonationPhoto && watermarkedSelfiePhoto) {
      console.log('User data:', user);
      console.log('Submitting to API');
      // Ensure we have location data before accessing it
      const locationString = donationPhoto?.location 
        ? `${donationPhoto.location.coords.latitude.toFixed(6)}, ${donationPhoto.location.coords.longitude.toFixed(6)}`
        : selfiePhoto?.location
        ? `${selfiePhoto.location.coords.latitude.toFixed(6)}, ${selfiePhoto.location.coords.longitude.toFixed(6)}`
        : 'Location not available';

      const donationData = {
        userId: user.id,
        type: formData.donationType,
        title: formData.donationName,
        description: formData.description,
        quantity: formData.quantity,
        receiver: formData.receiver,
        status: 'pending' as const,
        credits: creditsToAdd,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        location: locationString,
        donationPhoto: watermarkedDonationPhoto || '',
        selfiePhoto: watermarkedSelfiePhoto || '',
      };

      console.log('Creating donation with data:', donationData);

      const result = await apiService.createDonation(donationData);
      console.log('Donation created successfully:', result);
      
      // Add credits to user
      console.log('Adding credits to user');
      await addCredits(creditsToAdd);

      console.log('Donation submitted', {
        ...formData,
        donationType,
        donationPhoto: watermarkedDonationPhoto || '',
        selfiePhoto: watermarkedSelfiePhoto || '',
        creditsEarned: creditsToAdd
      });

      // Reset processing state before showing alert
      setIsProcessing(false);
      setIsSubmitted(true); // Set submitted state
      
      Alert.alert(
        'Donation Submitted',
        `Your donation has been submitted for verification. You've earned ${creditsToAdd} credits!`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/history?filter=pending') }] // Navigate to history page with pending filter
      );
    }
  } catch (error: any) {
    console.error('Error processing donation:', error);
    setIsProcessing(false); // Reset processing state on error
    Alert.alert(
      'Submission Error',
      `There was an error processing your donation: ${error.message || error.toString() || 'Please try again.'}`,
      [{ text: 'OK' }]
    );
  }
};

  if (isCameraOpen) {
    return <CameraComponent onPictureTaken={onCameraCapture} />;
  }

  const renderStep1 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: colors.text }]}>Make a Donation</Text>
      <Text style={[styles.subtitle, { color: colors.gray }]}>Step 1: Provide details about your donation</Text>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Donation Type</Text>
        <View style={styles.typeContainer}>
          {donationTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeButton,
                { backgroundColor: donationType === type.id ? colors.primary : colors.card, borderColor: donationType === type.id ? colors.primary : colors.border },
              ]}
              onPress={() => setDonationType(type.id)}
            >
              <Feather name={type.icon as any} size={24} color={donationType === type.id ? colors.white : colors.text} />
              <Text style={[
                styles.typeText,
                { color: donationType === type.id ? colors.white : colors.text }
              ]}>
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Donation Details</Text>
        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              placeholder="Donation Name"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              icon="gift"
            />
          )}
          name="donationName"
          rules={{ required: 'Donation name is required' }}
        />
        {errors.donationName && <Text style={styles.errorText}>{errors.donationName.message}</Text>}

        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              placeholder="Description"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              multiline
              numberOfLines={4}
              icon="align-left"
            />
          )}
          name="description"
          rules={{ required: 'Description is required' }}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}

        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              placeholder="Quantity"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              icon="package"
            />
          )}
          name="quantity"
          rules={{ required: 'Quantity is required' }}
        />
        {errors.quantity && <Text style={styles.errorText}>{errors.quantity.message}</Text>}

        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              placeholder="Receiver (Optional)"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              icon="user"
            />
          )}
          name="receiver"
        />
      </View>

      <Button title="Next" onPress={handleSubmit(onSubmit)} />
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: colors.text }]}>Upload Proof</Text>
      <Text style={[styles.subtitle, { color: colors.gray }]}>Step 2: Capture photos as proof of your donation</Text>

      {/* Display fraud detection errors */}
      {fraudErrors.length > 0 && (
        <View style={[styles.errorContainer, { backgroundColor: `${colors.danger}10`, borderColor: colors.danger }]}>
          <View style={styles.errorHeader}>
            <Feather name="alert-triangle" size={20} color={colors.danger} />
            <Text style={[styles.errorTitle, { color: colors.danger }]}>Please address the following issues:</Text>
          </View>
          {fraudErrors.map((error, index) => (
            <Text key={index} style={[styles.errorItem, { color: colors.danger }]}>
              • {error}
            </Text>
          ))}
          <Text style={[styles.errorFooter, { color: colors.gray }]}>
            Please correct these issues before submitting your donation.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Donation Photo</Text>
        <Text style={[styles.helperText, { color: colors.gray }]}>
          Take a clear photo of the donation items with context
        </Text>
        {donationPhoto ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: donationPhoto.image }} style={styles.photoPreview} />
            <View style={[styles.metadataContainer, { backgroundColor: colors.card }]}>
              {donationPhoto.location && (
                <Text style={[styles.metadataText, { color: colors.text }]}>
                  Location: {donationPhoto.location.coords.latitude.toFixed(6)}, {donationPhoto.location.coords.longitude.toFixed(6)}
                </Text>
              )}
              <Text style={[styles.metadataText, { color: colors.text }]}>
                Time: {donationPhoto.timestamp.toLocaleTimeString()}
              </Text>
              <Text style={[styles.metadataText, { color: colors.text }]}>
                Date: {donationPhoto.timestamp.toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity style={[styles.retakeButton, { backgroundColor: colors.danger }]} onPress={() => handlePhotoUpload('donation')}>
              <Feather name="refresh-cw" size={20} color={colors.white} />
              <Text style={[styles.retakeButtonText, { color: colors.white }]}>Retake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.primary }]} onPress={() => handlePhotoUpload('donation')}>
            <Feather name="camera" size={24} color={colors.white} />
            <Text style={[styles.photoButtonText, { color: colors.white }]}>Take Donation Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Selfie with Donation</Text>
        <Text style={[styles.helperText, { color: colors.gray }]}>
          Take a selfie holding or near your donation items
        </Text>
        {selfiePhoto ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: selfiePhoto.image }} style={styles.photoPreview} />
            <View style={[styles.metadataContainer, { backgroundColor: colors.card }]}>
              {selfiePhoto.location && (
                <Text style={[styles.metadataText, { color: colors.text }]}>
                  Location: {selfiePhoto.location.coords.latitude.toFixed(6)}, {selfiePhoto.location.coords.longitude.toFixed(6)}
                </Text>
              )}
              <Text style={[styles.metadataText, { color: colors.text }]}>
                Time: {selfiePhoto.timestamp.toLocaleTimeString()}
              </Text>
              <Text style={[styles.metadataText, { color: colors.text }]}>
                Date: {selfiePhoto.timestamp.toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity style={[styles.retakeButton, { backgroundColor: colors.danger }]} onPress={() => handlePhotoUpload('selfie')}>
              <Feather name="refresh-cw" size={20} color={colors.white} />
              <Text style={[styles.retakeButtonText, { color: colors.white }]}>Retake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.primary }]} onPress={() => handlePhotoUpload('selfie')}>
            <Feather name="camera" size={24} color={colors.white} />
            <Text style={[styles.photoButtonText, { color: colors.white }]}>Take Selfie</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.securityInfo}>
          <Feather name="shield" size={20} color={colors.success} />
          <Text style={[styles.securityText, { color: colors.text }]}>
            Your photos are secured with geo-tagging and timestamp metadata
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Back" onPress={() => setStep(1)} variant="outline" />
        <Button 
          title={
            isSubmitted ? "View Request" : 
            isProcessing ? "Processing..." : 
            "Submit Donation"
          }
          onPress={() => {
            if (isSubmitted) {
              // Navigate to history tab with pending filter
              router.replace('/(tabs)/history');
            } else {
              console.log('Submit Donation button pressed');
              handleFinalSubmit();
            }
          }} 
          disabled={isProcessing}
        />
      </View>
      
      {isProcessing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Processing your donation...</Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.stepIndicatorContainer}>
        <View style={[styles.stepIndicator, step === 1 && { backgroundColor: colors.primary }]} />
        <View style={[styles.stepIndicator, step === 2 && { backgroundColor: colors.primary }]} />
      </View>
      {step === 1 ? renderStep1() : renderStep2()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 15,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 15,
    margin: 5,
    minWidth: 100,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  errorContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  errorItem: {
    fontSize: 14,
    marginBottom: 5,
  },
  errorFooter: {
    fontSize: 14,
    marginTop: 10,
    fontStyle: 'italic',
  },
  photoContainer: {
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 10,
  },
  metadataContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  metadataText: {
    fontSize: 12,
    marginBottom: 2,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 20,
    position: 'absolute',
    top: 10,
    right: 10,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 15,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  securityText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepIndicator: {
    width: 50,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default DonationForm;