import ProtectedRoute from '@/components/ProtectedRoute';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { apiService, Donation } from '@/services/api';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * Dashboard screen that displays user's overview and recent activity
 */
const DashboardScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const { user, refreshUser } = useUser();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Load donations when user changes
   */
  useEffect(() => {
    loadDonations();
  }, [user]);

  /**
   * Load user's recent donations from the API
   */
  const loadDonations = async () => {
    if (user) {
      try {
        const userDonations = await apiService.getDonations(user.id);
        setDonations(userDonations.slice(0, 3)); // Show only last 3 verifications
      } catch (error) {
        console.error('Error loading verifications:', error);
      }
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    await loadDonations();
    setRefreshing(false);
  }, [refreshUser]);

  /**
   * Render a stat card component
   */
  const renderStatCard = useCallback((title: string, value: string | number, icon: string, color: string) => (
    <TouchableOpacity 
      style={[styles.statCard, { backgroundColor: colors.card }]}
      onPress={() => router.push('/(tabs)/rewards')}
    >
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Feather name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.statTextContainer}>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: colors.gray }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  ), [colors, router]);

  /**
   * Render a donation item component
   */
  const renderDonationItem = useCallback((donation: Donation) => (
    <View key={donation.id} style={[styles.donationItem, { backgroundColor: colors.card }]}>
      <View style={styles.donationIconContainer}>
        <Feather 
          name={
            donation.type === 'food' ? 'coffee' : 
            donation.type === 'blood' ? 'droplet' : 
            donation.type === 'clothes' ? 'shopping-bag' : 
            donation.type === 'books' ? 'book-open' : 'gift'
          } 
          size={20} 
          color={colors.primary} 
        />
      </View>
      <View style={styles.donationInfo}>
        <Text style={[styles.donationTitle, { color: colors.text }]} numberOfLines={1}>
          {donation.title}
        </Text>
        <Text style={[styles.donationMeta, { color: colors.gray }]} numberOfLines={1}>
          {donation.date} • {donation.location}
        </Text>
      </View>
      <View style={[styles.donationStatus, { backgroundColor: 
        donation.status === 'approved' ? `${colors.success}20` : 
        donation.status === 'rejected' ? `${colors.danger}20` : 
        `${colors.accent}20`
      }]}>
        <Text style={[styles.donationStatusText, { color: 
          donation.status === 'approved' ? colors.success : 
          donation.status === 'rejected' ? colors.danger : 
          colors.accent
        }]}>
          {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
        </Text>
      </View>
    </View>
  ), [colors]);

  /**
   * Calculate user stats
   */
  const stats = useMemo(() => {
    return {
      totalCredits: user?.totalCredits || 0,
      totalDonations: user?.totalDonations || 0,
      withdrawable: user ? Math.floor(user.withdrawableCredits / 100) : 0
    };
  }, [user]);

  return (
    <ProtectedRoute>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName}>{user?.name || 'Verifier'}</Text>
              </View>
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => router.push('/(tabs)/profile')}
              >
                <Feather name="user" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {renderStatCard('Total Points', stats.totalCredits, 'award', colors.primary)}
            {renderStatCard('Verifications', stats.totalDonations, 'check-circle', colors.secondary)}
            {renderStatCard('Rewards', '₹' + stats.withdrawable, 'dollar-sign', colors.accent)}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            </View>
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                onPress={() => router.push('/(tabs)/donate')}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                  <Feather name="plus-circle" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.actionText, { color: colors.text }]}>Verify Donation</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.card }]}
                onPress={() => router.push('/(tabs)/rewards')}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: `${colors.secondary}20` }]}>
                  <Text style={{ fontSize: 24, color: colors.secondary }}>₹</Text>
                </View>
                <Text style={[styles.actionText, { color: colors.text }]}>Withdraw Points</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Verifications */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Verifications</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {donations.length > 0 ? (
              <View style={styles.donationsList}>
                {donations.map(renderDonationItem)}
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <Feather name="check-circle" size={48} color={colors.gray} />
                <Text style={[styles.emptyStateText, { color: colors.gray }]}>No verifications yet</Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.gray }]}>Start verifying donations today</Text>
                <TouchableOpacity 
                  style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/(tabs)/donate')}
                >
                  <Text style={[styles.emptyStateButtonText, { color: colors.white }]}>Verify Your First Donation</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
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
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 5,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    elevation: 3,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  statTextContainer: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  donationsList: {
    marginBottom: 30,
  },
  donationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    elevation: 2,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  donationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  donationInfo: {
    flex: 1,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  donationMeta: {
    fontSize: 14,
  },
  donationStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  donationStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 2,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DashboardScreen;