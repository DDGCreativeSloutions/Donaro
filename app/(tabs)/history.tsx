import ProtectedRoute from '@/components/ProtectedRoute';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { apiService, Donation } from '@/services/api';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * History screen that displays a user's donation verification history
 */
const HistoryScreen = () => {
  const router = useRouter();
  const { filter: initialFilter } = useLocalSearchParams(); // Get filter from URL params
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const { user } = useUser();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  /**
   * Set initial filter from URL params if provided
   */
  useEffect(() => {
    if (initialFilter && typeof initialFilter === 'string' && ['all', 'pending', 'approved', 'rejected'].includes(initialFilter)) {
      setFilter(initialFilter);
    }
  }, [initialFilter]);

  /**
   * Load donations when user or filter changes
   */
  useEffect(() => {
    loadDonations();
  }, [user, filter]);

  /**
   * Load user's donations from the API
   */
  const loadDonations = async () => {
    if (user) {
      try {
        const userDonations = await apiService.getDonations(user.id);
        setDonations(userDonations);
      } catch (error) {
        console.error('Error loading verifications:', error);
      }
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDonations();
    setRefreshing(false);
  };

  /**
   * Filter donations based on selected filter
   */
  const filteredDonations = useMemo(() => {
    if (filter === 'all') return donations;
    return donations.filter(donation => donation.status === filter);
  }, [donations, filter]);

  /**
   * Calculate statistics for display
   */
  const stats = useMemo(() => {
    return {
      total: donations.length,
      approved: donations.filter(d => d.status === 'approved').length,
      pending: donations.filter(d => d.status === 'pending').length
    };
  }, [donations]);

  /**
   * Render a single donation item
   */
  const renderDonationItem = useMemo(() => (donation: Donation) => (
    <View key={donation.id} style={[styles.donationItem, { backgroundColor: colors.card }]}>
      <View style={styles.donationHeader}>
        <View style={styles.donationIconContainer}>
          <Feather 
            name={
              donation.type === 'food' ? 'coffee' : 
              donation.type === 'blood' ? 'droplet' : 
              donation.type === 'clothes' ? 'archive' : 
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
          <Text style={[styles.donationDate, { color: colors.gray }]}>
            {donation.date} at {donation.time}
          </Text>
        </View>
        <View style={[styles.donationCredits, { backgroundColor: `${colors.primary}20` }]}>
          <Text style={[styles.creditsText, { color: colors.primary }]}>
            +{donation.credits}
          </Text>
        </View>
      </View>
      
      <View style={styles.donationDetails}>
        <View style={styles.detailRow}>
          <Feather name="map-pin" size={16} color={colors.gray} />
          <Text style={[styles.detailText, { color: colors.gray }]} numberOfLines={1}>
            {donation.location}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Feather name="package" size={16} color={colors.gray} />
          <Text style={[styles.detailText, { color: colors.gray }]}>
            {donation.quantity}
          </Text>
        </View>
        
        {donation.receiver && (
          <View style={styles.detailRow}>
            <Feather name="user" size={16} color={colors.gray} />
            <Text style={[styles.detailText, { color: colors.gray }]}>
              {donation.receiver}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.donationFooter}>
        <View style={[styles.statusBadge, { backgroundColor: 
          donation.status === 'approved' ? `${colors.success}20` : 
          donation.status === 'rejected' ? `${colors.danger}20` : 
          `${colors.accent}20`
        }]}>
          <Text style={[styles.statusText, { color: 
            donation.status === 'approved' ? colors.success : 
            donation.status === 'rejected' ? colors.danger : 
            colors.accent
          }]}>
            {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
          </Text>
        </View>
        
        <Text style={[styles.description, { color: colors.gray }]} numberOfLines={2}>
          {donation.description}
        </Text>
      </View>
    </View>
  ), [colors]);

  return (
    <ProtectedRoute>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Verification History</Text>
          <Text style={styles.headerSubtitle}>Track all your contributions</Text>
        </View>
        
        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {/* Filter Tabs */}
          <View style={[styles.filterContainer, { backgroundColor: colors.card }]}>
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterTab, { 
                  backgroundColor: filter === status ? `${colors.primary}20` : 'transparent',
                  borderBottomColor: filter === status ? colors.primary : 'transparent'
                }]}
                onPress={() => setFilter(status)}
              >
                <Text style={[styles.filterText, { 
                  color: filter === status ? colors.primary : colors.gray 
                }]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Stats Summary */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.gray }]}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.success }]}>{stats.approved}</Text>
              <Text style={[styles.statLabel, { color: colors.gray }]}>Approved</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.pending}</Text>
              <Text style={[styles.statLabel, { color: colors.gray }]}>Pending</Text>
            </View>
          </View>
          
          {/* Verifications List */}
          <View style={styles.section}>
            {filteredDonations.length > 0 ? (
              <View style={styles.donationsList}>
                {filteredDonations.map(renderDonationItem)}
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <Feather name="check-circle" size={48} color={colors.gray} />
                <Text style={[styles.emptyStateText, { color: colors.gray }]}>
                  {filter === 'all' ? 'No verifications yet' : `No ${filter} verifications`}
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.gray }]}>
                  {filter === 'all' ? 'Start verifying donations today' : `You don't have any ${filter} verifications`}
                </Text>
                {filter === 'all' && (
                  <TouchableOpacity 
                    style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/(tabs)/donate')}
                  >
                    <Text style={[styles.emptyStateButtonText, { color: colors.white }]}>Verify a Donation</Text>
                  </TouchableOpacity>
                )}
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
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    padding: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
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
    marginTop: 20,
    marginBottom: 30,
  },
  donationsList: {
    marginBottom: 30,
  },
  donationItem: {
    borderRadius: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  donationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
  },
  donationDate: {
    fontSize: 14,
  },
  donationCredits: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  creditsText: {
    fontSize: 14,
    fontWeight: '700',
  },
  donationDetails: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  donationFooter: {
    padding: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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

export default HistoryScreen;