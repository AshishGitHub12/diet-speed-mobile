import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

const WEIGHT_DATA = [
  { week: 'W1', weight: 72 },
  { week: 'W2', weight: 71.5 },
  { week: 'W3', weight: 70.8 },
  { week: 'W4', weight: 70.2 },
  { week: 'W5', weight: 69.5 },
  { week: 'W6', weight: 68.9 },
];

const STATS = [
  { label: 'Starting Weight', value: '72 kg', icon: '⚖️', color: '#FF9800' },
  { label: 'Current Weight',  value: '68.9 kg', icon: '📉', color: Colors.primary },
  { label: 'Weight Lost',     value: '3.1 kg', icon: '🎉', color: '#4CAF50' },
  { label: 'BMI',             value: '24.02', icon: '📊', color: '#2196F3' },
  { label: 'Target Weight',   value: '65 kg', icon: '🎯', color: '#9C27B0' },
  { label: 'To Go',           value: '3.9 kg', icon: '🏁', color: '#F44336' },
];

const PERIODS = ['1M', '3M', '6M', 'All'];

export default function ProgressReportsScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState('1M');

  const maxWeight = Math.max(...WEIGHT_DATA.map(d => d.weight));
  const minWeight = Math.min(...WEIGHT_DATA.map(d => d.weight));
  const range = maxWeight - minWeight || 1;
  const chartH = 120;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Reports</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weight Progress</Text>
          <View style={styles.chart}>
            {WEIGHT_DATA.map((d, i) => {
              const barH = ((d.weight - minWeight) / range) * (chartH - 20) + 20;
              return (
                <View key={i} style={styles.barGroup}>
                  <Text style={styles.barValue}>{d.weight}</Text>
                  <View style={[styles.bar, { height: barH }]} />
                  <Text style={styles.barLabel}>{d.week}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Stats grid */}
        <Text style={styles.sectionTitle}>Stats Overview</Text>
        <View style={styles.statsGrid}>
          {STATS.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Achievement */}
        <View style={styles.achievementCard}>
          <Text style={styles.achieveTitle}>🏆 This Month</Text>
          <View style={styles.achieveRow}>
            <View style={styles.achieveItem}>
              <Text style={styles.achieveValue}>18</Text>
              <Text style={styles.achieveLabel}>Workouts</Text>
            </View>
            <View style={styles.achieveItem}>
              <Text style={styles.achieveValue}>24</Text>
              <Text style={styles.achieveLabel}>Healthy Days</Text>
            </View>
            <View style={styles.achieveItem}>
              <Text style={styles.achieveValue}>3</Text>
              <Text style={styles.achieveLabel}>Goals Met</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryMuted,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  periodRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: BorderRadius.full, padding: 4, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  periodBtn: { flex: 1, paddingVertical: 6, borderRadius: BorderRadius.full, alignItems: 'center' },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  periodTextActive: { color: Colors.white, fontWeight: '600' },

  chartCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  chartTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark, marginBottom: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 160 },
  barGroup: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 9, color: Colors.textMuted },
  bar: { width: 28, backgroundColor: Colors.primary, borderRadius: 4, opacity: 0.85 },
  barLabel: { fontSize: 10, color: Colors.textMuted },

  sectionTitle: {
    fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.lg },
  statCard: {
    width: '47%', backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: Fonts.sizes.lg, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

  achievementCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: 12,
  },
  achieveTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  achieveRow: { flexDirection: 'row' },
  achieveItem: { flex: 1, alignItems: 'center', gap: 4 },
  achieveValue: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.white },
  achieveLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
});