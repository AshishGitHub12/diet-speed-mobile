import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import api from '@/src/services/api';

// Same mount as DietScreen — this is the SAME `meals` app, just a read-only
// history view (no add/edit here — use the Diet Tracker screen to log food).
const MEAL_BASE = '/meals/';

// ─── Types — match DietView / MealEntrySerializer exactly ──────────────────────

type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

interface MealItem {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: string; // e.g. "2 piece", "150 g" — already includes the unit
}

interface MealSection {
  type: MealType;
  label: string;
  icon: string;
  items: MealItem[];
}

interface DietResponse {
  calories_target: number;
  calories_consumed: number;
  macros?: {
    protein: { target: number; consumed: number };
    carbs:   { target: number; consumed: number };
    fat:     { target: number; consumed: number };
  };
  meals: { type: MealType; label: string; items: MealItem[] }[];
  water_glasses?: number;
  water_target?: number;
}

interface NutritionTotals {
  calories: number; protein: number; carbs: number; fat: number; itemCount: number;
}

const SECTION_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  snack: '🍎',
  dinner: '🌙',
};
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
const DEFAULT_CALORIE_GOAL = 2000;

// ─── Helpers ────────────────────────────────────────────────────────────────

const toNumber = (v: number | string | null | undefined): number => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const formatNumber = (v: number): string => Number(v.toFixed(1)).toString();

const toIso = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatLabel = (d: Date, todayIso: string) => {
  const iso = toIso(d);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (iso === todayIso) return 'Today';
  if (iso === toIso(yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const calculateTotals = (items: MealItem[]): NutritionTotals =>
  items.reduce<NutritionTotals>((totals, item) => {
    totals.calories += toNumber(item.calories);
    totals.protein += toNumber(item.protein);
    totals.carbs += toNumber(item.carbs);
    totals.fat += toNumber(item.fat);
    totals.itemCount += 1;
    return totals;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, itemCount: 0 });

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MealLogScreen() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [sections, setSections] = useState<MealSection[]>([]);
  const [calorieGoal, setCalorieGoal] = useState(DEFAULT_CALORIE_GOAL);
  const [totalCalories, setTotalCalories] = useState(0);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [waterTarget, setWaterTarget] = useState(8);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const todayIso = toIso(new Date());
  const selectedIso = useMemo(() => toIso(selectedDate), [selectedDate]);
  const isToday = selectedIso === todayIso;

  const fetchMeals = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setIsLoading(true);
    try {
      const { data } = await api.get<DietResponse>(MEAL_BASE, { params: { date: selectedIso } });

      const formatted: MealSection[] = (data.meals ?? [])
        .map((m) => ({ type: m.type, label: m.label, icon: SECTION_ICONS[m.type] ?? '🍽️', items: m.items ?? [] }))
        .sort((a, b) => MEAL_ORDER.indexOf(a.type) - MEAL_ORDER.indexOf(b.type));

      setSections(formatted);
      setCalorieGoal(toNumber(data.calories_target) || DEFAULT_CALORIE_GOAL);

      const calculated = formatted.reduce(
        (sum, s) => sum + s.items.reduce((ms, i) => ms + toNumber(i.calories), 0), 0
      );
      setTotalCalories(data.calories_consumed != null ? toNumber(data.calories_consumed) : calculated);

      setWaterGlasses(toNumber(data.water_glasses));
      setWaterTarget(toNumber(data.water_target) || 8);
    } catch (error: any) {
      console.log('❌ Meal log fetch error:', error?.response?.status, JSON.stringify(error?.response?.data));
      Alert.alert('Error', 'Failed to load meals for this date.');
      setSections([]);
      setTotalCalories(0);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedIso]);

  useFocusEffect(
    useCallback(() => {
      fetchMeals();
    }, [fetchMeals])
  );

  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };
  const goToNextDay = () => {
    if (isToday) return;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };
  const onPickerChange = (event: any, picked?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (event.type === 'dismissed' || !picked) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const chosen = new Date(picked); chosen.setHours(0, 0, 0, 0);
    setSelectedDate(chosen > today ? today : chosen);
  };

  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const dailyTotals = useMemo(() => calculateTotals(allItems), [allItems]);
  const remainingCalories = Math.max(calorieGoal - totalCalories, 0);
  const calorieProgress = calorieGoal > 0 ? Math.min(totalCalories / calorieGoal, 1) : 0;
  const waterProgress = waterTarget > 0 ? Math.min(waterGlasses / waterTarget, 1) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Meal Log</Text>
          <Text style={styles.headerSubtitle}>Track your daily nutrition</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {/* Date navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.dateArrowBtn} onPress={goToPrevDay}>
          <Text style={styles.dateArrow}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateCenter} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
          <Text style={styles.dateLabel}>{formatLabel(selectedDate, todayIso)}</Text>
          <Text style={styles.dateSubLabel}>
            {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}  📅
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateArrowBtn, isToday && styles.dateArrowBtnDisabled]}
          onPress={goToNextDay}
          disabled={isToday}
        >
          <Text style={[styles.dateArrow, isToday && styles.dateArrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          maximumDate={new Date()}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
        />
      )}

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchMeals(true)} tintColor={Colors.primary} />
          }
        >
          {/* Calories + Total Day Macros */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Daily Nutrition</Text>

            <View style={styles.calorieRow}>
              <View style={styles.calorieMain}>
                <Text style={styles.calorieValue}>{Math.round(totalCalories)}</Text>
                <Text style={styles.calorieLabel}>kcal consumed</Text>
              </View>
              <View style={styles.calorieGoalBox}>
                <Text style={styles.calorieGoalValue}>{Math.round(calorieGoal)}</Text>
                <Text style={styles.calorieLabel}>kcal goal</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${calorieProgress * 100}%` }]} />
            </View>
            <Text style={styles.remainingText}>
              {totalCalories >= calorieGoal
                ? `${Math.round(totalCalories - calorieGoal)} kcal over your goal`
                : `${Math.round(remainingCalories)} kcal remaining`}
            </Text>

            <View style={styles.sectionDivider} />

            <Text style={styles.macroSectionTitle}>Total Day Macros</Text>
            <View style={styles.dailyMacroRow}>
              <View style={styles.dailyMacroItem}>
                <Text style={styles.dailyMacroValue}>{formatNumber(dailyTotals.protein)} g</Text>
                <Text style={styles.dailyMacroLabel}>Protein</Text>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.dailyMacroItem}>
                <Text style={styles.dailyMacroValue}>{formatNumber(dailyTotals.carbs)} g</Text>
                <Text style={styles.dailyMacroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.dailyMacroItem}>
                <Text style={styles.dailyMacroValue}>{formatNumber(dailyTotals.fat)} g</Text>
                <Text style={styles.dailyMacroLabel}>Fat</Text>
              </View>
            </View>
            <Text style={styles.itemCountText}>
              {dailyTotals.itemCount} {dailyTotals.itemCount === 1 ? 'food item' : 'food items'} logged
            </Text>
          </View>

          {/* Water intake (read-only on this history screen) */}
          <View style={styles.waterCard}>
            <View style={styles.waterHeader}>
              <View style={styles.waterHeadingLeft}>
                <View style={styles.waterIconBox}>
                  <Ionicons name="water-outline" size={22} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.waterTitle}>Water Intake</Text>
                  <Text style={styles.waterSubtitle}>Daily hydration</Text>
                </View>
              </View>
              <Text style={styles.waterGoalText}>{waterGlasses}/{waterTarget} glasses</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.waterProgressFill, { width: `${waterProgress * 100}%` }]} />
            </View>
            <Text style={styles.remainingText}>
              {waterGlasses >= waterTarget
                ? 'Daily water goal reached!'
                : `${waterTarget - waterGlasses} more glass${waterTarget - waterGlasses === 1 ? '' : 'es'} to go`}
            </Text>

            <View style={styles.waterCupsRow}>
              {Array.from({ length: waterTarget }).map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < waterGlasses ? 'water' : 'water-outline'}
                  size={22}
                  color={i < waterGlasses ? Colors.primary : Colors.border}
                  style={styles.waterCupIcon}
                />
              ))}
            </View>
          </View>

          {/* Meal sections */}
          <View style={styles.mealsHeadingRow}>
            <Text style={styles.mealsHeading}>Your Meals</Text>
            <Text style={styles.mealsCount}>
              {sections.reduce((c, s) => c + s.items.length, 0)} items
            </Text>
          </View>

          {sections.map((section) => {
            const totals = calculateTotals(section.items);
            return (
              <View key={section.type} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealTitleContainer}>
                    <View style={styles.mealIconBox}>
                      <Text style={styles.mealIcon}>{section.icon}</Text>
                    </View>
                    <View>
                      <Text style={styles.mealTitle}>{section.label}</Text>
                      <Text style={styles.mealItemCount}>
                        {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.mealCalories}>{Math.round(totals.calories)} kcal</Text>
                </View>

                {section.items.length > 0 && (
                  <View style={styles.mealMacroBox}>
                    <Text style={styles.mealMacroText}>P: {formatNumber(totals.protein)} g</Text>
                    <Text style={styles.mealMacroDot}>·</Text>
                    <Text style={styles.mealMacroText}>C: {formatNumber(totals.carbs)} g</Text>
                    <Text style={styles.mealMacroDot}>·</Text>
                    <Text style={styles.mealMacroText}>F: {formatNumber(totals.fat)} g</Text>
                  </View>
                )}

                <View style={styles.mealDivider} />

                {section.items.length === 0 ? (
                  <Text style={styles.emptyMealText}>No food logged</Text>
                ) : (
                  section.items.map((item, index) => (
                    <View
                      key={`${section.type}-${item.id}-${index}`}
                      style={[styles.foodItem, index !== section.items.length - 1 && styles.foodItemBorder]}
                    >
                      <View style={styles.foodItemMain}>
                        <Text style={styles.foodName} numberOfLines={2}>{item.name}</Text>
                        <Text style={styles.foodQuantity}>{item.quantity || 'Quantity not provided'}</Text>
                        <View style={styles.foodMacroRow}>
                          <Text style={styles.foodMacroText}>P {formatNumber(toNumber(item.protein))} g</Text>
                          <Text style={styles.foodMacroSeparator}>·</Text>
                          <Text style={styles.foodMacroText}>C {formatNumber(toNumber(item.carbs))} g</Text>
                          <Text style={styles.foodMacroSeparator}>·</Text>
                          <Text style={styles.foodMacroText}>F {formatNumber(toNumber(item.fat))} g</Text>
                        </View>
                      </View>
                      <View style={styles.foodCaloriesBox}>
                        <Text style={styles.foodCalories}>{Math.round(toNumber(item.calories))}</Text>
                        <Text style={styles.foodCaloriesUnit}>kcal</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            );
          })}

          {sections.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🍽️</Text>
              <Text style={styles.emptyStateTitle}>No meals found</Text>
              <Text style={styles.emptyStateDescription}>
                Nothing was logged on this date.
              </Text>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryMuted,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary, textAlign: 'center' },
  headerSubtitle: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },

  dateNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  dateArrowBtn: {
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
    borderRadius: BorderRadius.md, backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border,
  },
  dateArrowBtnDisabled: { opacity: 0.4 },
  dateArrow: { fontSize: 22, color: Colors.primary, fontWeight: '700' },
  dateArrowDisabled: { color: Colors.border },
  dateCenter: { flex: 1, alignItems: 'center' },
  dateLabel: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  dateSubLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  summaryCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  summaryTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark, marginBottom: Spacing.md },
  calorieRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  calorieMain: { flex: 1 },
  calorieValue: { fontSize: 30, fontWeight: '800', color: Colors.textDark },
  calorieGoalBox: { alignItems: 'flex-end' },
  calorieGoalValue: { fontSize: 21, fontWeight: '700', color: Colors.textDark },
  calorieLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  progressTrack: { height: 8, borderRadius: 8, backgroundColor: Colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8, backgroundColor: Colors.primary },
  remainingText: { marginTop: 8, fontSize: 12, color: Colors.textMuted },
  sectionDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  macroSectionTitle: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textDark, marginBottom: Spacing.sm },
  dailyMacroRow: { flexDirection: 'row', alignItems: 'center' },
  dailyMacroItem: { flex: 1, alignItems: 'center' },
  dailyMacroValue: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  dailyMacroLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  macroDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  itemCountText: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },

  waterCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  waterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  waterHeadingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  waterIconBox: {
    width: 40, height: 40, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  waterTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  waterSubtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  waterGoalText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  waterProgressFill: { height: '100%', borderRadius: 8, backgroundColor: Colors.primary },
  waterCupsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  waterCupIcon: { marginRight: 2 },

  mealsHeadingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm,
  },
  mealsHeading: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark },
  mealsCount: { fontSize: 12, color: Colors.textMuted },

  mealCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  mealIconBox: {
    width: 38, height: 38, borderRadius: BorderRadius.md, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  mealIcon: { fontSize: 18 },
  mealTitle: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textDark },
  mealItemCount: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  mealCalories: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.primary },
  mealMacroBox: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: Spacing.sm,
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: BorderRadius.md, backgroundColor: Colors.background,
  },
  mealMacroText: { fontSize: 11, fontWeight: '600', color: Colors.textDark },
  mealMacroDot: { marginHorizontal: 6, color: Colors.textMuted },
  mealDivider: { height: 1, backgroundColor: Colors.border, marginTop: Spacing.sm },

  foodItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10,
  },
  foodItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  foodItemMain: { flex: 1, paddingRight: 10 },
  foodName: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textDark },
  foodQuantity: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  foodMacroRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 5 },
  foodMacroText: { fontSize: 11, color: Colors.textMuted },
  foodMacroSeparator: { marginHorizontal: 5, fontSize: 11, color: Colors.textMuted },
  foodCaloriesBox: { minWidth: 48, alignItems: 'flex-end' },
  foodCalories: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textDark },
  foodCaloriesUnit: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  emptyMealText: { fontSize: Fonts.sizes.sm, color: Colors.textPlaceholder, textAlign: 'center', paddingVertical: 10 },

  emptyState: {
    alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border,
  },
  emptyStateIcon: { fontSize: 40, marginBottom: Spacing.sm },
  emptyStateTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  emptyStateDescription: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
});