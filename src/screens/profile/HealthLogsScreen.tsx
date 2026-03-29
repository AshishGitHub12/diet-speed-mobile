import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

const LOGS = [
  {
    date: 'Today', entries: [
      { time: '8:00 AM', type: 'Weight', value: '68.9 kg', icon: '⚖️', color: Colors.primary },
      { time: '9:30 AM', type: 'Water', value: '3 glasses', icon: '💧', color: '#2196F3' },
      { time: '12:00 PM', type: 'Meal', value: 'Lunch — 450 kcal', icon: '🍽️', color: '#FF9800' },
      { time: '6:00 PM', type: 'Workout', value: '30 min cardio', icon: '🏃', color: '#9C27B0' },
    ],
  },
  {
    date: 'Yesterday', entries: [
      { time: '7:45 AM', type: 'Weight', value: '69.1 kg', icon: '⚖️', color: Colors.primary },
      { time: '8:00 AM', type: 'Water', value: '8 glasses', icon: '💧', color: '#2196F3' },
      { time: '1:00 PM', type: 'Meal', value: 'Lunch — 380 kcal', icon: '🍽️', color: '#FF9800' },
      { time: '7:30 PM', type: 'Sleep', value: '7.5 hours', icon: '🌙', color: '#673AB7' },
    ],
  },
  {
    date: 'Mar 24, 2026', entries: [
      { time: '8:15 AM', type: 'Weight', value: '69.3 kg', icon: '⚖️', color: Colors.primary },
      { time: '11:00 AM', type: 'Workout', value: '45 min strength', icon: '💪', color: '#9C27B0' },
      { time: '3:00 PM', type: 'Heart Rate', value: '72 bpm', icon: '❤️', color: '#F44336' },
    ],
  },
];

const FILTERS = ['All', 'Weight', 'Meal', 'Workout', 'Water', 'Sleep'];

export default function HealthLogsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');

  const filteredLogs = LOGS.map(day => ({
    ...day,
    entries: filter === 'All' ? day.entries : day.entries.filter(e => e.type === filter),
  })).filter(day => day.entries.length > 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Logs</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, filter === f && styles.filterChipActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Log entries by day */}
        {filteredLogs.map((day, di) => (
          <View key={di} style={styles.daySection}>
            <Text style={styles.dayLabel}>{day.date}</Text>
            <View style={styles.dayCard}>
              {day.entries.map((entry, ei) => (
                <View key={ei} style={[styles.entryRow, ei > 0 && styles.entryBorder]}>
                  <View style={[styles.entryIconWrapper, { backgroundColor: entry.color + '20' }]}>
                    <Text style={styles.entryIcon}>{entry.icon}</Text>
                  </View>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryType}>{entry.type}</Text>
                    <Text style={styles.entryValue}>{entry.value}</Text>
                  </View>
                  <Text style={styles.entryTime}>{entry.time}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

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

  filterScroll: { marginBottom: Spacing.md },
  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  filterTextActive: { color: Colors.white, fontWeight: '600' },

  daySection: { marginBottom: Spacing.md },
  dayLabel: {
    fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textMuted,
    marginBottom: 6, marginLeft: 4,
  },
  dayCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
    overflow: 'hidden',
  },
  entryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 12, gap: 12,
  },
  entryBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  entryIconWrapper: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  entryIcon: { fontSize: 20 },
  entryInfo: { flex: 1 },
  entryType: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textDark },
  entryValue: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  entryTime: { fontSize: 11, color: Colors.textMuted },
});