import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import api from '@/src/services/api';

const CHALLENGES_BASE = '/challenges/';

// ─── Types — match ChallengeSerializer exactly ─────────────────────────────────

interface Challenge {
  id: number;
  title: string;
  description: string;
  icon: string;
  duration_days: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  participants: number;
  joined: boolean;
  user_challenge_id: number | null;
  current_streak: number;
  progress_percent: number;
  checked_in_today: boolean;
  status: 'active' | 'completed' | 'abandoned' | null;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#4CAF50',
  Medium: '#FF9800',
  Hard: '#F44336',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChallengesScreen() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const filters = ['All', 'Easy', 'Medium', 'Hard'];

  const fetchChallenges = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setIsLoading(true);
    try {
      const { data } = await api.get<Challenge[]>(CHALLENGES_BASE);
      setChallenges(data);
    } catch (error: any) {
      console.log('❌ Challenges fetch error:', error?.response?.status, JSON.stringify(error?.response?.data));
      Alert.alert('Error', 'Failed to load challenges.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchChallenges();
    }, [fetchChallenges])
  );

  const joined = challenges.filter((c) => c.joined && c.status === 'active');
  const filtered = activeFilter === 'All' ? challenges : challenges.filter((c) => c.difficulty === activeFilter);

  const toggleJoin = async (challenge: Challenge) => {
    if (busyId) return;
    setBusyId(challenge.id);
    const wasJoined = challenge.joined;

    // Optimistic update
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challenge.id
          ? { ...c, joined: !wasJoined, status: !wasJoined ? 'active' : null, current_streak: 0, progress_percent: 0, checked_in_today: false }
          : c
      )
    );

    try {
      if (wasJoined) {
        await api.post(`${CHALLENGES_BASE}${challenge.id}/leave/`);
      } else {
        await api.post(`${CHALLENGES_BASE}${challenge.id}/join/`);
      }
      await fetchChallenges();
    } catch (error: any) {
      console.log('❌ Join/leave error:', error?.response?.status, JSON.stringify(error?.response?.data));
      Alert.alert('Error', 'Something went wrong. Please try again.');
      await fetchChallenges(); // revert to real state
    } finally {
      setBusyId(null);
    }
  };

  const checkIn = async (challenge: Challenge) => {
    if (busyId) return;
    setBusyId(challenge.id);

    const previous = challenges;
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challenge.id
          ? { ...c, checked_in_today: true, current_streak: c.current_streak + 1 }
          : c
      )
    );

    try {
      await api.post(`${CHALLENGES_BASE}${challenge.id}/checkin/`);
      await fetchChallenges();
    } catch (error: any) {
      console.log('❌ Check-in error:', error?.response?.status, JSON.stringify(error?.response?.data));
      setChallenges(previous);
      Alert.alert('Error', error?.response?.data?.detail || 'Could not check in today.');
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Challenges</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchChallenges(true)} tintColor={Colors.primary} />
        }
      >
        {/* Joined summary */}
        {joined.length > 0 && (
          <View style={styles.joinedCard}>
            <Text style={styles.joinedTitle}>🏆 Active Challenges</Text>
            <Text style={styles.joinedCount}>{joined.length} challenge{joined.length > 1 ? 's' : ''} in progress</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.joinedRow}>
                {joined.map((c) => (
                  <View key={c.id} style={styles.joinedChip}>
                    <Text style={styles.joinedChipIcon}>{c.icon}</Text>
                    <Text style={styles.joinedChipText}>{c.title}</Text>
                    <View style={styles.joinedChipStreak}>
                      <Text style={styles.joinedChipStreakText}>🔥 {c.current_streak}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Challenge cards */}
        <View style={styles.challengesList}>
          {filtered.map((challenge) => {
            const isBusy = busyId === challenge.id;
            const isActive = challenge.joined && challenge.status === 'active';
            const isCompleted = challenge.status === 'completed';

            return (
              <View key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeTop}>
                  <View style={styles.challengeIconWrapper}>
                    <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                  </View>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <View style={styles.challengeMeta}>
                      <Text style={styles.challengeDuration}>⏱ {challenge.duration_days} days</Text>
                      <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[challenge.difficulty] + '20' }]}>
                        <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[challenge.difficulty] }]}>
                          {challenge.difficulty}
                        </Text>
                      </View>
                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedBadgeText}>✓ Completed</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <Text style={styles.challengeDesc}>{challenge.description}</Text>

                {isActive && (
                  <View style={styles.progressBlock}>
                    <View style={styles.progressTopRow}>
                      <Text style={styles.progressLabel}>
                        🔥 {challenge.current_streak}/{challenge.duration_days} days
                      </Text>
                      <Text style={styles.progressPercent}>{challenge.progress_percent}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${challenge.progress_percent}%` }]} />
                    </View>
                  </View>
                )}

                <View style={styles.challengeBottom}>
                  <Text style={styles.participants}>
                    👥 {challenge.participants.toLocaleString()} joined
                  </Text>

                  {!isActive ? (
                    <TouchableOpacity
                      style={[styles.joinBtn, challenge.joined && styles.joinBtnActive, isBusy && styles.btnDisabled]}
                      onPress={() => toggleJoin(challenge)}
                      disabled={isBusy}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color={challenge.joined ? Colors.white : Colors.primary} />
                      ) : (
                        <Text style={[styles.joinText, challenge.joined && styles.joinTextActive]}>
                          {isCompleted ? 'Join Again' : 'Join Now'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.activeActionsRow}>
                      <TouchableOpacity
                        style={styles.leaveBtn}
                        onPress={() => toggleJoin(challenge)}
                        disabled={isBusy}
                      >
                        <Text style={styles.leaveText}>Leave</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.checkInBtn,
                          challenge.checked_in_today && styles.checkInBtnDone,
                          isBusy && styles.btnDisabled,
                        ]}
                        onPress={() => checkIn(challenge)}
                        disabled={isBusy || challenge.checked_in_today}
                      >
                        {isBusy ? (
                          <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                          <Text style={styles.checkInText}>
                            {challenge.checked_in_today ? '✓ Done Today' : 'Check In Today'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No {activeFilter !== 'All' ? activeFilter.toLowerCase() : ''} challenges right now.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryMuted,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },

  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  // Joined
  joinedCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, gap: 8,
  },
  joinedTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  joinedCount: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.8)' },
  joinedRow: { flexDirection: 'row', gap: 8 },
  joinedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  joinedChipIcon: { fontSize: 14 },
  joinedChipText: { fontSize: 12, color: Colors.white, fontWeight: '500' },
  joinedChipStreak: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: BorderRadius.full, paddingHorizontal: 6, paddingVertical: 1 },
  joinedChipStreakText: { fontSize: 11, color: Colors.white, fontWeight: '700' },

  // Filters
  filterScroll: { marginBottom: Spacing.md },
  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  filterTextActive: { color: Colors.white, fontWeight: '600' },

  // Cards
  challengesList: { gap: 12 },
  challengeCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  challengeTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  challengeIconWrapper: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  challengeIcon: { fontSize: 24 },
  challengeInfo: { flex: 1, gap: 4 },
  challengeTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  challengeMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  challengeDuration: { fontSize: 12, color: Colors.textMuted },
  diffBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  diffText: { fontSize: 11, fontWeight: '600' },
  completedBadge: { backgroundColor: '#4CAF5020', borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  completedBadgeText: { fontSize: 11, fontWeight: '700', color: '#4CAF50' },
  challengeDesc: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, lineHeight: 20 },

  progressBlock: { gap: 6 },
  progressTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, fontWeight: '600', color: Colors.textDark },
  progressPercent: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  progressTrack: { height: 6, borderRadius: 6, backgroundColor: Colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6, backgroundColor: Colors.primary },

  challengeBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  participants: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  joinBtn: {
    backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.full,
    paddingHorizontal: 16, paddingVertical: 6, minWidth: 90, alignItems: 'center',
  },
  joinBtnActive: { backgroundColor: Colors.primary },
  joinText: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
  joinTextActive: { color: Colors.white },
  btnDisabled: { opacity: 0.6 },

  activeActionsRow: { flexDirection: 'row', gap: 8 },
  leaveBtn: {
    borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  leaveText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '600' },
  checkInBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    paddingHorizontal: 14, paddingVertical: 6, minWidth: 110, alignItems: 'center',
  },
  checkInBtnDone: { backgroundColor: '#4CAF50' },
  checkInText: { fontSize: Fonts.sizes.sm, color: Colors.white, fontWeight: '600' },

  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyStateText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
});