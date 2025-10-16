import DonationForm from '@/components/DonationForm';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const VerifyDonationScreen = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const router = useRouter();

  return (
    <ProtectedRoute>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Verify Donation</Text>
          <Text style={styles.headerSubtitle}>Help verify community contributions</Text>
        </View>
        <View style={styles.content}>
          <DonationForm />
        </View>
      </View>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
});

export default VerifyDonationScreen;