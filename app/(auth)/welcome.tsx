import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Button } from '../../src/components/Button';
import {
  AuthErrorText,
  AuthShell,
  GoogleSignInButton,
} from '../../src/features/auth/components';
import { AuthError, signInAsGuest, signInWithGoogle } from '../../src/lib/auth';
import { useTheme } from '../../src/theme/ThemeProvider';

/** Landing screen for signed-out users (auth gate target). */
export default function WelcomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [busy, setBusy] = useState<'google' | 'guest' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setBusy('google');
    try {
      await signInWithGoogle();
      // onAuthStateChange drives the gate from here.
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Google sign-in failed.');
    } finally {
      setBusy(null);
    }
  };

  const handleGuest = async () => {
    setError(null);
    setBusy('guest');
    try {
      await signInAsGuest();
    } catch (e) {
      setError(
        e instanceof AuthError
          ? e.message
          : 'Guest mode is not available right now.',
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <AuthShell
      title="Memory Trap"
      subtitle="Short memory games, a daily circuit, and friendly duels with your mates. No pressure — just play."
    >
      <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
        <GoogleSignInButton onPress={handleGoogle} loading={busy === 'google'} />
        <Button
          title="Continue with email"
          onPress={() => router.push('/(auth)/sign-in')}
        />
        <Button
          title="Play as guest"
          variant="secondary"
          onPress={handleGuest}
          loading={busy === 'guest'}
        />
      </View>
      <AuthErrorText message={error} />
      <Link
        href="/(auth)/onboarding"
        accessibilityLabel="See how Memory Trap works"
        style={[
          theme.type.labelLg,
          { color: theme.colors.primary, textAlign: 'center', paddingVertical: theme.spacing.sm },
        ]}
      >
        New here? See how it works
      </Link>
    </AuthShell>
  );
}
