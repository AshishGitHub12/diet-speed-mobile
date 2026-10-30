import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
// TODO(backend): wire to a real aggregated endpoint, e.g.
// import api from '@/src/services/api';
// api.get(`/progress/summary/?range=${range}`)

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Shared design system ───────────────────────────────────────────────────
const Accent = { gold: '#B9892E', plum: '#6E5A8C', teal: '#3E7CA6', berry: '#8B3A42' };
const Tint   = { mint: '#E1EEDD', peach: '#F5E6D3', lilac: '#E7E2F0', sky: '#DCEAF2' };
const LIME   = '#B9F24C';

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

type RangeKey = 'week' | 'month';

interface SummaryData {
  weightStart: number;
  weightNow: number;
  weightUnit: string;
  weightSeries: number[]; // simple sparkline points, oldest → newest
  caloriesAvg: number;
  caloriesTarget: number;
  workoutsDone: number;
  workoutsTarget: number;
  waterAvgL: number;
  waterTargetL: number;
}

// PLACEHOLDER DATA — replace once a real aggregation endpoint exists.
// Expected real shape would likely be built server-side from WeightLog,
// MealLog, WorkoutLog, WaterLog tables filtered by date range.
const MOCK_WEEK: SummaryData = {
  weightStart: 78.4, weightNow: 77.6, weightUnit: 'kg',
  weightSeries: [78.4, 78.2, 78.0, 77.9, 77.8, 77.7, 77.6],
  caloriesAvg: 1980, caloriesTarget: 2100,
  workoutsDone: 4, workoutsTarget: 5,
  waterAvgL: 2.1, waterTargetL: 2.5,
};
const MOCK_MONTH: SummaryData = {
  weightStart: 80.1, weightNow: 77.6, weightUnit: 'kg',
  weightSeries: [80.1, 79.6, 79.2, 78.8, 78.5, 78.1, 77.9, 77.6],
  caloriesAvg: 2020, caloriesTarget: 2100,
  workoutsDone: 16, workoutsTarget: 20,
  waterAvgL: 2.3, waterTargetL: 2.5,
};

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = SCREEN_WIDTH - Spacing.md * 2 - Spacing.md * 2;
  const h = 56;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const stepX = w / (points.length - 1 || 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = h - ((p - min) / range) * h;
    return `${x},${y}`;
  });
  // Lightweight polyline via absolutely-positioned dots + connecting bars,
  // avoids pulling in an svg/chart lib for a simple trend line.
  return (
    <View style={{ width: w, height: h, flexDirection: 'row', alignItems: 'flex-end' }}>
      {points.map((p, i) => {
        const pct = (p - min) / range;
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: h }}>
            <View style={{ width: 6, height: Math.max(4, pct * h), borderRadius: 3, backgroundColor: color }} />
          </View>
        );
      })}
    </View>
  );
}

export default function ProgressSummaryScreen() {
  const router = useRouter();
  const [range, setRange] = useState<RangeKey>('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<SummaryData | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      // TODO(backend): const { data } = await api.get(`/progress/summary/?range=${range}`);
      await new Promise((res) => setTimeout(res, 300));
      setData(range === 'week' ? MOCK_WEEK : MOCK_MONTH);
    } catch (error) {
      console.log('❌ Progress summary fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [range]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const weightDelta = data ? +(data.weightNow - data.weightStart).toFixed(1) : 0;
  const caloriesPct = data ? Math.min(1, data.caloriesAvg / data.caloriesTarget) : 0;
  const workoutsPct = data ? Math.min(1, data.workoutsDone / data.workoutsTarget) : 0;
  const waterPct = data ? Math.min(1, data.waterAvgL / data.waterTargetL) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Summary</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Range toggle */}
      <View style={styles.toggleRow}>
        {(['week', 'month'] as RangeKey[]).map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setRange(r)}
            style={[styles.toggleBtn, range === r && styles.toggleBtnActive]}
          >
            <Text style={[styles.toggleText, range === r && styles.toggleTextActive]}>
              {r === 'week' ? 'This Week' : 'This Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading || !data ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.primary} />}
        >
          {/* Dark hero — weight trend */}
          <View style={[styles.hero, leafRadius(BorderRadius.xl)]}>
            <View style={styles.heroBlobLg} />
            <View style={styles.heroBlobSm} />
            <View style={styles.heroTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroEyebrow}>Weight trend</Text>
                <Text style={styles.heroTitle}>{data.weightNow} {data.weightUnit}</Text>
              </View>
              <View style={[styles.deltaPill, weightDelta <= 0 ? styles.deltaPillDown : styles.deltaPillUp]}>
                <Ionicons name={weightDelta <= 0 ? 'trending-down' : 'trending-up'} size={13} color={Colors.textDark} />
                <Text style={styles.deltaPillText}>{weightDelta > 0 ? '+' : ''}{weightDelta} {data.weightUnit}</Text>
              </View>
            </View>
            <View style={{ marginTop: Spacing.lg }}>
              <Sparkline points={data.weightSeries} color={LIME} />
            </View>
          </View>

          {/* Stat cards */}
          <View style={styles.statGrid}>
            <View style={[styles.statCard, leafRadius(BorderRadius.lg), { backgroundColor: Tint.peach }]}>
              <View style={[styles.statIconWrap, { backgroundColor: Colors.white }]}>
                <Ionicons name="flame-outline" size={18} color={Accent.gold} />
              </View>
              <Text style={styles.statValue}>{data.caloriesAvg}</Text>
              <Text style={styles.statLabel}>Avg kcal/day</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${caloriesPct * 100}%`, backgroundColor: Accent.gold }]} />
              </View>
              <Text style={styles.statTarget}>Target {data.caloriesTarget}</Text>
            </View>

            <View style={[styles.statCard, leafRadius(BorderRadius.lg), { backgroundColor: Tint.lilac }]}>
              <View style={[styles.statIconWrap, { backgroundColor: Colors.white }]}>
                <Ionicons name="barbell-outline" size={18} color={Accent.plum} />
              </View>
              <Text style={styles.statValue}>{data.workoutsDone}</Text>
              <Text style={styles.statLabel}>Workouts</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${workoutsPct * 100}%`, backgroundColor: Accent.plum }]} />
              </View>
              <Text style={styles.statTarget}>Target {data.workoutsTarget}</Text>
            </View>

            <View style={[styles.statCard, leafRadius(BorderRadius.lg), { backgroundColor: Tint.sky }]}>
              <View style={[styles.statIconWrap, { backgroundColor: Colors.white }]}>
                <Ionicons name="water-outline" size={18} color={Accent.teal} />
              </View>
              <Text style={styles.statValue}>{data.waterAvgL}L</Text>
              <Text style={styles.statLabel}>Avg water/day</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${waterPct * 100}%`, backgroundColor: Accent.teal }]} />
              </View>
              <Text style={styles.statTarget}>Target {data.waterTargetL}L</Text>
            </View>
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

  toggleRow: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border, marginHorizontal: Spacing.md, padding: 4, gap: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.full, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: Colors.textDark },
  toggleText: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textMuted },
  toggleTextActive: { color: LIME },

  scrollContent: { padding: Spacing.md, gap: Spacing.md },

  hero: { backgroundColor: Colors.textDark, padding: Spacing.lg, overflow: 'hidden', position: 'relative' },
  heroBlobLg: { position: 'absolute', top: -40, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)' },
  heroBlobSm: { position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.03)' },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroEyebrow: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroTitle: { color: Colors.white, fontSize: Fonts.sizes.xl, fontWeight: '800', marginTop: 2 },
  deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 5 },
  deltaPillDown: { backgroundColor: LIME },
  deltaPillUp: { backgroundColor: '#E0A8AC' },
  deltaPillText: { fontSize: 12, fontWeight: '800', color: Colors.textDark },

  statGrid: { gap: Spacing.sm },
  statCard: { padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: 2 },
  statIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.textDark },
  statLabel: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textDark },
  statTarget: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.08)', marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});