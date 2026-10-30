import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
// TODO(backend): wire to a real endpoint, e.g. api.get('/gamification/streaks/')
// import api from '@/src/services/api';

// ─── Shared design system (matches Home, Diet, Challenges, Profile,
// Notifications, Recipes, Explore, Success Stories…) ────────────────────────

const Accent = { gold: '#B9892E', plum: '#6E5A8C', teal: '#3E7CA6', berry: '#8B3A42' };
const Tint   = { mint: '#E1EEDD', peach: '#F5E6D3', lilac: '#E7E2F0', sky: '#DCEAF2' };
const LIME   = '#B9F24C';

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

interface StreakInfo {
  type: 'login' | 'logging' | 'workout';
  label: string;
  current: number;
  best: number;
  icon: keyof typeof Ionicons.glyphMap;
}

interface Badge {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  earned: boolean;
  progress?: number; // 0-1, only relevant if !earned
}

// PLACEHOLDER DATA — replace with real API response once
// /gamification/streaks/ and /gamification/badges/ (or equivalent) exist.
const MOCK_STREAKS: StreakInfo[] = [
  { type: 'login', label: 'Daily Login', current: 12, best: 21, icon: 'log-in-outline' },
  { type: 'logging', label: 'Meal Logging', current: 8, best: 15, icon: 'restaurant-outline' },
  { type: 'workout', label: 'Workout', current: 4, best: 9, icon: 'barbell-outline' },
];

const BADGE_STYLE = [
  { accent: Accent.gold, tint: Tint.peach },
  { accent: Accent.plum, tint: Tint.lilac },
  { accent: Accent.teal, tint: Tint.sky },
  { accent: Accent.berry, tint: Tint.mint },
];

const MOCK_BADGES: Badge[] = [
  { id: 1, title: '7-Day Streak', description: 'Logged in every day for a week', icon: 'flame', earned: true },
  { id: 2, title: '30-Day Streak', description: 'Logged in every day for a month', icon: 'flame', earned: false, progress: 0.4 },
  { id: 3, title: 'First Challenge', description: 'Completed your first challenge', icon: 'trophy', earned: true },
  { id: 4, title: 'Early Bird', description: 'Logged breakfast before 8am, 5 times', icon: 'sunny', earned: false, progress: 0.6 },
  { id: 5, title: 'Hydration Hero', description: 'Hit your water goal 10 days running', icon: 'water', earned: true },
  { id: 6, title: 'Iron Will', description: 'Completed 20 workouts', icon: 'barbell', earned: false, progress: 0.25 },
];

export default function StreaksBadgesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [streaks, setStreaks] = useState<StreakInfo[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      // TODO(backend): replace with real calls, e.g.
      // const { data: streakData } = await api.get('/gamification/streaks/');
      // const { data: badgeData } = await api.get('/gamification/badges/');
      await new Promise((res) => setTimeout(res, 300));
      setStreaks(MOCK_STREAKS);
      setBadges(MOCK_BADGES);
    } catch (error) {
      console.log('❌ Streaks/badges fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const topStreak = streaks.reduce((max, s) => (s.current > (max?.current ?? -1) ? s : max), streaks[0]);
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Streaks & Badges</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.primary} />}
        >
          {/* Dark hero summary */}
          <View style={[styles.hero, leafRadius(BorderRadius.xl)]}>
            <View style={styles.heroBlobLg} />
            <View style={styles.heroBlobSm} />
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconWrap}>
                <Ionicons name="flame" size={22} color={LIME} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroEyebrow}>Current best streak</Text>
                <Text style={styles.heroTitle}>{topStreak ? `${topStreak.current} days · ${topStreak.label}` : '—'}</Text>
              </View>
            </View>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{earnedCount}</Text>
                <Text style={styles.heroStatLabel}>Badges earned</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{badges.length - earnedCount}</Text>
                <Text style={styles.heroStatLabel}>In progress</Text>
              </View>
            </View>
          </View>

          {/* Streak cards */}
          <Text style={styles.sectionTitle}>Your Streaks</Text>
          <View style={styles.streakRow}>
            {streaks.map((s, i) => {
              const style = BADGE_STYLE[i % BADGE_STYLE.length];
              return (
                <View key={s.type} style={[styles.streakCard, leafRadius(BorderRadius.lg), { backgroundColor: style.tint }]}>
                  <View style={[styles.streakIconWrap, { backgroundColor: Colors.white }]}>
                    <Ionicons name={s.icon} size={18} color={style.accent} />
                  </View>
                  <Text style={styles.streakCurrent}>{s.current}</Text>
                  <Text style={styles.streakLabel}>{s.label}</Text>
                  <Text style={styles.streakBest}>Best: {s.best}</Text>
                </View>
              );
            })}
          </View>

          {/* Badge grid */}
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgeGrid}>
            {badges.map((b, i) => {
              const style = BADGE_STYLE[i % BADGE_STYLE.length];
              return (
                <View
                  key={b.id}
                  style={[
                    styles.badgeCard,
                    leafRadius(BorderRadius.lg),
                    { backgroundColor: b.earned ? style.tint : Colors.white, opacity: b.earned ? 1 : 0.85 },
                  ]}
                >
                  <View style={[styles.badgeIconWrap, { backgroundColor: b.earned ? Colors.white : style.tint }]}>
                    <Ionicons name={b.icon} size={20} color={b.earned ? style.accent : Colors.textMuted} />
                  </View>
                  <Text style={styles.badgeTitle}>{b.title}</Text>
                  <Text style={styles.badgeDesc} numberOfLines={2}>{b.description}</Text>
                  {b.earned ? (
                    <View style={styles.earnedPill}>
                      <Ionicons name="checkmark" size={11} color={Colors.textDark} />
                      <Text style={styles.earnedPillText}>Earned</Text>
                    </View>
                  ) : (
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${Math.round((b.progress ?? 0) * 100)}%`, backgroundColor: style.accent }]} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.background,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.textDark },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },

  hero: {
    backgroundColor: Colors.textDark, padding: Spacing.lg, overflow: 'hidden',
    position: 'relative', marginBottom: Spacing.sm,
  },
  heroBlobLg: {
    position: 'absolute', top: -40, right: -30, width: 140, height: 140,
    borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroBlobSm: {
    position: 'absolute', bottom: -20, left: -20, width: 90, height: 90,
    borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.03)',
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(185,242,76,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroEyebrow: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle: { color: Colors.white, fontSize: Fonts.sizes.lg, fontWeight: '800', marginTop: 2 },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.lg, gap: Spacing.md },
  heroStat: { flex: 1 },
  heroStatValue: { color: LIME, fontSize: Fonts.sizes.xl, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: Fonts.sizes.sm, marginTop: 2 },
  heroStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)' },

  sectionTitle: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.textDark, marginTop: Spacing.sm },

  streakRow: { flexDirection: 'row', gap: Spacing.sm },
  streakCard: { flex: 1, padding: Spacing.sm, alignItems: 'center', gap: 2 },
  streakIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  streakCurrent: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.textDark },
  streakLabel: { fontSize: 11, fontWeight: '700', color: Colors.textDark, textAlign: 'center' },
  streakBest: { fontSize: 10, color: Colors.textMuted },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  badgeCard: {
    width: '47%', padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  badgeIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  badgeTitle: { fontSize: Fonts.sizes.sm, fontWeight: '800', color: Colors.textDark, marginTop: 4 },
  badgeDesc: { fontSize: 11, color: Colors.textMuted, lineHeight: 15 },
  earnedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start',
    backgroundColor: LIME, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4,
  },
  earnedPillText: { fontSize: 10, fontWeight: '800', color: Colors.textDark },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: Colors.border, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});