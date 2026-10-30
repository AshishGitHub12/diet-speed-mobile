import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Shared design system (matches Home, Diet, Challenges, Notifications,
// Recipes, Explore, Profile, MyAccount…) ────────────────────────────────────

const Accent = { gold: '#B9892E', plum: '#6E5A8C', teal: '#3E7CA6', berry: '#8B3A42' };
const Tint   = { mint: '#E1EEDD', peach: '#F5E6D3', lilac: '#E7E2F0', sky: '#DCEAF2' };
const LIME   = '#B9F24C';

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

type ReminderType = 'meal' | 'water' | 'workout' | 'weight';

interface Reminder {
  id: string;
  type: ReminderType;
  title: string;
  subtitle: string;
  time: string;
  days: string; // e.g. "Every day" / "Mon, Wed, Fri"
  enabled: boolean;
}

// NOTE: UI-only for now — local state, no API calls yet. Will wire to the
// backend (GET/POST/PATCH/DELETE reminders) once the UI is approved.
const INITIAL_REMINDERS: Reminder[] = [
  { id: '1', type: 'meal', title: 'Breakfast', subtitle: 'Log your first meal', time: '8:00 AM', days: 'Every day', enabled: true },
  { id: '2', type: 'water', title: 'Drink Water', subtitle: 'Stay hydrated', time: '11:00 AM', days: 'Every day', enabled: true },
  { id: '3', type: 'meal', title: 'Lunch', subtitle: 'Don’t skip it', time: '1:30 PM', days: 'Every day', enabled: true },
  { id: '4', type: 'workout', title: 'Workout', subtitle: 'Time to move', time: '6:00 PM', days: 'Mon, Wed, Fri', enabled: false },
  { id: '5', type: 'meal', title: 'Dinner', subtitle: 'Last meal of the day', time: '8:30 PM', days: 'Every day', enabled: true },
  { id: '6', type: 'weight', title: 'Weigh-In', subtitle: 'Track your progress', time: '7:00 AM', days: 'Every Sunday', enabled: false },
];

const TYPE_STYLE: Record<ReminderType, { accent: string; tint: string; icon: keyof typeof Ionicons.glyphMap }> = {
  meal:    { accent: Accent.gold,  tint: Tint.peach, icon: 'restaurant-outline' },
  water:   { accent: Accent.teal,  tint: Tint.sky,   icon: 'water-outline' },
  workout: { accent: Accent.berry, tint: Tint.lilac, icon: 'barbell-outline' },
  weight:  { accent: Accent.plum,  tint: Tint.lilac, icon: 'speedometer-outline' },
};

const TIME_OPTIONS = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM',
  '11:00 AM', '12:00 PM', '1:00 PM', '1:30 PM', '2:00 PM',
  '5:00 PM', '6:00 PM', '6:30 PM', '7:00 PM', '8:00 PM', '8:30 PM', '9:00 PM',
];

const DAY_OPTIONS = ['Every day', 'Weekdays', 'Weekends', 'Mon, Wed, Fri', 'Every Sunday'];

const TYPE_OPTIONS: { type: ReminderType; label: string }[] = [
  { type: 'meal', label: 'Meal' },
  { type: 'water', label: 'Water' },
  { type: 'workout', label: 'Workout' },
  { type: 'weight', label: 'Weigh-In' },
];

function AddReminderModal({
  visible, onClose, onAdd,
}: { visible: boolean; onClose: () => void; onAdd: (r: Omit<Reminder, 'id' | 'enabled'>) => void }) {
  const [type, setType] = useState<ReminderType>('meal');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('8:00 AM');
  const [days, setDays] = useState('Every day');

  const reset = () => { setType('meal'); setTitle(''); setTime('8:00 AM'); setDays('Every day'); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={[m.sheet, leafRadius(BorderRadius.xl)]}>
          <View style={m.sheetHeader}>
            <Text style={m.sheetTitle}>New Reminder</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }} style={m.closeBtn}>
              <Ionicons name="close" size={18} color={Colors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 420 }}>
            <Text style={m.label}>Type</Text>
            <View style={m.typeRow}>
              {TYPE_OPTIONS.map((opt) => {
                const ts = TYPE_STYLE[opt.type];
                const active = type === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    style={[m.typeChip, { backgroundColor: active ? ts.tint : Colors.white, borderColor: active ? ts.accent : Colors.border }]}
                    onPress={() => setType(opt.type)}
                  >
                    <Ionicons name={ts.icon} size={16} color={active ? ts.accent : Colors.textMuted} />
                    <Text style={[m.typeChipText, { color: active ? ts.accent : Colors.textMuted }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={m.label}>Title</Text>
            <View style={[m.inputBox, leafRadius(BorderRadius.md)]}>
              <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
                <Text style={[m.inputText, !title && { color: Colors.textMuted }]} onPress={() => {}}>
                  {title || 'e.g. Evening Walk'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={m.label}>Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
              {TIME_OPTIONS.map((t) => {
                const active = time === t;
                const ts = TYPE_STYLE[type];
                return (
                  <TouchableOpacity
                    key={t}
                    style={[m.pill, { backgroundColor: active ? ts.accent : Colors.white, borderColor: active ? ts.accent : Colors.border }]}
                    onPress={() => setTime(t)}
                  >
                    <Text style={[m.pillText, { color: active ? Colors.white : Colors.textDark }]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={m.label}>Repeat</Text>
            <View style={{ gap: 8, marginBottom: Spacing.md }}>
              {DAY_OPTIONS.map((d) => {
                const active = days === d;
                const ts = TYPE_STYLE[type];
                return (
                  <TouchableOpacity
                    key={d}
                    style={[m.dayRow, { backgroundColor: active ? ts.tint : Colors.white, borderColor: active ? ts.accent : Colors.border }]}
                    onPress={() => setDays(d)}
                  >
                    <Text style={[m.dayRowText, active && { color: ts.accent, fontWeight: '800' }]}>{d}</Text>
                    {active && <Ionicons name="checkmark-circle" size={18} color={ts.accent} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[m.saveBtn, !title.trim() && m.saveBtnDisabled]}
            disabled={!title.trim()}
            onPress={() => {
              onAdd({ type, title: title.trim(), subtitle: TYPE_OPTIONS.find((o) => o.type === type)?.label || '', time, days });
              reset();
              onClose();
            }}
          >
            <Text style={m.saveBtnText}>Add Reminder</Text>
            <Ionicons name="checkmark" size={18} color={Colors.textDark} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function RemindersScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>(INITIAL_REMINDERS);
  const [modalVisible, setModalVisible] = useState(false);

  const toggleReminder = (id: string) => {
    // UI-only toggle for now — will call api.patch(`/reminders/${id}/`, { enabled }) once backend is wired.
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const addReminder = (r: Omit<Reminder, 'id' | 'enabled'>) => {
    // UI-only add for now — will call api.post('/reminders/', r) once backend is wired.
    setReminders((prev) => [...prev, { ...r, id: String(Date.now()), enabled: true }]);
  };

  const activeCount = reminders.filter((r) => r.enabled).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.headerBtn}>
          <Ionicons name="add" size={22} color={Colors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Dark hero summary card */}
        <View style={[styles.hero, leafRadius(BorderRadius.xl)]}>
          <View style={styles.heroBlobTop} />
          <View style={styles.heroBlobBottom} />
          <View style={styles.heroIconWrap}>
            <Ionicons name="notifications" size={22} color={LIME} />
          </View>
          <Text style={styles.heroValue}>{activeCount} active</Text>
          <Text style={styles.heroSub}>of {reminders.length} reminders set</Text>
        </View>

        <Text style={styles.sectionLabel}>All Reminders</Text>

        {reminders.map((r) => {
          const ts = TYPE_STYLE[r.type];
          return (
            <View key={r.id} style={[styles.card, leafRadius(BorderRadius.lg), !r.enabled && styles.cardDisabled]}>
              <View style={[styles.iconBox, { backgroundColor: ts.tint }]}>
                <Ionicons name={ts.icon} size={18} color={ts.accent} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{r.title}</Text>
                <Text style={styles.cardSubtitle}>{r.subtitle}</Text>
                <View style={styles.cardMetaRow}>
                  <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.cardMeta}>{r.time}</Text>
                  <View style={styles.dot} />
                  <Ionicons name="repeat-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.cardMeta}>{r.days}</Text>
                </View>
              </View>
              <Switch
                value={r.enabled}
                onValueChange={() => toggleReminder(r.id)}
                trackColor={{ false: Colors.border, true: LIME }}
                thumbColor={Colors.white}
              />
            </View>
          );
        })}

        {reminders.length === 0 && (
          <Text style={styles.emptyText}>No reminders yet — tap + to add one.</Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <AddReminderModal visible={modalVisible} onClose={() => setModalVisible(false)} onAdd={addReminder} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
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
  scrollContent: { padding: Spacing.md, gap: Spacing.sm },

  hero: {
    backgroundColor: Colors.textDark, padding: Spacing.lg, marginBottom: Spacing.md,
    overflow: 'hidden', position: 'relative',
  },
  heroBlobTop: {
    position: 'absolute', top: -30, right: -30, width: 110, height: 110,
    borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroBlobBottom: {
    position: 'absolute', bottom: -40, left: -20, width: 90, height: 90,
    borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  heroIconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(185,242,76,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  heroValue: { color: Colors.white, fontSize: Fonts.sizes.xxl, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.65)', fontSize: Fonts.sizes.sm, marginTop: 2, fontWeight: '500' },

  sectionLabel: { fontSize: Fonts.sizes.sm, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, marginTop: 4 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, padding: Spacing.sm + 2,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardDisabled: { opacity: 0.55 },
  iconBox: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.textDark },
  cardSubtitle: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '500' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardMeta: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textMuted, marginHorizontal: 2 },

  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.background, padding: Spacing.lg, maxHeight: '85%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  sheetTitle: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.textDark },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: Fonts.sizes.sm, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: Spacing.sm },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.sm },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 8 },
  typeChipText: { fontSize: Fonts.sizes.sm, fontWeight: '700' },
  inputBox: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, marginBottom: Spacing.sm },
  inputText: { fontSize: Fonts.sizes.md, color: Colors.textDark, fontWeight: '600' },
  pill: { borderWidth: 1.5, borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  pillText: { fontSize: Fonts.sizes.sm, fontWeight: '700' },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderRadius: BorderRadius.md, paddingHorizontal: 14, paddingVertical: 12 },
  dayRowText: { fontSize: Fonts.sizes.sm, color: Colors.textDark, fontWeight: '600' },
  saveBtn: {
    height: 54, borderRadius: BorderRadius.xl, backgroundColor: LIME,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: Spacing.sm, shadowColor: LIME, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2,
  },
  saveBtnDisabled: { backgroundColor: Colors.border, shadowOpacity: 0 },
  saveBtnText: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.textDark },
});