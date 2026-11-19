import { Stack } from 'expo-router';
import React from 'react';

import { useTheme } from '../../src/theme/ThemeProvider';

export default function AuthLayout() {
  const { theme } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bg },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="profile-setup" />
    </Stack>
  );
}
