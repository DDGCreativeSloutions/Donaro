import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TermsScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Terms of Service</Text>
          <Text style={[styles.date, { color: colors.gray }]}>Last Updated: October 15, 2025</Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Acceptance of Terms</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            By accessing or using the Donaro application, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this app.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Description of Service</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Donaro is a mobile application that allows users to verify community donations and earn rewards in the form of credits. These credits can be redeemed for various rewards as determined by the app administrators.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>3. User Accounts</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            To access certain features of the app, you may be required to create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>4. User Responsibilities</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            You are responsible for maintaining the confidentiality of your account and password and for restricting access to your device. You agree to accept responsibility for all activities that occur under your account or password.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Prohibited Activities</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            You agree not to engage in any of the following prohibited activities:
          </Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Using the app for any illegal purpose</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Attempting to gain unauthorized access to the app</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Submitting false or fraudulent donation verifications</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Interfering with or disrupting the app</Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Intellectual Property</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            The app and its original content, features, and functionality are owned by Donaro and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Termination</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Changes to Terms</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>9. Contact Information</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            If you have any questions about these Terms, please contact us at support@donaro.com.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    margin: 20,
  },
  card: {
    borderRadius: 20,
    padding: 25,
    elevation: 5,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  date: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 24,
    marginLeft: 20,
    marginBottom: 5,
  },
});

export default TermsScreen;