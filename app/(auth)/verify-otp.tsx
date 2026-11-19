import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '../../src/components/Button';
import { TextField } from '../../src/components/TextField';
import { AuthErrorText, AuthShell } from '../../src/features/auth/components';
import { AuthError, sendEmailOtp, verifyEmailOtp } from '../../src/lib/auth';
import { useTheme } from '../../src/theme/ThemeProvider';

const RESEND_SECONDS = 30;

/** Email OTP step 2: enter the 6-digit code, with resend + cooldown. */
export default function VerifyOtpScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? '').toLowerCase();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'verify' | 'resend' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (!email) {
      setError('Missing email address. Go back and request a new code.');
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setError(null);
    setNotice(null);
    setBusy('verify');
    try {
      await verifyEmailOtp(email, code);
      // onAuthStateChange drives the gate from here.
    } catch (e) {
      setError(
        e instanceof AuthError
          ? e.message
          : 'That code did not work. Check it and try again.',
      );
    } finally {
      setBusy(null);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setError(null);
    setBusy('resend');
    try {
      await sendEmailOtp(email);
      setNotice('A new code is on its way to your email.');
      setCooldown(RESEND_SECONDS);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Could not resend the code.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AuthShell
      title="Check your email"
      subtitle={email ? `We sent a 6-digit code to ${email}.` : 'We sent you a 6-digit code.'}
    >
      <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.md }}>
        <TextField
          label="Sign-in code"
          value={code}
          onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="123456"
          keyboardType="number-pad"
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
          maxLength={6}
          accessibilityLabel="Six digit sign-in code"
          hint={notice ?? undefined}
          hintTone="success"
        />
        <Button title="Verify and sign in" onPress={handleVerify} loading={busy === 'verify'} />
        <Button
          title={cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
          variant="secondary"
          onPress={handleResend}
          disabled={cooldown > 0}
          loading={busy === 'resend'}
        />
        <Button title="Use a different email" variant="secondary" onPress={() => router.back()} />
      </View>
      <AuthErrorText message={error} />
    </AuthShell>
  );
}
