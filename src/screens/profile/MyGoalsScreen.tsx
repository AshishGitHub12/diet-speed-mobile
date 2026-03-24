import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Goals {
  primary_goal: string;
  weekly_goal: string;
  activity_level: string;
  daily_calories: string;
  daily_water: string;
  diet_type: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY_GOALS = [
  { key: 'lose_weight', label: 'Lose Weight', emoji: '📉' },
  { key: 'gain_weight', label: 'Gain Weight', emoji: '📈' },
  { key: 'maintain',    label: 'Maintain',    emoji: '⚖️' },
  { key: 'build_muscle',label: 'Build Muscle',emoji: '💪' },
];

const WEEKLY_GOALS = [
  { key: '0.25', label: '0.25 kg/week', desc: 'Slow & steady' },
  { key: '0.5',  label: '0.5 kg/week',  desc: 'Recommended' },
  { key: '0.75', label: '0.75 kg/week', desc: 'Moderate' },
  { key: '1.0',  label: '1.0 kg/week',  desc: 'Aggressive' },
];

const ACTIVITY_LEVELS = [
  { key: 'sedentary',       label: 'Sedentary',         desc: 'Little or no exercise' },
  { key: 'lightly_active',  label: 'Lightly Active',    desc: '1–3 days/week' },
  { key: 'moderately_active',label: 'Moderately Active',desc: '3–5 days/week' },
  { key: 'very_active',     label: 'Very Active',       desc: '6–7 days/week' },
];

const DIET_TYPES = [
  { key: 'no_preference', label: 'No Preference', emoji: '🍽️' },
  { key: 'vegetarian',    label: 'Vegetarian',    emoji: '🥗' },
  { key: 'vegan',         label: 'Vegan',         emoji: '🌱' },
  { key: 'keto',          label: 'Keto',          emoji: '🥩' },
  { key: 'paleo',         label: 'Paleo',         emoji: '🍖' },
];

// ─── Sub Components ───────────────────────────────────────────────────────────

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const InfoCard = ({
  label,
  value,
  unit,
  emoji,
  onPress,
}: {
  label: string;
  value: string;
  unit?: string;
  emoji: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.infoCard} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.infoCardEmoji}>{emoji}</Text>
    <View style={styles.infoCardCenter}>
      <Text style={styles.infoCardLabel}>{label}</Text>
      <Text style={styles.infoCardValue}>
        {value || '—'}{unit && value ? ` ${unit}` : ''}
      </Text>
    </View>
    <Text style={styles.infoChevron}>›</Text>
  </TouchableOpacity>
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface ModalOption {
  key: string;
  label: string;
  desc?: string;
  emoji?: string;
}

interface EditModalProps {
  visible: boolean;
  title: string;
  type: 'select' | 'number';
  value: string;
  options?: ModalOption[];
  unit?: string;
  onClose: () => void;
  onSave: (val: string) => void;
}

const EditModal = ({
  visible, title, type, value, options = [], unit, onClose, onSave,
}: EditModalProps) => {
  const [localVal, setLocalVal] = useState(value);

  React.useEffect(() => {
    setLocalVal(value);
  }, [value, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>Edit {title}</Text>

          {type === 'number' && (
            <View style={modalStyles.numberRow}>
              <TextInput
                style={modalStyles.numberInput}
                value={localVal}
                onChangeText={setLocalVal}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
              {unit && <Text style={modalStyles.unitLabel}>{unit}</Text>}
            </View>
          )}

          {type === 'select' && (
            <View style={modalStyles.optionsList}>
              {options.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    modalStyles.optionRow,
                    localVal === opt.key && modalStyles.optionRowActive,
                  ]}
                  onPress={() => setLocalVal(opt.key)}
                  activeOpacity={0.7}
                >
                  <View style={modalStyles.optionLeft}>
                    {opt.emoji && (
                      <Text style={modalStyles.optionEmoji}>{opt.emoji}</Text>
                    )}
                    <View>
                      <Text style={[
                        modalStyles.optionText,
                        localVal === opt.key && modalStyles.optionTextActive,
                      ]}>
                        {opt.label}
                      </Text>
                      {opt.desc && (
                        <Text style={modalStyles.optionDesc}>{opt.desc}</Text>
                      )}
                    </View>
                  </View>
                  {localVal === opt.key && (
                    <Text style={modalStyles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={modalStyles.actions}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.saveBtn}
              onPress={() => onSave(localVal)}
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getLabelByKey = (arr: ModalOption[], key: string) =>
  arr.find(o => o.key === key)?.label ?? key;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MyGoalsScreen() {
  const router = useRouter();

  const [goals, setGoals] = useState<Goals>({
    primary_goal:   '',
    weekly_goal:    '',
    activity_level: '',
    daily_calories: '',
    daily_water:    '',
    diet_type:      '',
  });

  const [modalConfig, setModalConfig] = useState<{
    field: keyof Goals;
    title: string;
    type: 'select' | 'number';
    options?: ModalOption[];
    unit?: string;
  } | null>(null);

  const openModal = (
    field: keyof Goals,
    title: string,
    type: 'select' | 'number',
    options?: ModalOption[],
    unit?: string,
  ) => setModalConfig({ field, title, type, options, unit });

  const handleSave = (val: string) => {
    if (!modalConfig) return;
    setGoals(prev => ({ ...prev, [modalConfig.field]: val }));
    setModalConfig(null);
  };

  const currentVal = modalConfig ? goals[modalConfig.field] : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Goals</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Banner ── */}
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>🎯</Text>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Set Your Goals</Text>
            <Text style={styles.bannerSub}>
              Define your targets and we'll build the perfect plan for you.
            </Text>
          </View>
        </View>

        {/* ── Primary Goal ── */}
        <SectionHeader title="Primary Goal" />
        <View style={styles.goalGrid}>
          {PRIMARY_GOALS.map(g => (
            <TouchableOpacity
              key={g.key}
              style={[
                styles.goalCard,
                goals.primary_goal === g.key && styles.goalCardActive,
              ]}
              onPress={() => setGoals(prev => ({ ...prev, primary_goal: g.key }))}
              activeOpacity={0.7}
            >
              <Text style={styles.goalEmoji}>{g.emoji}</Text>
              <Text style={[
                styles.goalLabel,
                goals.primary_goal === g.key && styles.goalLabelActive,
              ]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Weekly Goal ── */}
        <SectionHeader title="Weekly Goal" />
        <View style={styles.group}>
          <InfoCard
            emoji="📅"
            label="Rate of change"
            value={goals.weekly_goal ? getLabelByKey(WEEKLY_GOALS, goals.weekly_goal) : ''}
            onPress={() => openModal('weekly_goal', 'Weekly Goal', 'select', WEEKLY_GOALS)}
          />
        </View>

        {/* ── Activity Level ── */}
        <SectionHeader title="Activity Level" />
        <View style={styles.group}>
          {ACTIVITY_LEVELS.map(a => (
            <TouchableOpacity
              key={a.key}
              style={[
                styles.activityRow,
                goals.activity_level === a.key && styles.activityRowActive,
              ]}
              onPress={() => setGoals(prev => ({ ...prev, activity_level: a.key }))}
              activeOpacity={0.7}
            >
              <View style={styles.activityLeft}>
                <Text style={[
                  styles.activityLabel,
                  goals.activity_level === a.key && styles.activityLabelActive,
                ]}>
                  {a.label}
                </Text>
                <Text style={styles.activityDesc}>{a.desc}</Text>
              </View>
              <View style={[
                styles.radioOuter,
                goals.activity_level === a.key && styles.radioOuterActive,
              ]}>
                {goals.activity_level === a.key && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Daily Targets ── */}
        <SectionHeader title="Daily Targets" />
        <View style={styles.group}>
          <InfoCard
            emoji="🔥"
            label="Calorie Target"
            value={goals.daily_calories}
            unit="kcal"
            onPress={() => openModal('daily_calories', 'Daily Calorie Target', 'number', undefined, 'kcal')}
          />
          <InfoCard
            emoji="💧"
            label="Water Intake Goal"
            value={goals.daily_water}
            unit="L"
            onPress={() => openModal('daily_water', 'Daily Water Intake', 'number', undefined, 'L')}
          />
        </View>

        {/* ── Diet Type ── */}
        <SectionHeader title="Diet Type" />
        <View style={styles.dietGrid}>
          {DIET_TYPES.map(d => (
            <TouchableOpacity
              key={d.key}
              style={[
                styles.dietCard,
                goals.diet_type === d.key && styles.dietCardActive,
              ]}
              onPress={() => setGoals(prev => ({ ...prev, diet_type: d.key }))}
              activeOpacity={0.7}
            >
              <Text style={styles.dietEmoji}>{d.emoji}</Text>
              <Text style={[
                styles.dietLabel,
                goals.diet_type === d.key && styles.dietLabelActive,
              ]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Save Button ── */}
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Goals</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Modal ── */}
      {modalConfig && (
        <EditModal
          visible={!!modalConfig}
          title={modalConfig.title}
          type={modalConfig.type}
          value={currentVal}
          options={modalConfig.options}
          unit={modalConfig.unit}
          onClose={() => setModalConfig(null)}
          onSave={handleSave}
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

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  bannerEmoji: { fontSize: 36 },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  bannerSub: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2 },

  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },

  group: { gap: 8, marginBottom: Spacing.sm },

  // Primary Goal Grid
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  goalCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  goalCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  goalEmoji: { fontSize: 28 },
  goalLabel: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textDark },
  goalLabelActive: { color: Colors.primary },

  // Info Card
  infoCard: {
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
  infoCardEmoji: { fontSize: 22 },
  infoCardCenter: { flex: 1 },
  infoCardLabel: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  infoCardValue: { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textDark, marginTop: 2 },
  infoChevron: { fontSize: 22, color: Colors.textMuted },

  // Activity Level
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  activityRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  activityLeft: { flex: 1 },
  activityLabel: { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textDark },
  activityLabelActive: { color: Colors.primary },
  activityDesc: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: { borderColor: Colors.primary },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },

  // Diet Grid
  dietGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  dietCard: {
    width: '30%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  dietCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  dietEmoji: { fontSize: 24 },
  dietLabel: { fontSize: 11, fontWeight: '600', color: Colors.textDark, textAlign: 'center' },
  dietLabelActive: { color: Colors.primary },

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

  numberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  numberInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Fonts.sizes.xl,
    fontWeight: '700',
    color: Colors.textDark,
    backgroundColor: Colors.background,
    textAlign: 'center',
  },
  unitLabel: { fontSize: Fonts.sizes.lg, color: Colors.textMuted, fontWeight: '600' },

  optionsList: { gap: 8, marginBottom: Spacing.md },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  optionRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  optionEmoji: { fontSize: 20 },
  optionText: { fontSize: Fonts.sizes.md, color: Colors.textDark, fontWeight: '500' },
  optionTextActive: { color: Colors.primary, fontWeight: '700' },
  optionDesc: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  checkmark: { fontSize: 16, color: Colors.primary, fontWeight: '700' },

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