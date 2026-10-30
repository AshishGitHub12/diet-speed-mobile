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

// ─── Shared design system (matches Home & Weight Tracker) ──────────────────────

const Accent = { gold: '#B9892E', plum: '#6E5A8C', teal: '#3E7CA6', berry: '#8B3A42' };
const Tint   = { mint: '#E1EEDD', peach: '#F5E6D3', lilac: '#E7E2F0', sky: '#DCEAF2' };
const LIME   = '#B9F24C';

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

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
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
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

// Each meal type gets a fixed icon + accent color, so "breakfast" always reads
// the same way across the app instead of a generic bullet per row.
const SECTION_STYLE: Record<MealType, { icon: keyof typeof Ionicons.glyphMap; accent: string }> = {
  breakfast: { icon: 'sunny',          accent: Colors.primary },
  lunch:     { icon: 'partly-sunny',   accent: Accent.gold },
  snack:     { icon: 'nutrition',      accent: Accent.plum },
  dinner:    { icon: 'moon',           accent: Accent.teal },
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
        .map((m) => ({
          type: m.type, label: m.label,
          icon: SECTION_STYLE[m.type]?.icon ?? 'restaurant',
          accent: SECTION_STYLE[m.type]?.accent ?? Colors.primary,
          items: m.items ?? [],
        }))
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
          <Ionicons name="chevron-back" size={22} color={Colors.textDark} />
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
          <Ionicons name="chevron-back" size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateCenter} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
          <Text style={styles.dateLabel}>{formatLabel(selectedDate, todayIso)}</Text>
          <View style={styles.dateSubRow}>
            <Ionicons name="calendar-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.dateSubLabel}>
              {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateArrowBtn, isToday && styles.dateArrowBtnDisabled]}
          onPress={goToNextDay}
          disabled={isToday}
        >
          <Ionicons name="chevron-forward" size={18} color={isToday ? Colors.textPlaceholder : Colors.primary} />
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
          {/* Calories + Total Day Macros — same dark hero card as Home/Weight Tracker */}
          <View style={[styles.summaryCard, leafRadius(BorderRadius.xl)]}>
            <View style={styles.summaryBlob} pointerEvents="none" />
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

            <View style={styles.dailyMacroRow}>
              <View style={styles.dailyMacroItem}>
                <View style={[styles.macroDot, { backgroundColor: LIME }]} />
                <Text style={styles.dailyMacroValue}>{formatNumber(dailyTotals.protein)} g</Text>
                <Text style={styles.dailyMacroLabel}>Protein</Text>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.dailyMacroItem}>
                <View style={[styles.macroDot, { backgroundColor: '#FFC56B' }]} />
                <Text style={styles.dailyMacroValue}>{formatNumber(dailyTotals.carbs)} g</Text>
                <Text style={styles.dailyMacroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.dailyMacroItem}>
                <View style={[styles.macroDot, { backgroundColor: '#8FD6FF' }]} />
                <Text style={styles.dailyMacroValue}>{formatNumber(dailyTotals.fat)} g</Text>
                <Text style={styles.dailyMacroLabel}>Fat</Text>
              </View>
            </View>
            <Text style={styles.itemCountText}>
              {dailyTotals.itemCount} {dailyTotals.itemCount === 1 ? 'food item' : 'food items'} logged
            </Text>
          </View>

          {/* Water intake (read-only on this history screen) */}
          <View style={[styles.waterCard, leafRadius(BorderRadius.lg)]}>
            <View style={styles.waterHeader}>
              <View style={styles.waterHeadingLeft}>
                <View style={styles.waterIconBox}>
                  <Ionicons name="water" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.waterTitle}>Water Intake</Text>
                  <Text style={styles.waterSubtitle}>Daily hydration</Text>
                </View>
              </View>
              <Text style={styles.waterGoalText}>{waterGlasses}/{waterTarget} glasses</Text>
            </View>

            <View style={styles.progressTrackLight}>
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
                  size={20}
                  color={i < waterGlasses ? Accent.teal : Colors.textMuted}
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
              <View key={section.type} style={[styles.mealCard, leafRadius(BorderRadius.lg)]}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealTitleContainer}>
                    <View style={[styles.mealIconBox, { backgroundColor: section.accent }]}>
                      <Ionicons name={section.icon} size={17} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.mealTitle}>{section.label}</Text>
                      <Text style={styles.mealItemCount}>
                        {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.mealCalories, { color: section.accent }]}>{Math.round(totals.calories)} kcal</Text>
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
            <View style={[styles.emptyState, leafRadius(BorderRadius.lg)]}>
              <View style={styles.emptyStateIconBox}>
                <Ionicons name="restaurant-outline" size={28} color={Colors.primary} />
              </View>
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
    backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.textDark, textAlign: 'center', letterSpacing: -0.2 },
  headerSubtitle: { fontSize: 11.5, color: Colors.textMuted, textAlign: 'center', marginTop: 2, fontWeight: '600' },

  dateNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  dateArrowBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderRadius: 18, backgroundColor: Colors.primaryMuted,
  },
  dateArrowBtnDisabled: { opacity: 0.4, backgroundColor: Colors.background },
  dateCenter: { flex: 1, alignItems: 'center' },
  dateLabel: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.textDark },
  dateSubRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dateSubLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },

  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  // Daily nutrition hero — dark card, same family as Home/Weight Tracker
  summaryCard: {
    backgroundColor: Colors.textDark, padding: Spacing.md, marginBottom: Spacing.md, overflow: 'hidden',
    shadowColor: Colors.textDark, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  summaryBlob: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -50 },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: Spacing.md },
  calorieRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.sm },
  calorieMain: { flex: 1 },
  calorieValue: { fontSize: 32, fontWeight: '900', color: '#fff' },
  calorieGoalBox: { alignItems: 'flex-end' },
  calorieGoalValue: { fontSize: 21, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  calorieLabel: { fontSize: 11.5, color: 'rgba(255,255,255,0.6)', marginTop: 3, fontWeight: '600' },
  progressTrack: { height: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  progressTrackLight: { height: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.5)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8, backgroundColor: LIME },
  remainingText: { marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },

  dailyMacroRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  dailyMacroItem: { flex: 1, alignItems: 'center', gap: 2 },
  macroDot: { width: 7, height: 7, borderRadius: 3.5, marginBottom: 2 },
  dailyMacroValue: { fontSize: Fonts.sizes.md, fontWeight: '800', color: '#fff' },
  dailyMacroLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  macroDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },
  itemCountText: { fontSize: 11.5, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: Spacing.sm },

  waterCard: {
    backgroundColor: Tint.sky, padding: Spacing.md,
    marginBottom: Spacing.md, gap: Spacing.sm,
  },
  waterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  waterHeadingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  waterIconBox: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: Accent.teal,
    alignItems: 'center', justifyContent: 'center',
  },
  waterTitle: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.textDark },
  waterSubtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
  waterGoalText: { fontSize: 13, fontWeight: '800', color: Accent.teal },
  waterProgressFill: { height: '100%', borderRadius: 8, backgroundColor: Accent.teal },
  waterCupsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  waterCupIcon: { marginRight: 2 },

  mealsHeadingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm,
  },
  mealsHeading: { fontSize: 16, fontWeight: '800', color: Colors.textDark, letterSpacing: -0.2 },
  mealsCount: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },

  mealCard: {
    backgroundColor: Colors.white, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  mealIconBox: {
    width: 38, height: 38, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  mealTitle: { fontSize: Fonts.sizes.sm, fontWeight: '800', color: Colors.textDark },
  mealItemCount: { fontSize: 11, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
  mealCalories: { fontSize: Fonts.sizes.sm, fontWeight: '800' },
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
  foodName: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textDark },
  foodQuantity: { fontSize: 11, color: Colors.textMuted, marginTop: 3, fontWeight: '600' },
  foodMacroRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 5 },
  foodMacroText: { fontSize: 11, color: Colors.textMuted },
  foodMacroSeparator: { marginHorizontal: 5, fontSize: 11, color: Colors.textMuted },
  foodCaloriesBox: { minWidth: 48, alignItems: 'flex-end' },
  foodCalories: { fontSize: Fonts.sizes.sm, fontWeight: '800', color: Colors.textDark },
  foodCaloriesUnit: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  emptyMealText: { fontSize: Fonts.sizes.sm, color: Colors.textPlaceholder, textAlign: 'center', paddingVertical: 10 },

  emptyState: {
    alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
  },
  emptyStateIconBox: { width: 56, height: 56, borderRadius: 20, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  emptyStateTitle: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.textDark },
  emptyStateDescription: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
});