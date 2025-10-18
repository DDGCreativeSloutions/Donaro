import Button from '@/components/Button';
import Input from '@/components/Input';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useUser } from '@/contexts/UserContext';
import { apiService } from '@/services/api';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

const PersonalInfoComponent = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];
  const { user, refreshUser } = useUser();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !email || !phone) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      // Update user data
      const updatedUser = await apiService.updateUser(user!.id, {
        name,
        email,
        phone,
      });

      if (updatedUser) {
        // Refresh user context
        await refreshUser();
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully.');
      }
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollContainer}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Personal Information</Text>
          <Text style={styles.headerSubtitle}>Manage your account details</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Details</Text>
              
              <View style={styles.inputContainer}>
                <Feather name="user" size={20} color={colors.gray} style={styles.inputIcon} />
                <Input
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                  editable={isEditing}
                  style={styles.input}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} color={colors.gray} style={styles.inputIcon} />
                <Input
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  editable={isEditing}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Feather name="phone" size={20} color={colors.gray} style={styles.inputIcon} />
                <Input
                  placeholder="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  editable={isEditing}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Statistics</Text>
              
              <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{user?.totalDonations || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.gray }]}>Total Donations</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{user?.totalCredits || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.gray }]}>Total Credits</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{user?.lifetimeCredits || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.gray }]}>Lifetime Credits</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{user?.withdrawableCredits || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.gray }]}>Withdrawable Credits</Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              {!isEditing ? (
                <Button 
                  title="Edit Profile" 
                  onPress={() => setIsEditing(true)}
                  style={styles.editButton}
                />
              ) : (
                <>
                  <Button 
                    title={isLoading ? "Saving..." : "Save Changes"} 
                    onPress={handleSave}
                    disabled={isLoading}
                    style={styles.saveButton}
                  />
                  <Button 
                    title="Cancel" 
                    onPress={() => {
                      // Reset form values to original
                      setName(user?.name || '');
                      setEmail(user?.email || '');
                      setPhone(user?.phone || '');
                      setIsEditing(false);
                    }}
                    style={styles.cancelButton}
                  />
                </>
              )}
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
  },
  card: {
    borderRadius: 20,
    padding: 25,
    elevation: 5,
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  input: {
    flex: 1,
    paddingLeft: 45,
    paddingRight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 2,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 20,
  },
  editButton: {
    borderRadius: 16,
    paddingVertical: 18,
  },
  saveButton: {
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 15,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 18,
  },
  cancelButtonText: {
    color: '#6C63FF',
  },
});

export default PersonalInfoComponent;