import Button from '@/components/Button';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const RewardsScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const { user, addCredits } = useUser();
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [error, setError] = useState('');

  const handleWithdraw = useCallback(() => {
    const amount = parseInt(withdrawalAmount);
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!user || amount > user.withdrawableCredits) {
      setError('Insufficient points');
      return;
    }
    
    // In a real app, this would call the API to process withdrawal
    alert(`Withdrawal request for ₹${amount / 100} submitted successfully!`);
    setWithdrawalAmount('');
    setError('');
  }, [withdrawalAmount, user]);

  const rewardTiers = useMemo(() => [
    { credits: 100, reward: '₹10 Cashback', description: 'For your first verification' },
    { credits: 500, reward: '₹50 Cashback', description: 'After 5 verifications' },
    { credits: 1000, reward: '₹150 Cashback + Gift', description: 'Milestone achievement' },
    { credits: 2500, reward: '₹500 Cashback + Gift', description: 'Top contributor' },
  ], []);

  const currentProgress = useMemo(() => {
    return user ? Math.min((user.totalCredits / 2500) * 100, 100) : 0;
  }, [user]);

  // Memoize balance values
  const balanceValues = useMemo(() => {
    return {
      totalCredits: user?.totalCredits || 0,
      withdrawable: user ? (user.withdrawableCredits / 100).toFixed(2) : '0.00'
    };
  }, [user]);

  return (
    <ProtectedRoute>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scrollContainer}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <Text style={styles.headerTitle}>Your Rewards</Text>
            <Text style={styles.headerSubtitle}>Earn points, get real rewards</Text>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={[styles.balanceLabel, { color: colors.gray }]}>Available Points</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
                <Text style={[styles.balanceHistory, { color: colors.primary }]}>History</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.balanceAmount, { color: colors.text }]}>
              {balanceValues.totalCredits} <Text style={styles.balanceCurrency}>points</Text>
            </Text>
            <Text style={[styles.balanceValue, { color: colors.gray }]}>
              ≈ ₹{balanceValues.withdrawable}
            </Text>
          </View>

          {/* Withdrawal Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Withdraw Points</Text>
            <View style={[styles.withdrawalCard, { backgroundColor: colors.card }]}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.gray }]}>Amount (points)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                    value={withdrawalAmount}
                    onChangeText={setWithdrawalAmount}
                    keyboardType="numeric"
                    placeholder="Enter amount"
                    placeholderTextColor={colors.gray}
                  />
                  <Text style={[styles.currencyLabel, { color: colors.text }]}>points</Text>
                </View>
              </View>
              
              <View style={styles.paymentMethods}>
                <Text style={[styles.inputLabel, { color: colors.gray }]}>Payment Method</Text>
                <View style={styles.paymentOptions}>
                  <TouchableOpacity 
                    style={[styles.paymentOption, { 
                      backgroundColor: paymentMethod === 'paypal' ? `${colors.primary}20` : colors.background,
                      borderColor: paymentMethod === 'paypal' ? colors.primary : colors.border
                    }]}
                    onPress={() => setPaymentMethod('paypal')}
                  >
                    <Feather name="credit-card" size={20} color={paymentMethod === 'paypal' ? colors.primary : colors.gray} />
                    <Text style={[styles.paymentText, { 
                      color: paymentMethod === 'paypal' ? colors.primary : colors.gray 
                    }]}>PayPal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.paymentOption, { 
                      backgroundColor: paymentMethod === 'bank' ? `${colors.primary}20` : colors.background,
                      borderColor: paymentMethod === 'bank' ? colors.primary : colors.border
                    }]}
                    onPress={() => setPaymentMethod('bank')}
                  >
                    <Feather name="home" size={20} color={paymentMethod === 'bank' ? colors.primary : colors.gray} />
                    <Text style={[styles.paymentText, { 
                      color: paymentMethod === 'bank' ? colors.primary : colors.gray 
                    }]}>Bank Transfer</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <Button 
                title="Withdraw Points" 
                onPress={handleWithdraw}
                disabled={!user || user.withdrawableCredits === 0}
              />
            </View>
          </View>

          {/* Progress Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Rewards Progress</Text>
            <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { backgroundColor: colors.border }]} />
                <View 
                  style={[styles.progressFill, { 
                    backgroundColor: colors.primary, 
                    width: `${currentProgress}%` 
                  }]} 
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressText, { color: colors.gray }]}>0</Text>
                <Text style={[styles.progressText, { color: colors.gray }]}>2500</Text>
              </View>
              <Text style={[styles.progressInfo, { color: colors.text }]}>
                {user?.totalCredits || 0} / 2500 points
              </Text>
            </View>
          </View>

          {/* Reward Tiers */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Reward Tiers</Text>
            <View style={styles.tiersContainer}>
              {rewardTiers.map((tier, index) => (
                <View 
                  key={index} 
                  style={[styles.tierCard, { 
                    backgroundColor: colors.card,
                    borderColor: user && user.totalCredits >= tier.credits ? colors.success : colors.border
                  }]}
                >
                  <View style={styles.tierHeader}>
                    <View style={[styles.tierIcon, { backgroundColor: `${colors.primary}20` }]}>
                      <Feather 
                        name={user && user.totalCredits >= tier.credits ? 'check-circle' : 'gift'} 
                        size={20} 
                        color={user && user.totalCredits >= tier.credits ? colors.success : colors.primary} 
                      />
                    </View>
                    <View style={styles.tierInfo}>
                      <Text style={[styles.tierReward, { color: colors.text }]}>{tier.reward}</Text>
                      <Text style={[styles.tierDescription, { color: colors.gray }]}>{tier.description}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tierCredits, { color: colors.gray }]}>
                    {tier.credits} points
                  </Text>
                </View>
              ))}
            </View>
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
  balanceCard: {
    marginHorizontal: 20,
    marginTop: -30,
    padding: 25,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  balanceHistory: {
    fontSize: 16,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 5,
  },
  balanceCurrency: {
    fontSize: 18,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '600',
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
  withdrawalCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  paymentMethods: {
    marginBottom: 20,
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 5,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 15,
    textAlign: 'center',
  },
  progressCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  progressBarContainer: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBar: {
    position: 'absolute',
    height: '100%',
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressInfo: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tiersContainer: {
    marginBottom: 30,
  },
  tierCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tierIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  tierInfo: {
    flex: 1,
  },
  tierReward: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
  },
  tierDescription: {
    fontSize: 14,
  },
  tierCredits: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RewardsScreen;