import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../src/components/Button';
import { AgeConfirmRow, AuthErrorText } from '../../src/features/auth/components';
import { useSessionStore } from '../../src/store/session';
import { useTheme } from '../../src/theme/ThemeProvider';
import { maxContentWidth } from '../../src/theme/theme';

const SLIDES = [
  {
    icon: 'psychology' as const,
    title: 'Eight quick games',
    body: 'Pattern Recall, Card Match, Number Flash and five more — each round takes a minute or two.',
  },
  {
    icon: 'whatshot' as const,
    title: 'A daily circuit, a growing streak',
    body: 'Finish the 3-game Daily Mind Circuit for double XP, keep your streak alive, and climb the weekly league.',
  },
  {
    icon: 'sports-esports' as const,
    title: 'Duel your friends',
    body: 'Challenge a friend to a 3-round duel on the same games. Reactions are preset — friendly and fair, no chat.',
  },
];

/** 3-slide onboarding. The last slide carries the 13+ age confirmation;
 * finishing marks onboarding as seen so the gate stops routing here. */
export default function OnboardingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const markOnboardingSeen = useSessionStore((s) => s.markOnboardingSeen);
  const [index, setIndex] = useState(0);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const finish = () => {
    if (!ageConfirmed) {
      setError('Please confirm you are 13 or older to continue.');
      return;
    }
    markOnboardingSeen();
    router.replace('/(auth)/sign-in');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top', 'bottom']}>
      <View
        style={{
          flex: 1,
          padding: theme.spacing.screen,
          gap: theme.spacing.md,
          maxWidth: maxContentWidth,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: theme.radius.hero,
              backgroundColor: theme.colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name={slide.icon} size={48} color={theme.colors.primary} />
          </View>
          <Text style={[theme.type.headlineLg, { color: theme.colors.text, textAlign: 'center' }]}>
            {slide.title}
          </Text>
          <Text
            style={[theme.type.bodyLg, { color: theme.colors.textSecondary, textAlign: 'center' }]}
          >
            {slide.body}
          </Text>
        </View>

        {/* Step dots — always paired with the slide title text above. */}
        <View
          style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing.sm }}
          accessibilityLabel={`Step ${index + 1} of ${SLIDES.length}`}
        >
          {SLIDES.map((s, i) => (
            <View
              key={s.title}
              style={{
                width: i === index ? 24 : 10,
                height: 10,
                borderRadius: theme.radius.pill,
                backgroundColor: i === index ? theme.colors.primary : theme.colors.border,
              }}
            />
          ))}
        </View>

        {isLast ? (
          <AgeConfirmRow value={ageConfirmed} onValueChange={setAgeConfirmed} />
        ) : null}
        <AuthErrorText message={isLast ? error : null} />

        {isLast ? (
          <Button title="Get started" onPress={finish} />
        ) : (
          <Button title="Next" onPress={() => setIndex(index + 1)} />
        )}
        {!isLast ? (
          <Button
            title="Skip"
            variant="secondary"
            onPress={() => {
              markOnboardingSeen();
              router.replace('/(auth)/welcome');
            }}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
