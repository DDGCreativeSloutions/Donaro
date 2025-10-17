import AboutComponent from '@/components/AboutComponent';
import HelpComponent from '@/components/HelpComponent';
import PersonalInfoComponent from '@/components/PersonalInfoComponent';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ProfileScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const { user, logout, refreshUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    // Refresh user data when component mounts
    const loadUserData = async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error('Error refreshing user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('user');
      logout();
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if there's an error, still redirect to login
      router.replace('/login');
    }
  }, [logout, router]);

  const profileOptions = useMemo(() => [
    { icon: 'user', title: 'Personal Information', action: () => setActiveModal('personal-info') },
    { icon: 'help-circle', title: 'Help & Support', action: () => setActiveModal('help') },
    { icon: 'info', title: 'About Donaro', action: () => setActiveModal('about') },
  ], []);

  const renderModalContent = useCallback(() => {
    switch (activeModal) {
      case 'help':
        return <HelpComponent />;
      case 'about':
        return <AboutComponent />;
      case 'personal-info':
        return <PersonalInfoComponent />;
      default:
        return null;
    }
  }, [activeModal]);

  // Memoize stats calculation
  const stats = useMemo(() => {
    return {
      verifications: user?.totalDonations || 0,
      points: user?.totalCredits || 0,
      rewards: user ? Math.floor(user.withdrawableCredits / 100) : 0
    };
  }, [user]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>No user data available. Please log in again.</Text>
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.card, marginTop: 20 }]}
          onPress={() => router.replace('/login')}
        >
          <Text style={[styles.logoutText, { color: colors.primary }]}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ProtectedRoute>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scrollContainer}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, { backgroundColor: colors.white }]}>
                  <Feather name="user" size={40} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.userName}>{user?.name || 'Unknown User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'No email provided'}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.verifications}</Text>
              <Text style={[styles.statLabel, { color: colors.gray }]}>Verifications</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.points}</Text>
              <Text style={[styles.statLabel, { color: colors.gray }]}>Points</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>₹{stats.rewards}</Text>
              <Text style={[styles.statLabel, { color: colors.gray }]}>Rewards</Text>
            </View>
          </View>

          {/* Profile Options */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Settings</Text>
            <View style={[styles.optionsContainer, { backgroundColor: colors.card }]}>
              {profileOptions.map((option, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.optionItem, { borderBottomColor: index < profileOptions.length - 1 ? colors.border : 'transparent' }]}
                  onPress={option.action}
                >
                  <View style={styles.optionIconContainer}>
                    <Feather name={option.icon as any} size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.optionText, { color: colors.text }]}>{option.title}</Text>
                  <Feather name="chevron-right" size={20} color={colors.gray} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Logout */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.logoutButton, { backgroundColor: colors.card }]}
              onPress={handleLogout}
            >
              <Feather name="log-out" size={20} color={colors.danger} />
              <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modals */}
        <Modal
          visible={!!activeModal}
          animationType="slide"
          onRequestClose={() => setActiveModal(null)}
        >
          <View style={{ flex: 1 }}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card }]}>
              <TouchableOpacity 
                onPress={() => setActiveModal(null)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {renderModalContent()}
          </View>
        </Modal>
      </View>
    </ProtectedRoute>
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
    paddingBottom: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: -30,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
  },
  optionsContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 10,
  },
});

export default ProfileScreen;