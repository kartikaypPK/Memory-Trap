import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../../src/components/AppHeader';
import { useBellProps } from '../../src/features/notifications/hooks';
import { Card } from '../../src/components/Card';
import { EmptyState } from '../../src/components/EmptyState';
import { HudBar } from '../../src/components/HudBar';
import { Pill } from '../../src/components/Pill';
import { SkeletonCard } from '../../src/components/SkeletonLoader';
import { useDailyCircuit } from '../../src/features/circuit';
import {
  ContinuePlaying,
  DailyCircuitCard,
  LeaguePodium,
  MindScoreCard,
  formatCountdown,
  msUntilMidnight,
  useHomeData,
} from '../../src/features/home';
import { useEconomy } from '../../src/features/vault';
import { useSessionStore } from '../../src/store/session';
import { useTheme } from '../../src/theme/ThemeProvider';
import { maxContentWidth } from '../../src/theme/theme';

/**
 * Home Hub (docs/03 screen 1): greeting + rank pill, Daily Mind Circuit
 * hero, Mind Score card with ring + weekly habit grid, Continue Playing
 * carousel, League Podium. Real Supabase data via useHomeData; a brand-new
 * user (no runs yet) gets correct zero states throughout.
 * Phase 4: PLAY NOW opens the Daily Circuit hub (/circuit), the hero
 * shows real circuit progress from get_or_create_daily_circuit, and
 * the HUD reads lives/streak/XP from get_economy (lazy regen applied).
 */
export default function HomeScreen() {
  const { theme } = useTheme();
  const bellProps = useBellProps();
  const router = useRouter();
  const profile = useSessionStore((s) => s.profile);
  const { data, isLoading, isError, isOffline, refetch } = useHomeData(profile);
  const { economy } = useEconomy();
  const { data: circuit } = useDailyCircuit();
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const goToGames = () => router.navigate('/(tabs)/games');
  // Continue Playing → the game's intro (Phase 2). Daily Circuit PLAY
  // NOW → the circuit hub (Phase 4), which launches each game in
  // daily mode.
  const goToGameIntro = (gameId: string) =>
    router.push({ pathname: '/game/[gameId]', params: { gameId } });
  const goToDailyCircuit = () => router.push('/circuit');

  const handleRefresh = async () => {
    setRefreshing(true);
    refetch();
    // Queries are background-refetched; give them a beat before releasing
    // the spinner (no emulator to tune this against — kept simple).
    setTimeout(() => setRefreshing(false), 600);
  };

  const firstName = (profile?.display_name ?? 'Player').split(' ')[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.bg }} edges={['top']}>
      <AppHeader title="HOME" level={profile?.level ?? 1} {...bellProps} />
      <HudBar
        streak={economy?.streak ?? profile?.streak ?? 0}
        lives={economy?.lives ?? profile?.lives ?? 3}
        xp={economy?.xp ?? profile?.xp ?? 0}
      />

      {isOffline ? (
        <View
          accessibilityLiveRegion="polite"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            backgroundColor: theme.colors.warning,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.screen,
          }}
        >
          <MaterialIcons name="cloud-off" size={16} color={theme.colors.onPrimary} />
          <Text style={[theme.type.labelBadge, { color: theme.colors.onPrimary }]}>
            CACHED LOCALLY • SYNCS ON CONNECT
          </Text>
        </View>
      ) : null}

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={{
          padding: theme.spacing.screen,
          gap: theme.spacing.md,
          maxWidth: maxContentWidth,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {/* Greeting + rank */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm }}>
          <View style={{ flex: 1, gap: theme.spacing.xs }}>
            <Text style={[theme.type.headlineLg, { color: theme.colors.text }]}>
              {`Hey, ${firstName}!`}
            </Text>
            <Text style={[theme.type.bodyMd, { color: theme.colors.textSecondary }]}>
              Ready to stretch your memory today?
            </Text>
          </View>
          {data?.ownRank ? (
            <Pill
              tone="primary"
              label={`#${data.ownRank} in league`}
              icon={
                <MaterialIcons name="emoji-events" size={16} color={theme.colors.primary} />
              }
            />
          ) : null}
        </View>

        {isLoading || !data ? (
          <>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </>
        ) : isError ? (
          <Card>
            <EmptyState
              icon="error-outline"
              title="We could not load your home screen"
              body="Check your connection and try again. Your progress is saved on the server."
              actionTitle="Retry"
              onAction={refetch}
            />
          </Card>
        ) : (
          <>
            <DailyCircuitCard
              streak={economy?.streak ?? profile?.streak ?? 0}
              freezes={economy?.freezes ?? profile?.freezes ?? 0}
              done={circuit?.done ?? data.circuitDoneToday}
              progress={
                circuit
                  ? `${circuit.completedCount}/${circuit.totalCount}`
                  : undefined
              }
              resetLabel={`Resets in ${formatCountdown(msUntilMidnight(now))}`}
              onPlay={goToDailyCircuit}
            />
            <MindScoreCard
              score={profile?.mind_score ?? 0}
              delta={data.mindScoreDelta}
              level={profile?.level ?? 1}
              levelTitle={data.currentLevelTitle}
              xp={profile?.xp ?? 0}
              nextLevelXp={data.nextLevelXp}
              xpToNextLevel={data.xpToNextLevel}
              weekDays={data.weekDays}
              weekHitCount={data.weekHitCount}
            />
            <ContinuePlaying
              games={data.games}
              onPlayGame={(game) => goToGameIntro(game.id)}
              onViewAll={goToGames}
            />
            <LeaguePodium entries={data.podium} onViewAll={goToGames} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
