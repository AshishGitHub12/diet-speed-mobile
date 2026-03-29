import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

const PROGRAMS = [
  {
    id: '1', title: 'Weight Loss Program', duration: '8 weeks',
    progress: 0.6, status: 'Active', icon: '🔥', startDate: 'Mar 1, 2026',
    tasks: ['Morning walk 30 min', 'Low carb diet', 'Drink 8 glasses water'],
    completedTasks: 2,
  },
  {
    id: '2', title: 'Muscle Building', duration: '12 weeks',
    progress: 0.3, status: 'Active', icon: '💪', startDate: 'Feb 15, 2026',
    tasks: ['Gym 5x/week', 'High protein diet', 'Sleep 8 hours'],
    completedTasks: 1,
  },
  {
    id: '3', title: 'Flexibility & Yoga', duration: '4 weeks',
    progress: 1.0, status: 'Completed', icon: '🧘', startDate: 'Jan 10, 2026',
    tasks: ['Yoga 30 min daily', 'Stretching routine', 'Breathing exercises'],
    completedTasks: 3,
  },
];

export default function TrackProgramsScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track my Programs</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>2</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>1</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>3</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>

        {/* Program cards */}
        {PROGRAMS.map(p => (
          <TouchableOpacity
            key={p.id}
            style={styles.card}
            onPress={() => setExpanded(expanded === p.id ? null : p.id)}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View style={styles.programIconWrapper}>
                <Text style={styles.programIcon}>{p.icon}</Text>
              </View>
              <View style={styles.programInfo}>
                <Text style={styles.programTitle}>{p.title}</Text>
                <Text style={styles.programMeta}>{p.duration} • Started {p.startDate}</Text>
              </View>
              <View style={[styles.statusBadge, p.status === 'Completed' ? styles.statusDone : styles.statusActive]}>
                <Text style={[styles.statusText, p.status === 'Completed' ? styles.statusTextDone : styles.statusTextActive]}>
                  {p.status}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${p.progress * 100}%` as any }]} />
              </View>
              <Text style={styles.progressPct}>{Math.round(p.progress * 100)}%</Text>
            </View>

            {/* Expanded tasks */}
            {expanded === p.id && (
              <View style={styles.tasksContainer}>
                <Text style={styles.tasksTitle}>Tasks</Text>
                {p.tasks.map((task, i) => (
                  <View key={i} style={styles.taskRow}>
                    <View style={[styles.taskCheck, i < p.completedTasks && styles.taskCheckDone]}>
                      {i < p.completedTasks && <Text style={styles.taskCheckMark}>✓</Text>}
                    </View>
                    <Text style={[styles.taskText, i < p.completedTasks && styles.taskTextDone]}>
                      {task}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.expandHint}>{expanded === p.id ? '▲ Less' : '▼ Details'}</Text>
          </TouchableOpacity>
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

  summaryRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
    marginBottom: Spacing.lg, shadowColor: '#000',
    shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.primary },
  summaryLabel: { fontSize: 11, color: Colors.textMuted },
  summaryDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  programIconWrapper: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center',
  },
  programIcon: { fontSize: 24 },
  programInfo: { flex: 1 },
  programTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  programMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 3 },
  statusActive: { backgroundColor: '#E8F5E9' },
  statusDone: { backgroundColor: '#E3F2FD' },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusTextActive: { color: Colors.primary },
  statusTextDone: { color: '#1565C0' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: Colors.border, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.primary },
  progressPct: { fontSize: 11, fontWeight: '600', color: Colors.primary, minWidth: 32 },

  tasksContainer: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, gap: 8 },
  tasksTitle: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textDark, marginBottom: 4 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskCheck: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  taskCheckDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  taskCheckMark: { fontSize: 10, color: Colors.white, fontWeight: '700' },
  taskText: { fontSize: Fonts.sizes.sm, color: Colors.textDark },
  taskTextDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  expandHint: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
});