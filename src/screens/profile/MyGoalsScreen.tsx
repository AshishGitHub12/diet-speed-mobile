import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

interface Goals {
  primary_goal: string; weekly_goal: string; activity_level: string;
  daily_calories: string; daily_water: string; diet_type: string;
}

const PRIMARY_GOALS = [
  { key: 'lose_weight',  label: 'Lose Weight',  icon: 'trending-down-outline'  as const },
  { key: 'gain_weight',  label: 'Gain Weight',  icon: 'trending-up-outline'    as const },
  { key: 'maintain',     label: 'Maintain',     icon: 'remove-outline'         as const },
  { key: 'build_muscle', label: 'Build Muscle', icon: 'barbell-outline'        as const },
];

const WEEKLY_GOALS = [
  { key: '0.25', label: '0.25 kg / week', desc: 'Slow & steady' },
  { key: '0.5',  label: '0.5 kg / week',  desc: 'Recommended' },
  { key: '0.75', label: '0.75 kg / week', desc: 'Moderate' },
  { key: '1.0',  label: '1.0 kg / week',  desc: 'Aggressive' },
];

const ACTIVITY_LEVELS = [
  { key: 'sedentary',        label: 'Sedentary',          desc: 'Little or no exercise',  icon: 'bed-outline'      as const },
  { key: 'lightly_active',   label: 'Lightly Active',     desc: '1–3 days/week',          icon: 'walk-outline'     as const },
  { key: 'moderately_active',label: 'Moderately Active',  desc: '3–5 days/week',          icon: 'bicycle-outline'  as const },
  { key: 'very_active',      label: 'Very Active',        desc: '6–7 days/week',          icon: 'barbell-outline'  as const },
];

const DIET_TYPES = [
  { key: 'no_preference', label: 'No Preference', icon: 'restaurant-outline' as const },
  { key: 'vegetarian',    label: 'Vegetarian',    icon: 'leaf-outline'       as const },
  { key: 'vegan',         label: 'Vegan',         icon: 'flower-outline'     as const },
  { key: 'keto',          label: 'Keto',          icon: 'flame-outline'      as const },
  { key: 'paleo',         label: 'Paleo',         icon: 'fish-outline'       as const },
];

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalOption { key: string; label: string; desc?: string; }

const EditModal = ({ visible, title, type, value, options = [], unit, onClose, onSave }: {
  visible: boolean; title: string; type: 'select'|'number';
  value: string; options?: ModalOption[]; unit?: string;
  onClose: () => void; onSave: (v: string) => void;
}) => {
  const [localVal, setLocalVal] = useState(value);
  React.useEffect(() => { setLocalVal(value); }, [value, visible]);

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

          {type === 'number' && (
            <View style={m.numberRow}>
              <TextInput
                style={m.numberInput} value={localVal} onChangeText={setLocalVal}
                keyboardType="numeric" placeholder="0"
                placeholderTextColor={Colors.textMuted} autoFocus
              />
              {unit && <Text style={m.unitLabel}>{unit}</Text>}
            </View>
          )}

          {type === 'select' && (
            <View style={m.optionsList}>
              {options.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[m.optionRow, localVal === opt.key && m.optionRowActive]}
                  onPress={() => setLocalVal(opt.key)} activeOpacity={0.7}
                >
                  <View style={m.optionLeft}>
                    <Text style={[m.optionText, localVal === opt.key && m.optionTextActive]}>{opt.label}</Text>
                    {opt.desc && <Text style={m.optionDesc}>{opt.desc}</Text>}
                  </View>
                  <Ionicons
                    name={localVal === opt.key ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20} color={localVal === opt.key ? Colors.primary : Colors.border}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={m.actions}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={m.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.saveBtn} onPress={() => onSave(localVal)} activeOpacity={0.85}>
              <Text style={m.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MyGoalsScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goals>({
    primary_goal: '', weekly_goal: '', activity_level: '',
    daily_calories: '', daily_water: '', diet_type: '',
  });
  const [modalConfig, setModalConfig] = useState<{
    field: keyof Goals; title: string; type: 'select'|'number';
    options?: ModalOption[]; unit?: string;
  } | null>(null);

  const openModal = (field: keyof Goals, title: string, type: 'select'|'number', options?: ModalOption[], unit?: string) =>
    setModalConfig({ field, title, type, options, unit });

  const handleSave = (val: string) => {
    if (!modalConfig) return;
    setGoals(prev => ({ ...prev, [modalConfig.field]: val }));
    setModalConfig(null);
  };

  const getLabelByKey = (arr: ModalOption[], key: string) =>
    arr.find(o => o.key === key)?.label ?? key;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Goals</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconBox}>
            <Ionicons name="trophy-outline" size={28} color={Colors.primary} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Set Your Goals</Text>
            <Text style={styles.bannerSub}>Define your targets and we'll build the perfect plan.</Text>
          </View>
        </View>

        {/* Primary Goal */}
        <Text style={styles.sectionTitle}>Primary Goal</Text>
        <View style={styles.goalGrid}>
          {PRIMARY_GOALS.map(g => (
            <TouchableOpacity
              key={g.key}
              style={[styles.goalCard, goals.primary_goal === g.key && styles.goalCardActive]}
              onPress={() => setGoals(prev => ({ ...prev, primary_goal: g.key }))}
              activeOpacity={0.7}
            >
              <View style={[styles.goalIconBox, goals.primary_goal === g.key && styles.goalIconBoxActive]}>
                <Ionicons name={g.icon} size={24} color={goals.primary_goal === g.key ? Colors.white : Colors.primary} />
              </View>
              <Text style={[styles.goalLabel, goals.primary_goal === g.key && styles.goalLabelActive]}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weekly Goal */}
        <Text style={styles.sectionTitle}>Weekly Goal</Text>
        <TouchableOpacity
          style={styles.infoCard}
          onPress={() => openModal('weekly_goal', 'Weekly Goal', 'select', WEEKLY_GOALS)}
          activeOpacity={0.7}
        >
          <View style={styles.iconBox}>
            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
          </View>
          <View style={styles.infoCardCenter}>
            <Text style={styles.infoCardLabel}>Rate of change</Text>
            <Text style={styles.infoCardValue}>
              {goals.weekly_goal ? getLabelByKey(WEEKLY_GOALS, goals.weekly_goal) : 'Tap to select'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Activity Level */}
        <Text style={styles.sectionTitle}>Activity Level</Text>
        <View style={styles.group}>
          {ACTIVITY_LEVELS.map(a => (
            <TouchableOpacity
              key={a.key}
              style={[styles.activityRow, goals.activity_level === a.key && styles.activityRowActive]}
              onPress={() => setGoals(prev => ({ ...prev, activity_level: a.key }))}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, goals.activity_level === a.key && styles.iconBoxActive]}>
                <Ionicons name={a.icon} size={18} color={goals.activity_level === a.key ? Colors.white : Colors.primary} />
              </View>
              <View style={styles.activityCenter}>
                <Text style={[styles.activityLabel, goals.activity_level === a.key && styles.activityLabelActive]}>{a.label}</Text>
                <Text style={styles.activityDesc}>{a.desc}</Text>
              </View>
              <Ionicons
                name={goals.activity_level === a.key ? 'checkmark-circle' : 'ellipse-outline'}
                size={22} color={goals.activity_level === a.key ? Colors.primary : Colors.border}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Targets */}
        <Text style={styles.sectionTitle}>Daily Targets</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.infoCard} onPress={() => openModal('daily_calories', 'Daily Calorie Target', 'number', undefined, 'kcal')} activeOpacity={0.7}>
            <View style={styles.iconBox}>
              <Ionicons name="flame-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoCardCenter}>
              <Text style={styles.infoCardLabel}>Calorie Target</Text>
              <Text style={styles.infoCardValue}>{goals.daily_calories ? `${goals.daily_calories} kcal` : 'Tap to set'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard} onPress={() => openModal('daily_water', 'Daily Water Intake', 'number', undefined, 'L')} activeOpacity={0.7}>
            <View style={styles.iconBox}>
              <Ionicons name="water-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoCardCenter}>
              <Text style={styles.infoCardLabel}>Water Intake Goal</Text>
              <Text style={styles.infoCardValue}>{goals.daily_water ? `${goals.daily_water} L` : 'Tap to set'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Diet Type */}
        <Text style={styles.sectionTitle}>Diet Type</Text>
        <View style={styles.dietGrid}>
          {DIET_TYPES.map(d => (
            <TouchableOpacity
              key={d.key}
              style={[styles.dietCard, goals.diet_type === d.key && styles.dietCardActive]}
              onPress={() => setGoals(prev => ({ ...prev, diet_type: d.key }))}
              activeOpacity={0.7}
            >
              <View style={[styles.dietIconBox, goals.diet_type === d.key && styles.dietIconBoxActive]}>
                <Ionicons name={d.icon} size={22} color={goals.diet_type === d.key ? Colors.white : Colors.primary} />
              </View>
              <Text style={[styles.dietLabel, goals.diet_type === d.key && styles.dietLabelActive]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
          <Text style={styles.saveBtnText}>Save Goals</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {modalConfig && (
        <EditModal
          visible={!!modalConfig} title={modalConfig.title} type={modalConfig.type}
          value={goals[modalConfig.field]} options={modalConfig.options} unit={modalConfig.unit}
          onClose={() => setModalConfig(null)} onSave={handleSave}
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
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark, marginBottom: Spacing.sm, marginTop: Spacing.md },
  group: { gap: 8, marginBottom: Spacing.sm },

  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.md },
  bannerIconBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
  bannerText:  { flex: 1 },
  bannerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  bannerSub:   { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2 },

  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.sm },
  goalCard: { width: '47%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: Spacing.md, alignItems: 'center', gap: 8 },
  goalCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  goalIconBox:       { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  goalIconBoxActive: { backgroundColor: Colors.primary },
  goalLabel:       { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textDark },
  goalLabelActive: { color: Colors.primary },

  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, marginBottom: 8 },
  iconBox:     { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  iconBoxActive: { backgroundColor: Colors.primary },
  infoCardCenter: { flex: 1 },
  infoCardLabel:  { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  infoCardValue:  { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textDark, marginTop: 2 },

  activityRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, gap: Spacing.sm },
  activityRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  activityCenter: { flex: 1 },
  activityLabel:       { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textDark },
  activityLabelActive: { color: Colors.primary },
  activityDesc: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2 },

  dietGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.sm },
  dietCard: { width: '30%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: Spacing.md, alignItems: 'center', gap: 6 },
  dietCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  dietIconBox:       { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  dietIconBoxActive: { backgroundColor: Colors.primary },
  dietLabel:       { fontSize: 11, fontWeight: '600', color: Colors.textDark, textAlign: 'center' },
  dietLabelActive: { color: Colors.primary },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 56, marginTop: Spacing.lg },
  saveBtnText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white, letterSpacing: 0.5 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg + 16, paddingTop: Spacing.sm },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title:    { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark },
  numberRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  numberInput: { flex: 1, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.textDark, backgroundColor: Colors.background, textAlign: 'center' },
  unitLabel:   { fontSize: Fonts.sizes.lg, color: Colors.textMuted, fontWeight: '600' },
  optionsList:     { gap: 8, marginBottom: Spacing.md },
  optionRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  optionRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  optionLeft:      { flex: 1 },
  optionText:      { fontSize: Fonts.sizes.md, color: Colors.textDark, fontWeight: '500' },
  optionTextActive:{ color: Colors.primary, fontWeight: '700' },
  optionDesc:      { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  actions:    { flexDirection: 'row', gap: 12 },
  cancelBtn:  { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, height: 52, justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontSize: Fonts.sizes.md, color: Colors.textMuted, fontWeight: '600' },
  saveBtn:    { flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 52, justifyContent: 'center', alignItems: 'center' },
  saveText:   { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});