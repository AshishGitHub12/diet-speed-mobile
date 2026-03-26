import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrackerItem {
  id: string;
  title: string;
  icon: string;
  unit: string;
  current: number;
  goal: number;
  color: string;
  inputMode: 'number' | 'increment';
  step: number;
}

// ─── Initial data ─────────────────────────────────────────────────────────────

const INITIAL_TRACKERS: TrackerItem[] = [
  {
    id: 'water',
    title: 'Water',
    icon: '💧',
    unit: 'glasses',
    current: 0,
    goal: 8,
    color: '#2196F3',
    inputMode: 'increment',
    step: 1,
  },
  {
    id: 'steps',
    title: 'Steps',
    icon: '👟',
    unit: 'steps',
    current: 0,
    goal: 10000,
    color: '#FF9800',
    inputMode: 'number',
    step: 1000,
  },
  {
    id: 'sleep',
    title: 'Sleep',
    icon: '🌙',
    unit: 'hours',
    current: 0,
    goal: 8,
    color: '#9C27B0',
    inputMode: 'increment',
    step: 0.5,
  },
  {
    id: 'heart',
    title: 'Heart Rate',
    icon: '❤️',
    unit: 'bpm',
    current: 0,
    goal: 80,
    color: '#F44336',
    inputMode: 'number',
    step: 1,
  },
];

// ─── Progress Circle ──────────────────────────────────────────────────────────

const ProgressBar = ({ current, goal, color }: { current: number; goal: number; color: string }) => {
  const pct = Math.min(current / goal, 1);
  return (
    <View style={pbStyles.container}>
      <View style={pbStyles.track}>
        <View style={[pbStyles.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[pbStyles.pct, { color }]}>{Math.round(pct * 100)}%</Text>
    </View>
  );
};

const pbStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: {
    flex: 1, height: 6, borderRadius: 3,
    backgroundColor: Colors.border, overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3 },
  pct: { fontSize: 11, fontWeight: '600', minWidth: 32, textAlign: 'right' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HealthTrackerScreen() {
  const router = useRouter();
  const [trackers, setTrackers] = useState<TrackerItem[]>(INITIAL_TRACKERS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  const update = (id: string, value: number) => {
    setTrackers(prev => prev.map(t =>
      t.id === id ? { ...t, current: Math.max(0, Math.min(value, t.goal * 2)) } : t
    ));
  };

  const handleIncrement = (id: string, step: number) => {
    const t = trackers.find(t => t.id === id);
    if (t) update(id, parseFloat((t.current + step).toFixed(1)));
  };

  const handleDecrement = (id: string, step: number) => {
    const t = trackers.find(t => t.id === id);
    if (t) update(id, parseFloat(Math.max(0, t.current - step).toFixed(1)));
  };

  const handleManualSave = (id: string) => {
    const val = parseFloat(inputValue);
    if (!isNaN(val)) update(id, val);
    setEditingId(null);
    setInputValue('');
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Tracker</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date */}
          <Text style={styles.dateText}>{today}</Text>

          {/* Tracker cards */}
          {trackers.map((tracker) => (
            <View key={tracker.id} style={styles.trackerCard}>

              <View style={styles.cardTop}>
                {/* Icon + title */}
                <View style={[styles.iconWrapper, { backgroundColor: tracker.color + '20' }]}>
                  <Text style={styles.trackerIcon}>{tracker.icon}</Text>
                </View>
                <View style={styles.cardTitleGroup}>
                  <Text style={styles.trackerTitle}>{tracker.title}</Text>
                  <Text style={[styles.trackerGoal, { color: tracker.color }]}>
                    Goal: {tracker.goal} {tracker.unit}
                  </Text>
                </View>

                {/* Current value */}
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(editingId === tracker.id ? null : tracker.id);
                    setInputValue(String(tracker.current));
                  }}
                >
                  <Text style={[styles.currentValue, { color: tracker.color }]}>
                    {tracker.current}
                    <Text style={styles.currentUnit}> {tracker.unit}</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Progress bar */}
              <ProgressBar current={tracker.current} goal={tracker.goal} color={tracker.color} />

              {/* Controls */}
              <View style={styles.controls}>
                {tracker.inputMode === 'increment' ? (
                  <View style={styles.incrementRow}>
                    <TouchableOpacity
                      style={[styles.incBtn, { borderColor: tracker.color }]}
                      onPress={() => handleDecrement(tracker.id, tracker.step)}
                    >
                      <Text style={[styles.incBtnText, { color: tracker.color }]}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.incValue}>
                      {tracker.current} / {tracker.goal} {tracker.unit}
                    </Text>
                    <TouchableOpacity
                      style={[styles.incBtn, { backgroundColor: tracker.color, borderColor: tracker.color }]}
                      onPress={() => handleIncrement(tracker.id, tracker.step)}
                    >
                      <Text style={[styles.incBtnText, { color: Colors.white }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  editingId === tracker.id ? (
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[styles.manualInput, { borderColor: tracker.color }]}
                        value={inputValue}
                        onChangeText={setInputValue}
                        keyboardType="decimal-pad"
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={() => handleManualSave(tracker.id)}
                        placeholder={`Enter ${tracker.unit}`}
                        placeholderTextColor={Colors.textPlaceholder}
                      />
                      <TouchableOpacity
                        style={[styles.saveBtn, { backgroundColor: tracker.color }]}
                        onPress={() => handleManualSave(tracker.id)}
                      >
                        <Text style={styles.saveBtnText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.logBtn, { borderColor: tracker.color }]}
                      onPress={() => {
                        setEditingId(tracker.id);
                        setInputValue(String(tracker.current));
                      }}
                    >
                      <Text style={[styles.logBtnText, { color: tracker.color }]}>
                        + Log {tracker.title}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

            </View>
          ))}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryMuted,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },

  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  dateText: {
    fontSize: Fonts.sizes.sm, color: Colors.textMuted,
    marginBottom: Spacing.md, fontWeight: '500',
  },

  trackerCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrapper: {
    width: 48, height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  trackerIcon: { fontSize: 24 },
  cardTitleGroup: { flex: 1 },
  trackerTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  trackerGoal: { fontSize: 11, marginTop: 2 },
  currentValue: { fontSize: Fonts.sizes.xl, fontWeight: '800' },
  currentUnit: { fontSize: Fonts.sizes.sm, fontWeight: '400' },

  controls: { marginTop: 4 },

  incrementRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  incBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, justifyContent: 'center', alignItems: 'center',
  },
  incBtnText: { fontSize: 20, fontWeight: '300', lineHeight: 22 },
  incValue: { flex: 1, textAlign: 'center', fontSize: Fonts.sizes.sm, color: Colors.textMuted },

  inputRow: { flexDirection: 'row', gap: 8 },
  manualInput: {
    flex: 1, height: 44, borderWidth: 1.5,
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm,
    fontSize: Fonts.sizes.md, color: Colors.textDark,
  },
  saveBtn: {
    height: 44, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontWeight: '600', fontSize: Fonts.sizes.sm },

  logBtn: {
    height: 40, borderRadius: BorderRadius.full,
    borderWidth: 1.5, justifyContent: 'center', alignItems: 'center',
  },
  logBtnText: { fontSize: Fonts.sizes.sm, fontWeight: '600' },
});