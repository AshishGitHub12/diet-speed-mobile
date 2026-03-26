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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealEntry {
  id: string;
  name: string;
  calories: string;
  time: string;
}

interface MealSection {
  title: string;
  icon: string;
  entries: MealEntry[];
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_MEALS: MealSection[] = [
  { title: 'Breakfast', icon: '🌅', entries: [] },
  { title: 'Lunch',     icon: '☀️', entries: [] },
  { title: 'Dinner',    icon: '🌙', entries: [] },
  { title: 'Snacks',    icon: '🍎', entries: [] },
];

// ─── Add Meal Modal ───────────────────────────────────────────────────────────

const AddMealRow = ({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string, calories: string) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');

  return (
    <View style={addStyles.container}>
      <TextInput
        style={addStyles.input}
        placeholder="Food name"
        placeholderTextColor={Colors.textPlaceholder}
        value={name}
        onChangeText={setName}
        autoFocus
        returnKeyType="next"
      />
      <TextInput
        style={[addStyles.input, addStyles.inputSmall]}
        placeholder="Calories"
        placeholderTextColor={Colors.textPlaceholder}
        value={calories}
        onChangeText={(t) => setCalories(t.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        returnKeyType="done"
        onSubmitEditing={() => onAdd(name, calories)}
      />
      <View style={addStyles.actions}>
        <TouchableOpacity style={addStyles.cancelBtn} onPress={onCancel}>
          <Text style={addStyles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[addStyles.addBtn, (!name || !calories) && addStyles.addBtnDisabled]}
          onPress={() => onAdd(name, calories)}
          disabled={!name || !calories}
        >
          <Text style={addStyles.addText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const addStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginTop: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    fontSize: Fonts.sizes.sm,
    color: Colors.textDark,
    backgroundColor: Colors.white,
  },
  inputSmall: { width: '50%' },
  actions: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    flex: 1, height: 36, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  cancelText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  addBtn: {
    flex: 1, height: 36, borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  addBtnDisabled: { backgroundColor: Colors.buttonDisabled },
  addText: { fontSize: Fonts.sizes.sm, color: Colors.white, fontWeight: '600' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MealLogScreen() {
  const router = useRouter();
  const [meals, setMeals] = useState<MealSection[]>(INITIAL_MEALS);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const totalCalories = meals.flatMap(m => m.entries).reduce((sum, e) => sum + parseInt(e.calories || '0'), 0);

  const handleAdd = (sectionTitle: string, name: string, calories: string) => {
    if (!name.trim() || !calories) return;
    setMeals(prev => prev.map(section => {
      if (section.title !== sectionTitle) return section;
      return {
        ...section,
        entries: [...section.entries, {
          id: Date.now().toString(),
          name: name.trim(),
          calories,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        }],
      };
    }));
    setAddingTo(null);
  };

  const handleDelete = (sectionTitle: string, id: string) => {
    setMeals(prev => prev.map(section => {
      if (section.title !== sectionTitle) return section;
      return { ...section, entries: section.entries.filter(e => e.id !== id) };
    }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Log</Text>
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
          {/* Calories summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalCalories}</Text>
              <Text style={styles.summaryLabel}>Consumed</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>2000</Text>
              <Text style={styles.summaryLabel}>Goal</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: 2000 - totalCalories < 0 ? Colors.error : Colors.primary }]}>
                {Math.max(0, 2000 - totalCalories)}
              </Text>
              <Text style={styles.summaryLabel}>Remaining</Text>
            </View>
          </View>

          {/* Meal sections */}
          {meals.map((section) => (
            <View key={section.title} style={styles.mealSection}>
              <View style={styles.mealSectionHeader}>
                <Text style={styles.mealSectionIcon}>{section.icon}</Text>
                <Text style={styles.mealSectionTitle}>{section.title}</Text>
                <Text style={styles.mealSectionCal}>
                  {section.entries.reduce((s, e) => s + parseInt(e.calories || '0'), 0)} kcal
                </Text>
                <TouchableOpacity
                  style={styles.addMealBtn}
                  onPress={() => setAddingTo(addingTo === section.title ? null : section.title)}
                >
                  <Text style={styles.addMealBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {/* Entries */}
              {section.entries.map((entry) => (
                <View key={entry.id} style={styles.entryRow}>
                  <View style={styles.entryLeft}>
                    <Text style={styles.entryName}>{entry.name}</Text>
                    <Text style={styles.entryTime}>{entry.time}</Text>
                  </View>
                  <Text style={styles.entryCal}>{entry.calories} kcal</Text>
                  <TouchableOpacity onPress={() => handleDelete(section.title, entry.id)} style={styles.deleteBtn}>
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* Add form */}
              {addingTo === section.title && (
                <AddMealRow
                  onAdd={(name, cal) => handleAdd(section.title, name, cal)}
                  onCancel={() => setAddingTo(null)}
                />
              )}

              {section.entries.length === 0 && addingTo !== section.title && (
                <Text style={styles.emptyText}>No meals added yet</Text>
              )}
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

  summaryCard: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.primary },
  summaryLabel: { fontSize: 11, color: Colors.textMuted },
  summaryDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  mealSection: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  mealSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  mealSectionIcon: { fontSize: 18, marginRight: 6 },
  mealSectionTitle: { flex: 1, fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  mealSectionCal: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginRight: 8 },
  addMealBtn: {
    backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  addMealBtnText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  entryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  entryLeft: { flex: 1 },
  entryName: { fontSize: Fonts.sizes.sm, color: Colors.textDark, fontWeight: '500' },
  entryTime: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  entryCal: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600', marginRight: 10 },
  deleteBtn: { padding: 4 },
  deleteText: { fontSize: 12, color: Colors.textMuted },
  emptyText: { fontSize: Fonts.sizes.sm, color: Colors.textPlaceholder, textAlign: 'center', paddingVertical: 8 },
});