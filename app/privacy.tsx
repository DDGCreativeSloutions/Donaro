import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PrivacyScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
          <Text style={[styles.date, { color: colors.gray }]}>Last Updated: October 15, 2025</Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Information We Collect</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            We collect information you provide directly to us, including:
          </Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Name and contact information</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Email address and phone number</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Photos submitted for donation verification</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Location data associated with donations</Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>2. How We Use Your Information</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            We use the information we collect to:
          </Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Provide, maintain, and improve our services</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Process and verify your donations</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Communicate with you about your account</Text>
          <Text style={[styles.listItem, { color: colors.text }]}>• Prevent fraud and ensure security</Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Information Sharing</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website, conducting our business, or servicing you, so long as those parties agree to keep this information confidential.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Data Security</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Data Retention</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            We will retain your information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Your Rights</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            You have the right to access, update, or delete your personal information at any time. You may also have the right to data portability and the right to object to certain processing activities it.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Children's Privacy</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            Our service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Changes to Privacy Policy</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>9. Contact Us</Text>
          <Text style={[styles.text, { color: colors.text }]}>
            If you have any questions about this Privacy Policy, please contact us at privacy@donaro.com.
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

export default PrivacyScreen;