import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const AboutComponent = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollContainer}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>About Donaro</Text>
          <Text style={styles.headerSubtitle}>Learn more about our mission</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Feather name="heart" size={50} color={colors.primary} style={styles.icon} />
            <Text style={[styles.title, { color: colors.text }]}>Donaro</Text>
            <Text style={[styles.version, { color: colors.gray }]}>Version 1.0.0</Text>
            
            <Text style={[styles.description, { color: colors.text }]}>
              Donaro is a revolutionary platform that empowers individuals to make a positive impact in their communities 
              while earning rewards for their generosity. Our mission is to create a seamless bridge between donors and those in need, 
              ensuring that every contribution is verified, valued, and appreciated.
            </Text>
            
            <Text style={[styles.description, { color: colors.text }]}>
              Through our innovative credit system, we incentivize regular giving and create a sustainable ecosystem of compassion 
              and community support. Every verified donation earns you credits that can be redeemed for rewards or withdrawn as cash.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, marginTop: 20 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Our Values</Text>
            
            <View style={styles.valueItem}>
              <Feather name="check-circle" size={20} color="#10B981" style={styles.valueIcon} />
              <View>
                <Text style={[styles.valueTitle, { color: colors.text }]}>Transparency</Text>
                <Text style={[styles.valueDescription, { color: colors.gray }]}>
                  We believe in complete transparency in how donations are used and how credits are earned.
                </Text>
              </View>
            </View>
            
            <View style={styles.valueItem}>
              <Feather name="shield" size={20} color="#10B981" style={styles.valueIcon} />
              <View>
                <Text style={[styles.valueTitle, { color: colors.text }]}>Security</Text>
                <Text style={[styles.valueDescription, { color: colors.gray }]}>
                  Your data and transactions are protected with industry-leading security measures.
                </Text>
              </View>
            </View>
            
            <View style={styles.valueItem}>
              <Feather name="users" size={20} color="#10B981" style={styles.valueIcon} />
              <View>
                <Text style={[styles.valueTitle, { color: colors.text }]}>Community</Text>
                <Text style={[styles.valueDescription, { color: colors.gray }]}>
                  We're building a community of givers who support each other and their neighborhoods.
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, marginTop: 20 }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
            
            <View style={styles.contactItem}>
              <Feather name="mail" size={20} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}> info@donaro.com</Text>
            </View>
            
            <View style={styles.contactItem}>
              <Feather name="globe" size={20} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}> www.donaro.com</Text>
            </View>
            
            <View style={styles.contactItem}>
              <Feather name="map-pin" size={20} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.text }]}> Mumbai, India</Text>
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
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 5,
  },
  version: {
    fontSize: 16,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  valueIcon: {
    marginTop: 3,
    marginRight: 15,
  },
  valueTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 5,
  },
  valueDescription: {
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

export default AboutComponent;