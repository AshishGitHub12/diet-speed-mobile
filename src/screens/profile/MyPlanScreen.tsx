import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  diet_plan: string;
  meals_per_day: string;
  breakfast_time: string;
  lunch_time: string;
  dinner_time: string;
  workout_plan: string;
  workout_days: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DIET_PLANS = [
  { key: 'balanced',      label: 'Balanced Diet',      emoji: '🥗', desc: 'Well-rounded macros' },
  { key: 'low_carb',      label: 'Low Carb',           emoji: '🥩', desc: 'Reduced carbohydrates' },
  { key: 'high_protein',  label: 'High Protein',       emoji: '💪', desc: 'Muscle building focus' },
  { key: 'intermittent',  label: 'Intermittent Fasting',emoji: '⏱️', desc: '16:8 fasting window' },
  { key: 'mediterranean', label: 'Mediterranean',      emoji: '🫒', desc: 'Heart-healthy foods' },
];

const MEALS_PER_DAY = [
  { key: '2', label: '2 Meals', desc: 'IF style' },
  { key: '3', label: '3 Meals', desc: 'Breakfast, Lunch, Dinner' },
  { key: '4', label: '4 Meals', desc: '+ 1 snack' },
  { key: '5', label: '5 Meals', desc: '+ 2 snacks' },
];

const MEAL_TIMES = ['06:00', '07:00', '08:00', '09:00', '12:00', '13:00', '14:00',
  '18:00', '19:00', '20:00', '21:00'];

const WORKOUT_PLANS = [
  { key: 'none',        label: 'No Workout',      emoji: '🛋️', desc: 'Diet only' },
  { key: 'beginner',    label: 'Beginner',        emoji: '🚶', desc: 'Light activity' },
  { key: 'intermediate',label: 'Intermediate',    emoji: '🏃', desc: 'Moderate intensity' },
  { key: 'advanced',    label: 'Advanced',        emoji: '🏋️', desc: 'High intensity' },
  { key: 'cardio',      label: 'Cardio Focus',    emoji: '❤️', desc: 'Fat burning' },
  { key: 'strength',    label: 'Strength Focus',  emoji: '💪', desc: 'Muscle gain' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Sub Components ───────────────────────────────────────────────────────────

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const MealTimeRow = ({
  label,
  emoji,
  value,
  onPress,
}: {
  label: string;
  emoji: string;
  value: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.mealTimeRow} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.mealTimeEmoji}>{emoji}</Text>
    <View style={styles.mealTimeCenter}>
      <Text style={styles.mealTimeLabel}>{label}</Text>
      <Text style={styles.mealTimeValue}>{value || 'Tap to set'}</Text>
    </View>
    <View style={[styles.timeBadge, value ? styles.timeBadgeActive : {}]}>
      <Text style={[styles.timeBadgeText, value ? styles.timeBadgeTextActive : {}]}>
        {value || '—'}
      </Text>
    </View>
  </TouchableOpacity>
);

// ─── Time Picker Modal ────────────────────────────────────────────────────────

interface TimeModalProps {
  visible: boolean;
  title: string;
  value: string;
  onClose: () => void;
  onSave: (val: string) => void;
}

const TimeModal = ({ visible, title, value, onClose, onSave }: TimeModalProps) => {
  const [selected, setSelected] = useState(value);

  React.useEffect(() => { setSelected(value); }, [value, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>{title}</Text>
          <View style={modalStyles.timeGrid}>
            {MEAL_TIMES.map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  modalStyles.timeChip,
                  selected === t && modalStyles.timeChipActive,
                ]}
                onPress={() => setSelected(t)}
                activeOpacity={0.7}
              >
                <Text style={[
                  modalStyles.timeChipText,
                  selected === t && modalStyles.timeChipTextActive,
                ]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={modalStyles.actions}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.saveBtn}
              onPress={() => onSave(selected)}
              activeOpacity={0.85}
            >
              <Text style={modalStyles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

const ProgressBar = ({ percent }: { percent: number }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${percent}%` }]} />
    </View>
    <Text style={styles.progressPercent}>{percent}%</Text>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MyPlanScreen() {
  const router = useRouter();

  const [plan, setPlan] = useState<Plan>({
    diet_plan:      '',
    meals_per_day:  '3',
    breakfast_time: '',
    lunch_time:     '',
    dinner_time:    '',
    workout_plan:   '',
    workout_days:   [],
  });

  const [timeModal, setTimeModal] = useState<{
    field: 'breakfast_time' | 'lunch_time' | 'dinner_time';
    title: string;
  } | null>(null);

  const toggleDay = (day: string) => {
    setPlan(prev => ({
      ...prev,
      workout_days: prev.workout_days.includes(day)
        ? prev.workout_days.filter(d => d !== day)
        : [...prev.workout_days, day],
    }));
  };

  const handleTimeSave = (val: string) => {
    if (!timeModal) return;
    setPlan(prev => ({ ...prev, [timeModal.field]: val }));
    setTimeModal(null);
  };

  // Mock progress — replace with real data from API
  const planProgress = 35;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Plan</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Plan Progress ── */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardTop}>
            <View>
              <Text style={styles.progressCardTitle}>Plan Progress</Text>
              <Text style={styles.progressCardSub}>Week 2 of 8 · 14 days remaining</Text>
            </View>
            <Text style={styles.progressEmoji}>📋</Text>
          </View>
          <ProgressBar percent={planProgress} />
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatVal}>14</Text>
              <Text style={styles.progressStatLabel}>Days Done</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatVal}>40</Text>
              <Text style={styles.progressStatLabel}>Days Left</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatVal}>54</Text>
              <Text style={styles.progressStatLabel}>Total Days</Text>
            </View>
          </View>
        </View>

        {/* ── Diet Plan ── */}
        <SectionHeader title="Diet Plan" />
        <View style={styles.planGrid}>
          {DIET_PLANS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.planCard,
                plan.diet_plan === p.key && styles.planCardActive,
              ]}
              onPress={() => setPlan(prev => ({ ...prev, diet_plan: p.key }))}
              activeOpacity={0.7}
            >
              <Text style={styles.planEmoji}>{p.emoji}</Text>
              <Text style={[
                styles.planCardLabel,
                plan.diet_plan === p.key && styles.planCardLabelActive,
              ]}>
                {p.label}
              </Text>
              <Text style={styles.planCardDesc}>{p.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Meals Per Day ── */}
        <SectionHeader title="Meals per Day" />
        <View style={styles.mealChipRow}>
          {MEALS_PER_DAY.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[
                styles.mealChip,
                plan.meals_per_day === m.key && styles.mealChipActive,
              ]}
              onPress={() => setPlan(prev => ({ ...prev, meals_per_day: m.key }))}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.mealChipLabel,
                plan.meals_per_day === m.key && styles.mealChipLabelActive,
              ]}>
                {m.label}
              </Text>
              <Text style={styles.mealChipDesc}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Meal Times ── */}
        <SectionHeader title="Preferred Meal Times" />
        <View style={styles.group}>
          <MealTimeRow
            emoji="🌅"
            label="Breakfast"
            value={plan.breakfast_time}
            onPress={() => setTimeModal({ field: 'breakfast_time', title: 'Breakfast Time' })}
          />
          <MealTimeRow
            emoji="☀️"
            label="Lunch"
            value={plan.lunch_time}
            onPress={() => setTimeModal({ field: 'lunch_time', title: 'Lunch Time' })}
          />
          <MealTimeRow
            emoji="🌙"
            label="Dinner"
            value={plan.dinner_time}
            onPress={() => setTimeModal({ field: 'dinner_time', title: 'Dinner Time' })}
          />
        </View>

        {/* ── Workout Plan ── */}
        <SectionHeader title="Workout Plan" />
        <View style={styles.workoutGrid}>
          {WORKOUT_PLANS.map(w => (
            <TouchableOpacity
              key={w.key}
              style={[
                styles.workoutCard,
                plan.workout_plan === w.key && styles.workoutCardActive,
              ]}
              onPress={() => setPlan(prev => ({ ...prev, workout_plan: w.key }))}
              activeOpacity={0.7}
            >
              <Text style={styles.workoutEmoji}>{w.emoji}</Text>
              <Text style={[
                styles.workoutLabel,
                plan.workout_plan === w.key && styles.workoutLabelActive,
              ]}>
                {w.label}
              </Text>
              <Text style={styles.workoutDesc}>{w.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Workout Days ── */}
        <SectionHeader title="Workout Days" />
        <View style={styles.daysRow}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayChip,
                plan.workout_days.includes(day) && styles.dayChipActive,
              ]}
              onPress={() => toggleDay(day)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayChipText,
                plan.workout_days.includes(day) && styles.dayChipTextActive,
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Save Button ── */}
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Plan</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Time Modal ── */}
      {timeModal && (
        <TimeModal
          visible={!!timeModal}
          title={timeModal.title}
          value={plan[timeModal.field]}
          onClose={() => setTimeModal(null)}
          onSave={handleTimeSave}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryMuted,
  },
  headerBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  group: { gap: 8, marginBottom: Spacing.sm },

  // Progress Card
  progressCard: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  progressCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  progressCardTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  progressCardSub: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  progressEmoji: { fontSize: 32 },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.white,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  progressPercent: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.primary, width: 36 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-around' },
  progressStat: { alignItems: 'center', gap: 2 },
  progressStatVal: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.primary },
  progressStatLabel: { fontSize: 11, color: Colors.textMuted },

  // Diet Plan Grid
  planGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  planCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  planCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  planEmoji: { fontSize: 26 },
  planCardLabel: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textDark, textAlign: 'center' },
  planCardLabelActive: { color: Colors.primary },
  planCardDesc: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

  // Meals Per Day
  mealChipRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  mealChip: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  mealChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  mealChipLabel: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textDark },
  mealChipLabelActive: { color: Colors.primary },
  mealChipDesc: { fontSize: 10, color: Colors.textMuted },

  // Meal Time Row
  mealTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  mealTimeEmoji: { fontSize: 22 },
  mealTimeCenter: { flex: 1 },
  mealTimeLabel: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  mealTimeValue: { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textDark, marginTop: 2 },
  timeBadge: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeBadgeActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  timeBadgeText: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted },
  timeBadgeTextActive: { color: Colors.primary },

  // Workout Grid
  workoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  workoutCard: {
    width: '30%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  workoutCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  workoutEmoji: { fontSize: 22 },
  workoutLabel: { fontSize: 11, fontWeight: '700', color: Colors.textDark, textAlign: 'center' },
  workoutLabelActive: { color: Colors.primary },
  workoutDesc: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },

  // Workout Days
  daysRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.sm },
  dayChip: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  dayChipText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  dayChipTextActive: { color: Colors.white },

  // Save Button
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  saveBtnText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white, letterSpacing: 0.5 },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg + 16,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark, marginBottom: Spacing.md },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },
  timeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  timeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  timeChipText: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted },
  timeChipTextActive: { color: Colors.primary },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: BorderRadius.full, height: 52,
    justifyContent: 'center', alignItems: 'center',
  },
  cancelText: { fontSize: Fonts.sizes.md, color: Colors.textMuted, fontWeight: '600' },
  saveBtn: {
    flex: 1, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full, height: 52,
    justifyContent: 'center', alignItems: 'center',
  },
  saveText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});