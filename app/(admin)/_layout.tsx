import { Stack } from 'expo-router';
import React from 'react';

const AdminLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="admin-dashboard" />
      <Stack.Screen name="admin-profile" />
      <Stack.Screen name="admin-users" />
      <Stack.Screen name="pending-donations" />
      <Stack.Screen name="pending-withdrawals" />
    </Stack>
  );
};

export default AdminLayout;