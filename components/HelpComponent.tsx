import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const HelpComponent = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const faqs = [
    {
      question: 'How do I earn credits?',
      answer: 'You earn credits by making verified donations. Each donation is reviewed by our team and credits are awarded based on the type and value of your donation.'
    },
    {
      question: 'How do I withdraw my credits?',
      answer: 'Go to the Rewards section, tap on Withdraw Credits, and follow the instructions. You\'ll need to provide your bank details or UPI information.'
    },
    {
      question: 'What types of donations are accepted?',
      answer: 'We accept Food, Blood, Clothes, Books, and other essential items. All donations must be in good condition and meet our quality standards.'
    },
    {
      question: 'How long does verification take?',
      answer: 'Most donations are verified within 24-48 hours. During peak times, it may take slightly longer.'
    },
    {
      question: 'Is my personal information secure?',
      answer: 'Yes, we take your privacy seriously. All personal information is encrypted and stored securely. We never share your data with third parties without your consent.'
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollContainer}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <Text style={styles.headerSubtitle}>Find answers to common questions</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
            
            {faqs.map((faq, index) => (
              <View 
                key={index} 
                style={[styles.faqItem, { borderBottomColor: index < faqs.length - 1 ? colors.border : 'transparent' }]}
              >
                <Text style={[styles.question, { color: colors.text }]}>{faq.question}</Text>
                <Text style={[styles.answer, { color: colors.gray }]}>{faq.answer}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, marginTop: 20 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Support</Text>
            <View style={styles.contactItem}>
              <Feather name="mail" size={20} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}> support@donaro.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Feather name="phone" size={20} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}> +91 98765 43210</Text>
            </View>
            <View style={styles.contactItem}>
              <Feather name="message-circle" size={20} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}> Live Chat (9AM - 6PM IST)</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    marginTop: -30,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    padding: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  faqItem: {
    borderBottomWidth: 1,
    paddingBottom: 20,
    marginBottom: 20,
  },
  question: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 10,
  },
});

export default HelpComponent;