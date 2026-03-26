import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

interface Plan {
  diet_plan: string; meals_per_day: string;
  breakfast_time: string; lunch_time: string; dinner_time: string;
  workout_plan: string; workout_days: string[];
}

const DIET_PLANS = [
  { key: 'balanced',      label: 'Balanced',      desc: 'Well-rounded macros',     icon: 'nutrition-outline'    as const },
  { key: 'low_carb',      label: 'Low Carb',       desc: 'Reduced carbs',           icon: 'remove-circle-outline'as const },
  { key: 'high_protein',  label: 'High Protein',   desc: 'Muscle building',         icon: 'barbell-outline'      as const },
  { key: 'intermittent',  label: 'Intermittent',   desc: '16:8 fasting window',     icon: 'timer-outline'        as const },
  { key: 'mediterranean', label: 'Mediterranean',  desc: 'Heart-healthy',           icon: 'leaf-outline'         as const },
];

const MEALS_PER_DAY = [
  { key: '2', label: '2 Meals', desc: 'IF style' },
  { key: '3', label: '3 Meals', desc: 'Classic' },
  { key: '4', label: '4 Meals', desc: '+1 snack' },
  { key: '5', label: '5 Meals', desc: '+2 snacks' },
];

const MEAL_TIMES = ['06:00','07:00','08:00','09:00','12:00','13:00','14:00','18:00','19:00','20:00','21:00'];

const WORKOUT_PLANS = [
  { key: 'none',         label: 'No Workout',   desc: 'Diet only',        icon: 'bed-outline'      as const },
  { key: 'beginner',     label: 'Beginner',     desc: 'Light activity',   icon: 'walk-outline'     as const },
  { key: 'intermediate', label: 'Intermediate', desc: 'Moderate intensity',icon: 'bicycle-outline' as const },
  { key: 'advanced',     label: 'Advanced',     desc: 'High intensity',   icon: 'barbell-outline'  as const },
  { key: 'cardio',       label: 'Cardio',       desc: 'Fat burning',      icon: 'heart-outline'    as const },
  { key: 'strength',     label: 'Strength',     desc: 'Muscle gain',      icon: 'fitness-outline'  as const },
];

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ─── Time Modal ───────────────────────────────────────────────────────────────

const TimeModal = ({ visible, title, value, onClose, onSave }: {
  visible: boolean; title: string; value: string;
  onClose: () => void; onSave: (v: string) => void;
}) => {
  const [selected, setSelected] = useState(value);
  React.useEffect(() => { setSelected(value); }, [value, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <View style={m.titleRow}>
            <Text style={m.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={m.timeGrid}>
            {MEAL_TIMES.map(t => (
              <TouchableOpacity
                key={t}
                style={[m.timeChip, selected === t && m.timeChipActive]}
                onPress={() => setSelected(t)} activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={14} color={selected === t ? Colors.primary : Colors.textMuted} />
                <Text style={[m.timeChipText, selected === t && m.timeChipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={m.actions}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={m.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.saveBtn} onPress={() => onSave(selected)} activeOpacity={0.85}>
              <Text style={m.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MyPlanScreen() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>({
    diet_plan: '', meals_per_day: '3',
    breakfast_time: '', lunch_time: '', dinner_time: '',
    workout_plan: '', workout_days: [],
  });
  const [timeModal, setTimeModal] = useState<{
    field: 'breakfast_time'|'lunch_time'|'dinner_time'; title: string;
  } | null>(null);

  const toggleDay = (day: string) =>
    setPlan(prev => ({
      ...prev,
      workout_days: prev.workout_days.includes(day)
        ? prev.workout_days.filter(d => d !== day)
        : [...prev.workout_days, day],
    }));

  const planProgress = 35;
  const daysLeft = 40;
  const daysDone = 14;
  const totalDays = 54;

  const MealTimeRow = ({ field, label, icon }: {
    field: 'breakfast_time'|'lunch_time'|'dinner_time';
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => (
    <TouchableOpacity
      style={styles.mealTimeRow}
      onPress={() => setTimeModal({ field, title: `${label} Time` })}
      activeOpacity={0.7}
    >
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.mealTimeCenter}>
        <Text style={styles.mealTimeLabel}>{label}</Text>
        <Text style={styles.mealTimeValue}>{plan[field] || 'Tap to set'}</Text>
      </View>
      <View style={[styles.timeBadge, plan[field] ? styles.timeBadgeActive : {}]}>
        <Ionicons name="time-outline" size={12} color={plan[field] ? Colors.primary : Colors.textMuted} />
        <Text style={[styles.timeBadgeText, plan[field] ? styles.timeBadgeTextActive : {}]}>
          {plan[field] || '—'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Plan</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressCardTop}>
            <View>
              <Text style={styles.progressCardTitle}>Plan Progress</Text>
              <Text style={styles.progressCardSub}>Week 2 of 8 · {daysLeft} days remaining</Text>
            </View>
            <View style={styles.progressIconBox}>
              <Ionicons name="clipboard-outline" size={24} color={Colors.primary} />
            </View>
          </View>
          <View style={styles.progressBarRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${planProgress}%` }]} />
            </View>
            <Text style={styles.progressPct}>{planProgress}%</Text>
          </View>
          <View style={styles.progressStats}>
            {[
              { val: daysDone, label: 'Days Done', icon: 'checkmark-circle-outline' as const },
              { val: daysLeft, label: 'Days Left',  icon: 'hourglass-outline'        as const },
              { val: totalDays,label: 'Total Days', icon: 'calendar-outline'         as const },
            ].map((s, i) => (
              <View key={i} style={styles.progressStat}>
                <Ionicons name={s.icon} size={16} color={Colors.primary} />
                <Text style={styles.progressStatVal}>{s.val}</Text>
                <Text style={styles.progressStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Diet Plan */}
        <Text style={styles.sectionTitle}>Diet Plan</Text>
        <View style={styles.planGrid}>
          {DIET_PLANS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.planCard, plan.diet_plan === p.key && styles.planCardActive]}
              onPress={() => setPlan(prev => ({ ...prev, diet_plan: p.key }))}
              activeOpacity={0.7}
            >
              <View style={[styles.planIconBox, plan.diet_plan === p.key && styles.planIconBoxActive]}>
                <Ionicons name={p.icon} size={22} color={plan.diet_plan === p.key ? Colors.white : Colors.primary} />
              </View>
              <Text style={[styles.planCardLabel, plan.diet_plan === p.key && styles.planCardLabelActive]}>{p.label}</Text>
              <Text style={styles.planCardDesc}>{p.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Meals Per Day */}
        <Text style={styles.sectionTitle}>Meals per Day</Text>
        <View style={styles.mealChipRow}>
          {MEALS_PER_DAY.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.mealChip, plan.meals_per_day === m.key && styles.mealChipActive]}
              onPress={() => setPlan(prev => ({ ...prev, meals_per_day: m.key }))}
              activeOpacity={0.7}
            >
              <Ionicons
                name="restaurant-outline" size={16}
                color={plan.meals_per_day === m.key ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.mealChipLabel, plan.meals_per_day === m.key && styles.mealChipLabelActive]}>{m.label}</Text>
              <Text style={styles.mealChipDesc}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Meal Times */}
        <Text style={styles.sectionTitle}>Preferred Meal Times</Text>
        <View style={styles.group}>
          <MealTimeRow field="breakfast_time" label="Breakfast" icon="sunny-outline" />
          <MealTimeRow field="lunch_time"     label="Lunch"     icon="partly-sunny-outline" />
          <MealTimeRow field="dinner_time"    label="Dinner"    icon="moon-outline" />
        </View>

        {/* Workout Plan */}
        <Text style={styles.sectionTitle}>Workout Plan</Text>
        <View style={styles.workoutGrid}>
          {WORKOUT_PLANS.map(w => (
            <TouchableOpacity
              key={w.key}
              style={[styles.workoutCard, plan.workout_plan === w.key && styles.workoutCardActive]}
              onPress={() => setPlan(prev => ({ ...prev, workout_plan: w.key }))}
              activeOpacity={0.7}
            >
              <View style={[styles.workoutIconBox, plan.workout_plan === w.key && styles.workoutIconBoxActive]}>
                <Ionicons name={w.icon} size={20} color={plan.workout_plan === w.key ? Colors.white : Colors.primary} />
              </View>
              <Text style={[styles.workoutLabel, plan.workout_plan === w.key && styles.workoutLabelActive]}>{w.label}</Text>
              <Text style={styles.workoutDesc}>{w.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Workout Days */}
        <Text style={styles.sectionTitle}>Workout Days</Text>
        <View style={styles.daysRow}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day}
              style={[styles.dayChip, plan.workout_days.includes(day) && styles.dayChipActive]}
              onPress={() => toggleDay(day)} activeOpacity={0.7}
            >
              <Text style={[styles.dayChipText, plan.workout_days.includes(day) && styles.dayChipTextActive]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
          <Text style={styles.saveBtnText}>Save Plan</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {timeModal && (
        <TimeModal
          visible={!!timeModal} title={timeModal.title} value={plan[timeModal.field]}
          onClose={() => setTimeModal(null)}
          onSave={val => { setPlan(prev => ({ ...prev, [timeModal!.field]: val })); setTimeModal(null); }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.primaryMuted },
  headerBtn:   { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  sectionTitle:  { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark, marginBottom: Spacing.sm, marginTop: Spacing.md },
  group: { gap: 8, marginBottom: Spacing.sm },
  iconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },

  progressCard: { backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md },
  progressCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progressCardTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  progressCardSub:   { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  progressIconBox:   { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
  progressBarRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressTrack:     { flex: 1, height: 10, backgroundColor: Colors.white, borderRadius: 5, overflow: 'hidden' },
  progressFill:      { height: '100%', backgroundColor: Colors.primary, borderRadius: 5 },
  progressPct:       { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.primary, width: 36 },
  progressStats:     { flexDirection: 'row', justifyContent: 'space-around' },
  progressStat:      { alignItems: 'center', gap: 2 },
  progressStatVal:   { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  progressStatLabel: { fontSize: 11, color: Colors.textMuted },

  planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.sm },
  planCard: { width: '47%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm, alignItems: 'center', gap: 4 },
  planCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  planIconBox:       { width: 46, height: 46, borderRadius: 14, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  planIconBoxActive: { backgroundColor: Colors.primary },
  planCardLabel:       { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textDark, textAlign: 'center' },
  planCardLabelActive: { color: Colors.primary },
  planCardDesc: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

  mealChipRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  mealChip: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: Spacing.sm, alignItems: 'center', gap: 4 },
  mealChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  mealChipLabel:       { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textDark },
  mealChipLabelActive: { color: Colors.primary },
  mealChipDesc: { fontSize: 10, color: Colors.textMuted },

  mealTimeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  mealTimeCenter: { flex: 1 },
  mealTimeLabel:  { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  mealTimeValue:  { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textDark, marginTop: 2 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.background, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  timeBadgeActive:     { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  timeBadgeText:       { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted },
  timeBadgeTextActive: { color: Colors.primary },

  workoutGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.sm },
  workoutCard: { width: '30%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: Spacing.md, alignItems: 'center', gap: 4 },
  workoutCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  workoutIconBox:       { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  workoutIconBoxActive: { backgroundColor: Colors.primary },
  workoutLabel:       { fontSize: 11, fontWeight: '700', color: Colors.textDark, textAlign: 'center' },
  workoutLabelActive: { color: Colors.primary },
  workoutDesc: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },

  daysRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.sm },
  dayChip: { flex: 1, height: 44, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
  dayChipActive:     { borderColor: Colors.primary, backgroundColor: Colors.primary },
  dayChipText:       { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  dayChipTextActive: { color: Colors.white },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 56, marginTop: Spacing.lg },
  saveBtnText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white, letterSpacing: 0.5 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg + 16, paddingTop: Spacing.sm },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title:    { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  timeChipActive:     { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  timeChipText:       { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted },
  timeChipTextActive: { color: Colors.primary },
  actions:    { flexDirection: 'row', gap: 12 },
  cancelBtn:  { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, height: 52, justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontSize: Fonts.sizes.md, color: Colors.textMuted, fontWeight: '600' },
  saveBtn:    { flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 52, justifyContent: 'center', alignItems: 'center' },
  saveText:   { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});