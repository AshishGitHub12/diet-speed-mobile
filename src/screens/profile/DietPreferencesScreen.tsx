import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

const DIET_TYPES = ['No Preference', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean', 'Intermittent Fasting'];
const ALLERGIES = ['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish', 'Fish'];
const MEAL_TIMES = ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'];

export default function DietPreferencesScreen() {
  const router = useRouter();
  const [selectedDiet, setSelectedDiet] = useState('No Preference');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [mealReminders, setMealReminders] = useState<Record<string, boolean>>({
    'Breakfast': true,
    'Mid-Morning Snack': false,
    'Lunch': true,
    'Evening Snack': false,
    'Dinner': true,
  });
  const [calorieGoal] = useState('2000');
  const [saved, setSaved] = useState(false);

  const toggleAllergy = (a: string) => {
    setSelectedAllergies(prev =>
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  const toggleMeal = (meal: string) => {
    setMealReminders(prev => ({ ...prev, [meal]: !prev[meal] }));
  };

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
        <Text style={styles.headerTitle}>Diet Preferences</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Calorie goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Calorie Goal</Text>
          <View style={styles.calorieCard}>
            <Text style={styles.calorieValue}>{calorieGoal}</Text>
            <Text style={styles.calorieUnit}>kcal / day</Text>
          </View>
        </View>

        {/* Diet type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diet Type</Text>
          <View style={styles.chipsWrap}>
            {DIET_TYPES.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, selectedDiet === d && styles.chipActive]}
                onPress={() => setSelectedDiet(d)}
              >
                <Text style={[styles.chipText, selectedDiet === d && styles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies & Restrictions</Text>
          <View style={styles.chipsWrap}>
            {ALLERGIES.map(a => (
              <TouchableOpacity
                key={a}
                style={[styles.chip, selectedAllergies.includes(a) && styles.chipDanger]}
                onPress={() => toggleAllergy(a)}
              >
                <Text style={[styles.chipText, selectedAllergies.includes(a) && styles.chipTextDanger]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Meal reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Reminders</Text>
          <View style={styles.card}>
            {MEAL_TIMES.map((meal, i) => (
              <View key={meal} style={[styles.toggleRow, i > 0 && styles.toggleBorder]}>
                <Text style={styles.toggleLabel}>{meal}</Text>
                <Switch
                  value={mealReminders[meal]}
                  onValueChange={() => toggleMeal(meal)}
                  trackColor={{ false: Colors.border, true: Colors.primaryMuted }}
                  thumbColor={mealReminders[meal] ? Colors.primary : '#f4f3f4'}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>{saved ? '✓ Saved!' : 'Save Preferences'}</Text>
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

  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark, marginBottom: Spacing.sm,
  },

  calorieCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 8,
  },
  calorieValue: { fontSize: 40, fontWeight: '800', color: Colors.white },
  calorieUnit: { fontSize: Fonts.sizes.md, color: 'rgba(255,255,255,0.8)', marginTop: 8 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipDanger: { backgroundColor: '#FFEBEE', borderColor: '#F44336' },
  chipText: { fontSize: Fonts.sizes.sm, color: Colors.textDark },
  chipTextActive: { color: Colors.white, fontWeight: '600' },
  chipTextDanger: { color: '#C62828', fontWeight: '600' },

  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  toggleBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  toggleLabel: { fontSize: Fonts.sizes.md, color: Colors.textDark },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    height: 56, justifyContent: 'center', alignItems: 'center',
  },
  saveBtnSuccess: { backgroundColor: '#4CAF50' },
  saveBtnText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});