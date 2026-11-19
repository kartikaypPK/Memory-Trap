import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '../../src/components/Avatar';
import { Button } from '../../src/components/Button';
import { TextField } from '../../src/components/TextField';
import { AgeConfirmRow, AuthErrorText, AuthShell } from '../../src/features/auth/components';
import { AuthError, createProfile, isHandleAvailable, signOut } from '../../src/lib/auth';
import { AVATARS, DEFAULT_AVATAR_ID } from '../../src/lib/avatars';
import { useSessionStore } from '../../src/store/session';
import { useTheme } from '../../src/theme/ThemeProvider';

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

type HandleState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'invalid'; message: string }
  | { kind: 'taken' }
  | { kind: 'available' }
  | { kind: 'error'; message: string };

/**
 * Profile setup (docs/03 missing screen 2): display name, unique @handle,
 * one of 24 local avatars, and the 13+ age confirmation. Submitting calls
 * the create_profile RPC — profiles has no INSERT RLS policy, so the row
 * can only be created through that SECURITY DEFINER function, which also
 * generates the friend_tag.
 */
export default function ProfileSetupScreen() {
  const { theme } = useTheme();
  const refreshProfile = useSessionStore((s) => s.refreshProfile);
  const isAnonymous = useSessionStore((s) => s.isAnonymous);

  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [handleState, setHandleState] = useState<HandleState>({ kind: 'idle' });
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkHandle = useCallback((value: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!HANDLE_RE.test(value)) {
      setHandleState({
        kind: 'invalid',
        message: '3–20 characters: lowercase letters, numbers or underscore.',
      });
      return;
    }
    setHandleState({ kind: 'checking' });
    debounce.current = setTimeout(() => {
      isHandleAvailable(value)
        .then((available) =>
          setHandleState(available ? { kind: 'available' } : { kind: 'taken' }),
        )
        .catch((e) =>
          setHandleState({
            kind: 'error',
            message: e instanceof AuthError ? e.message : 'Could not check that handle.',
          }),
        );
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  const nameValid = displayName.trim().length >= 2 && displayName.trim().length <= 24;
  const canSubmit =
    nameValid && handleState.kind === 'available' && ageConfirmed && !submitting;

  const handleHint =
    handleState.kind === 'checking'
      ? 'Checking availability…'
      : handleState.kind === 'invalid'
        ? handleState.message
        : handleState.kind === 'taken'
          ? 'That handle is already taken.'
          : handleState.kind === 'available'
            ? 'That handle is available.'
            : handleState.kind === 'error'
              ? handleState.message
              : 'This is your unique @handle for friends and duels.';
  const handleHintTone =
    handleState.kind === 'available'
      ? 'success'
      : handleState.kind === 'taken' || handleState.kind === 'invalid' || handleState.kind === 'error'
        ? 'error'
        : 'muted';

  const handleSubmit = async () => {
    setError(null);
    if (!ageConfirmed) {
      setError('Please confirm you are 13 or older to continue.');
      return;
    }
    setSubmitting(true);
    try {
      await createProfile({ displayName, handle, avatarId });
      await refreshProfile();
      // The auth gate moves the user into the tabs once the profile lands.
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Could not create your profile.');
      // If the RPC says the handle went in the meantime, refresh the hint.
      if (e instanceof AuthError && /taken/i.test(e.message)) {
        setHandleState({ kind: 'taken' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Set up your profile"
      subtitle={
        isAnonymous
          ? 'You are playing as a guest — set up a profile to keep your progress on this device.'
          : 'How other players will see you in games and duels.'
      }
    >
      <View style={{ gap: theme.spacing.md }}>
        <TextField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="e.g. Alex"
          maxLength={24}
          autoComplete="name"
          accessibilityLabel="Display name"
          hint={
            displayName.length > 0 && !nameValid
              ? 'Display names are 2–24 characters.'
              : undefined
          }
          hintTone="error"
        />
        <TextField
          label="Handle"
          value={handle}
          onChangeText={(text) => {
            const next = text.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
            setHandle(next);
            checkHandle(next);
          }}
          placeholder="e.g. alex_plays"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Handle"
          hint={handleHint}
          hintTone={handleHintTone}
        />

        <View style={{ gap: theme.spacing.sm }}>
          <Text style={[theme.type.labelLg, { color: theme.colors.text }]}>Pick an avatar</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {AVATARS.map((avatar) => {
              const selected = avatar.id === avatarId;
              return (
                <Pressable
                  key={avatar.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Avatar ${avatar.label}`}
                  onPress={() => setAvatarId(avatar.id)}
                  style={{
                    width: 52,
                    height: 52,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: theme.radius.pill,
                    borderWidth: selected ? 3 : 0,
                    borderColor: theme.colors.primary,
                  }}
                >
                  <Avatar avatarId={avatar.id} size={44} />
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <Avatar avatarId={avatarId} size={32} />
            <Text style={[theme.type.bodyMd, { color: theme.colors.textSecondary }]}>
              Preview — {AVATARS.find((a) => a.id === avatarId)?.label}
            </Text>
            <MaterialIcons name="check-circle" size={18} color={theme.colors.successText} />
          </View>
        </View>

        <AgeConfirmRow value={ageConfirmed} onValueChange={setAgeConfirmed} />
        <AuthErrorText message={error} />
        <Button
          title="Start playing"
          onPress={handleSubmit}
          loading={submitting}
          disabled={!canSubmit}
        />
        <Button
          title="Sign out"
          variant="secondary"
          onPress={() => {
            signOut().catch(() => undefined);
          }}
        />
      </View>
    </AuthShell>
  );
}
