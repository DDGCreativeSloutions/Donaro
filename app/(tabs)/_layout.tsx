import ProtectedRoute from '@/components/ProtectedRoute';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

/**
 * Tab layout component that defines the bottom tab navigation
 */
const TabLayout = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  /**
   * Common tab bar icon component
   */
  const TabBarIcon = ({ 
    name, 
    color 
  }: { 
    name: React.ComponentProps<typeof Feather>['name']; 
    color: string; 
  }) => (
    <Feather 
      name={name} 
      size={Platform.OS === 'web' ? 24 : 20} 
      color={color} 
      style={{ marginBottom: Platform.OS === 'web' ? 4 : 2 }}
    />
  );

  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.gray,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            height: Platform.OS === 'web' ? 80 : 70,
            paddingBottom: Platform.OS === 'web' ? 10 : 5,
            paddingTop: Platform.OS === 'web' ? 10 : 5,
          },
          tabBarLabelStyle: {
            fontSize: Platform.OS === 'web' ? 12 : 10,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="donate"
          options={{
            title: 'Verify',
            tabBarIcon: ({ color }) => <TabBarIcon name="plus-circle" color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          }}
        />
        <Tabs.Screen
          name="rewards"
          options={{
            title: 'Rewards',
            tabBarIcon: ({ color }) => <TabBarIcon name="award" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
};

export default TabLayout;