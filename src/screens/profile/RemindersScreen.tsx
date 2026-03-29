import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

const REMINDERS = [
  {
    id: '1', title: 'Breakfast Reminder', time: '8:00 AM',
    icon: '🌅', enabled: true, category: 'Meals',
  },
  {
    id: '2', title: 'Lunch Reminder', time: '1:00 PM',
    icon: '☀️', enabled: true, category: 'Meals',
  },
  {
    id: '3', title: 'Dinner Reminder', time: '8:00 PM',
    icon: '🌙', enabled: false, category: 'Meals',
  },
  {
    id: '4', title: 'Morning Workout', time: '6:30 AM',
    icon: '🏃', enabled: true, category: 'Workout',
  },
  {
    id: '5', title: 'Evening Walk', time: '6:00 PM',
    icon: '🚶', enabled: false, category: 'Workout',
  },
  {
    id: '6', title: 'Water Reminder', time: 'Every 2 hours',
    icon: '💧', enabled: true, category: 'Health',
  },
  {
    id: '7', title: 'Sleep Reminder', time: '10:30 PM',
    icon: '😴', enabled: true, category: 'Health',
  },
  {
    id: '8', title: 'Weight Log', time: '7:00 AM',
    icon: '⚖️', enabled: false, category: 'Health',
  },
];

const CATEGORIES = ['All', 'Meals', 'Workout', 'Health'];

export default function RemindersScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState(REMINDERS);
  const [activeCategory, setActiveCategory] = useState('All');
  const [saved, setSaved] = useState(false);

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const filtered = activeCategory === 'All'
    ? reminders
    : reminders.filter(r => r.category === activeCategory);

  const enabledCount = reminders.filter(r => r.enabled).length;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryIcon}>🔔</Text>
          <View>
            <Text style={styles.summaryValue}>{enabledCount} Active Reminders</Text>
            <Text style={styles.summarySubtext}>Out of {reminders.length} total</Text>
          </View>
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.filterText, activeCategory === cat && styles.filterTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Reminder list */}
        <View style={styles.reminderList}>
          {filtered.map((reminder, i) => (
            <View key={reminder.id} style={[styles.reminderRow, i > 0 && styles.reminderBorder]}>
              <View style={[styles.reminderIconWrapper, !reminder.enabled && styles.reminderIconDisabled]}>
                <Text style={styles.reminderIcon}>{reminder.icon}</Text>
              </View>
              <View style={styles.reminderInfo}>
                <Text style={[styles.reminderTitle, !reminder.enabled && styles.reminderTitleDisabled]}>
                  {reminder.title}
                </Text>
                <Text style={styles.reminderTime}>{reminder.time}</Text>
              </View>
              <Switch
                value={reminder.enabled}
                onValueChange={() => toggleReminder(reminder.id)}
                trackColor={{ false: Colors.border, true: Colors.primaryMuted }}
                thumbColor={reminder.enabled ? Colors.primary : '#f4f3f4'}
              />
            </View>
          ))}
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>{saved ? '✓ Saved!' : 'Save Reminders'}</Text>
        </TouchableOpacity>

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

  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  summaryIcon: { fontSize: 32 },
  summaryValue: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  summarySubtext: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

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

  reminderList: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden',
    marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  reminderRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 14, gap: 12,
  },
  reminderBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  reminderIconWrapper: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center',
  },
  reminderIconDisabled: { backgroundColor: Colors.border, opacity: 0.6 },
  reminderIcon: { fontSize: 22 },
  reminderInfo: { flex: 1 },
  reminderTitle: { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textDark },
  reminderTitleDisabled: { color: Colors.textMuted },
  reminderTime: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    height: 56, justifyContent: 'center', alignItems: 'center',
  },
  saveBtnSuccess: { backgroundColor: '#4CAF50' },
  saveBtnText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});