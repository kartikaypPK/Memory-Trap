import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { Button } from '../../src/components/Button';
import { TextField } from '../../src/components/TextField';
import {
  AuthErrorText,
  AuthShell,
  GoogleSignInButton,
} from '../../src/features/auth/components';
import { AuthError, sendEmailOtp, signInAsGuest, signInWithGoogle } from '../../src/lib/auth';
import { useTheme } from '../../src/theme/ThemeProvider';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sign-in: Google (when configured), email OTP (sends a code, then routes
 * to verify-otp), or guest mode.
 */
export default function SignInScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<'google' | 'email' | 'guest' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setError(null);
    setBusy('google');
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Google sign-in failed.');
    } finally {
      setBusy(null);
    }
  };

  const handleEmail = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setBusy('email');
    try {
      await sendEmailOtp(trimmed);
      router.push({ pathname: '/(auth)/verify-otp', params: { email: trimmed } });
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Could not send the code. Try again.');
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
      setError(e instanceof AuthError ? e.message : 'Guest mode is not available right now.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to keep your streak, XP and duels in sync.">
      <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.md }}>
        <GoogleSignInButton onPress={handleGoogle} loading={busy === 'google'} />
        <TextField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          accessibilityLabel="Email address"
        />
        <Button title="Email me a sign-in code" onPress={handleEmail} loading={busy === 'email'} />
        <Button
          title="Play as guest"
          variant="secondary"
          onPress={handleGuest}
          loading={busy === 'guest'}
        />
      </View>
      <AuthErrorText message={error} />
      <Link
        href="/(auth)/welcome"
        style={[
          theme.type.labelLg,
          { color: theme.colors.primary, textAlign: 'center', paddingVertical: theme.spacing.sm },
        ]}
      >
        Back
      </Link>
    </AuthShell>
  );
}
