import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiService, Donation, User } from '@/services/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonations: 0,
    pendingDonations: 0,
    totalCredits: 0,
  });
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const router = useRouter();

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all donations to calculate stats
      const allDonations = await apiService.getAllDonations();
      const pendingDonations = await apiService.getPendingDonations();

      // Calculate stats
      const totalDonations = allDonations.length;
      const totalCredits = allDonations
        .filter(d => d.status === 'approved')
        .reduce((sum, d) => sum + d.credits, 0);

      setStats({
        totalUsers: 0, // Would need separate API call
        totalDonations,
        pendingDonations: pendingDonations.length,
        totalCredits,
      });

      // Get recent donations (last 5)
      const recent = allDonations
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
        .slice(0, 5);
      setRecentDonations(recent);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const StatCard = ({ title, value, color }: { title: string; value: string | number; color: string }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );

  const DonationItem = ({ donation }: { donation: Donation }) => (
    <View style={[styles.donationItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.donationHeader}>
        <Text style={[styles.donationTitle, { color: colors.text }]}>{donation.title}</Text>
        <Text style={[styles.donationStatus, {
          color: donation.status === 'approved' ? colors.success :
                 donation.status === 'rejected' ? colors.danger : colors.accent
        }]}>
          {donation.status.toUpperCase()}
        </Text>
      </View>
      <Text style={[styles.donationDescription, { color: colors.text + '80' }]}>
        {donation.description}
      </Text>
      <Text style={[styles.donationCredits, { color: colors.primary }]}>
        Credits: {donation.credits}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Admin Dashboard</Text>
        <TouchableOpacity
          style={[styles.profileButton, { borderColor: colors.primary }]}
          onPress={() => {
            // TODO: Navigate to admin profile once component is created
            Alert.alert('Info', 'Admin profile component coming soon');
          }}
        >
          <Text style={[styles.profileButtonText, { color: colors.primary }]}>Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <StatCard title="Total Users" value={stats.totalUsers} color={colors.primary} />
        <StatCard title="Total Donations" value={stats.totalDonations} color={colors.secondary} />
        <StatCard title="Pending" value={stats.pendingDonations} color={colors.accent} />
        <StatCard title="Total Credits" value={stats.totalCredits} color={colors.success} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Donations</Text>
          <TouchableOpacity onPress={() => {
            Alert.alert('Info', 'Pending donations view coming soon');
          }}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentDonations.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptyStateText, { color: colors.text + '60' }]}>
              No donations yet
            </Text>
          </View>
        ) : (
          recentDonations.map((donation) => (
            <DonationItem key={donation.id} donation={donation} />
          ))
        )}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            Alert.alert('Info', 'Pending donations view coming soon');
          }}
        >
          <Text style={styles.actionButtonText}>Review Donations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          onPress={() => {
            Alert.alert('Info', 'User management view coming soon');
          }}
        >
          <Text style={styles.actionButtonText}>Manage Users</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
  },
  profileButtonText: {
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
  },
  donationItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  donationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  donationStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  donationDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  donationCredits: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
  },
  quickActions: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default AdminDashboard;