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
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import api from '@/src/services/api';

const CHALLENGES_BASE = '/challenges/';

// ─── Shared design system (matches Home, Weight Tracker, Meal Log, Diet) ───────

const Accent = { gold: '#B9892E', plum: '#6E5A8C', teal: '#3E7CA6', berry: '#8B3A42' };
const Tint   = { mint: '#E1EEDD', peach: '#F5E6D3', lilac: '#E7E2F0', sky: '#DCEAF2' };
const LIME   = '#B9F24C';

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

// Difficulty now maps to the same accent/tint family used everywhere else,
// instead of generic traffic-light red/orange/green.
const DIFFICULTY_STYLE: Record<string, { accent: string; tint: string }> = {
  Easy:   { accent: Colors.primary, tint: Tint.mint },
  Medium: { accent: Accent.gold,    tint: Tint.peach },
  Hard:   { accent: Accent.berry,   tint: '#F3E3E5' },
};

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
          <Ionicons name="chevron-back" size={20} color={Colors.textDark} />
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
        {/* Joined summary — dark hero card, same language as Home/Diet/Profile */}
        {joined.length > 0 && (
          <View style={[styles.joinedCard, leafRadius(BorderRadius.xl)]}>
            <View style={styles.heroBlobA} />
            <View style={styles.heroBlobB} />
            <View style={styles.joinedTitleRow}>
              <Ionicons name="trophy" size={16} color={LIME} />
              <Text style={styles.joinedTitle}>Active Challenges</Text>
            </View>
            <Text style={styles.joinedCount}>{joined.length} challenge{joined.length > 1 ? 's' : ''} in progress</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.joinedRow}>
                {joined.map((c) => (
                  <View key={c.id} style={styles.joinedChip}>
                    <Text style={styles.joinedChipIcon}>{c.icon}</Text>
                    <Text style={styles.joinedChipText}>{c.title}</Text>
                    <View style={styles.joinedChipStreak}>
                      <Ionicons name="flame" size={11} color={LIME} />
                      <Text style={styles.joinedChipStreakText}>{c.current_streak}</Text>
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
            const diff = DIFFICULTY_STYLE[challenge.difficulty] ?? DIFFICULTY_STYLE.Easy;

            return (
              <View key={challenge.id} style={[styles.challengeCard, leafRadius(BorderRadius.lg)]}>
                <View style={styles.challengeTop}>
                  <View style={[styles.challengeIconWrapper, { backgroundColor: diff.tint }]}>
                    <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                  </View>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <View style={styles.challengeMeta}>
                      <View style={styles.durationRow}>
                        <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
                        <Text style={styles.challengeDuration}>{challenge.duration_days} days</Text>
                      </View>
                      <View style={[styles.diffBadge, { backgroundColor: diff.tint }]}>
                        <Text style={[styles.diffText, { color: diff.accent }]}>
                          {challenge.difficulty}
                        </Text>
                      </View>
                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <Ionicons name="checkmark" size={11} color={Colors.primary} />
                          <Text style={styles.completedBadgeText}>Completed</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <Text style={styles.challengeDesc}>{challenge.description}</Text>

                {isActive && (
                  <View style={styles.progressBlock}>
                    <View style={styles.progressTopRow}>
                      <View style={styles.progressLabelRow}>
                        <Ionicons name="flame" size={12} color={diff.accent} />
                        <Text style={styles.progressLabel}>
                          {challenge.current_streak}/{challenge.duration_days} days
                        </Text>
                      </View>
                      <Text style={[styles.progressPercent, { color: diff.accent }]}>{challenge.progress_percent}%</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${challenge.progress_percent}%`, backgroundColor: diff.accent }]} />
                    </View>
                  </View>
                )}

                <View style={styles.challengeBottom}>
                  <View style={styles.participantsRow}>
                    <Ionicons name="people-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.participants}>
                      {challenge.participants.toLocaleString()} joined
                    </Text>
                  </View>

                  {!isActive ? (
                    <TouchableOpacity
                      style={[
                        styles.joinBtn,
                        { borderColor: diff.accent },
                        challenge.joined && { backgroundColor: diff.accent },
                        isBusy && styles.btnDisabled,
                      ]}
                      onPress={() => toggleJoin(challenge)}
                      disabled={isBusy}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color={challenge.joined ? Colors.white : diff.accent} />
                      ) : (
                        <Text style={[styles.joinText, { color: diff.accent }, challenge.joined && styles.joinTextActive]}>
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
                          <ActivityIndicator size="small" color={Colors.textDark} />
                        ) : (
                          <>
                            {challenge.checked_in_today && <Ionicons name="checkmark" size={14} color={Colors.textDark} />}
                            <Text style={styles.checkInText}>
                              {challenge.checked_in_today ? 'Done Today' : 'Check In Today'}
                            </Text>
                          </>
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
    backgroundColor: Colors.background,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.textDark },

  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  // Joined — dark hero card
  joinedCard: {
    backgroundColor: Colors.textDark,
    padding: Spacing.md, marginBottom: Spacing.md, gap: 8,
    overflow: 'hidden',
  },
  heroBlobA: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -70, right: -50,
  },
  heroBlobB: {
    position: 'absolute', width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.03)', bottom: -45, left: -30,
  },
  joinedTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  joinedTitle: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.white },
  joinedCount: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  joinedRow: { flexDirection: 'row', gap: 8 },
  joinedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  joinedChipIcon: { fontSize: 14 },
  joinedChipText: { fontSize: 12, color: Colors.white, fontWeight: '600' },
  joinedChipStreak: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(185,242,76,0.15)', borderRadius: BorderRadius.full, paddingHorizontal: 6, paddingVertical: 1 },
  joinedChipStreakText: { fontSize: 11, color: LIME, fontWeight: '800' },

  // Filters
  filterScroll: { marginBottom: Spacing.md },
  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: Colors.textDark, borderColor: Colors.textDark },
  filterText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '600' },
  filterTextActive: { color: LIME, fontWeight: '800' },

  // Cards
  challengesList: { gap: 12 },
  challengeCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md, gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  challengeTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  challengeIconWrapper: {
    width: 48, height: 48, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  challengeIcon: { fontSize: 24 },
  challengeInfo: { flex: 1, gap: 4 },
  challengeTitle: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.textDark },
  challengeMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  challengeDuration: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  diffBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  diffText: { fontSize: 11, fontWeight: '800' },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: Tint.mint, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  completedBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  challengeDesc: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, lineHeight: 20 },

  progressBlock: { gap: 6 },
  progressTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: Colors.textDark },
  progressPercent: { fontSize: 12, fontWeight: '800' },
  progressTrack: { height: 6, borderRadius: 6, backgroundColor: Colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6 },

  challengeBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  participantsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  participants: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '500' },
  joinBtn: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.full, borderWidth: 1.5,
    paddingHorizontal: 16, paddingVertical: 7, minWidth: 90, alignItems: 'center',
  },
  joinText: { fontSize: Fonts.sizes.sm, fontWeight: '700' },
  joinTextActive: { color: Colors.white },
  btnDisabled: { opacity: 0.6 },

  activeActionsRow: { flexDirection: 'row', gap: 8 },
  leaveBtn: {
    borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  leaveText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '600' },
  checkInBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: LIME, borderRadius: BorderRadius.full,
    paddingHorizontal: 14, paddingVertical: 7, minWidth: 110, justifyContent: 'center',
  },
  checkInBtnDone: { backgroundColor: Tint.mint },
  checkInText: { fontSize: Fonts.sizes.sm, color: Colors.textDark, fontWeight: '800' },

  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyStateText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
});