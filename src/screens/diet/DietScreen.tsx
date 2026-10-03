import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import api from '@/src/services/api';

// This reuses the existing `meals` app mount (api/meals/), confirmed from
// your Django debug page's URL list — not a separate "diet" prefix.
const DIET_BASE = '/meals/';

// ─── Types — match DietView / MealEntrySerializer / FoodItemSerializer ────────

interface FoodItem {
  id: number; name: string; calories: number;
  protein: number; carbs: number; fat: number; quantity: string;
}
interface MealItem {
  id: number; name: string; calories: number;
  protein: number; carbs: number; fat: number; quantity: string;
}
interface Meal {
  type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  time: string;
  items: MealItem[];
  target_calories: number;
  completed: boolean;
}
interface DietData {
  date: string; calories_target: number; calories_consumed: number;
  macros: {
    protein: { target: number; consumed: number };
    carbs:   { target: number; consumed: number };
    fat:     { target: number; consumed: number };
  };
  meals: Meal[]; water_glasses: number; water_target: number; ai_tip: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getMealCalories  = (meal: Meal) => meal.items.reduce((s, i) => s + i.calories, 0);
const clamp = (v: number, mn: number, mx: number) => Math.min(Math.max(v, mn), mx);

// Scales a base quantity string like "1 piece" or "100g" by a count, e.g.
// ("1 piece", 2) -> "2 piece", ("100g", 2) -> "200 g". Fractions ("1/2 cup")
// fall back to a simple "<count> × <base>" label rather than guessing math.
const scaledQuantityLabel = (baseQuantity: string, count: number): string => {
  if (baseQuantity.includes('/')) return `${count} × ${baseQuantity}`;
  const match = baseQuantity.match(/^([\d.]+)\s*(.*)$/);
  if (!match) return `${count} × ${baseQuantity}`;
  const baseNum = parseFloat(match[1]);
  const unit = match[2];
  const total = parseFloat((baseNum * count).toFixed(2));
  return unit ? `${total} ${unit}` : `${total}`;
};

// ─── Macro Bar ────────────────────────────────────────────────────────────────

const MacroBar = ({ label, consumed, target, color }: { label: string; consumed: number; target: number; color: string }) => {
  const pct = clamp((consumed / (target || 1)) * 100, 0, 100);
  return (
    <View style={styles.macroItem}>
      <View style={styles.macroTopRow}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{consumed}<Text style={styles.macroTarget}>/{target}g</Text></Text>
      </View>
      <View style={styles.macroTrack}>
        <View style={[styles.macroFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

// ─── Quick Add Modal ──────────────────────────────────────────────────────────

const QuickAddModal = ({ visible, meals, initialMealType, onClose, onAdd, isSaving }: {
  visible: boolean; meals: Meal[]; initialMealType: Meal['type'] | null; onClose: () => void;
  onAdd: (mealType: Meal['type'], food: FoodItem, count: number) => void;
  isSaving: boolean;
}) => {
  const [query, setQuery]               = useState('');
  const [selectedMeal, setSelectedMeal] = useState<Meal['type'] | null>(null);
  const [results, setResults]           = useState<FoodItem[]>([]);
  const [searching, setSearching]       = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [count, setCount]               = useState(1);

  // Debounced live search against the backend food reference DB.
  useEffect(() => {
    if (!visible) return;
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get<FoodItem[]>(`${DIET_BASE}foods/`, { params: { q: query } });
        setResults(data);
      } catch (error: any) {
        console.log('❌ Food search error:', error?.response?.status);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, visible]);

  // When the modal opens, pre-select whichever meal's "Add Food" button
  // was tapped — tapping a meal card's own Add Food no longer requires
  // re-selecting that same meal at the top of the sheet.
  useEffect(() => {
    if (visible) {
      setSelectedMeal(initialMealType);
      setQuery('');
      setSelectedFood(null);
      setCount(1);
    }
  }, [visible, initialMealType]);

  // Tapping a food opens the quantity-confirm step instead of adding
  // immediately — lets you pick "2 Roti" instead of always exactly 1.
  const handlePickFood = (food: FoodItem) => {
    if (!selectedMeal) { Alert.alert('Select Meal', 'Please select which meal to add this to.'); return; }
    setSelectedFood(food);
    setCount(1);
  };

  const handleConfirmAdd = () => {
    if (!selectedMeal || !selectedFood) return;
    onAdd(selectedMeal, selectedFood, count);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <View style={m.titleRow}>
            <Text style={m.title}>{selectedFood ? selectedFood.name : 'Quick Add Food'}</Text>
            <TouchableOpacity onPress={selectedFood ? () => setSelectedFood(null) : onClose}>
              <Ionicons name={selectedFood ? 'arrow-back-outline' : 'close-outline'} size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={m.mealScroll}>
            {meals.map(meal => (
              <TouchableOpacity
                key={meal.type}
                style={[m.mealChip, selectedMeal === meal.type && m.mealChipActive]}
                onPress={() => setSelectedMeal(meal.type)} activeOpacity={0.7}
              >
                <Ionicons name={meal.icon} size={16} color={selectedMeal === meal.type ? Colors.primary : Colors.textMuted} />
                <Text style={[m.mealChipText, selectedMeal === meal.type && m.mealChipTextActive]}>{meal.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedFood ? (
            // ── Quantity confirm step ──
            <>
              <View style={m.quantityCard}>
                <Text style={m.quantityBaseLabel}>Base serving: {selectedFood.quantity}</Text>

                <View style={m.stepperRow}>
                  <TouchableOpacity
                    style={[m.stepperBtn, count <= 1 && m.stepperBtnDisabled]}
                    onPress={() => setCount(c => Math.max(1, c - 1))}
                    disabled={count <= 1}
                  >
                    <Ionicons name="remove" size={20} color={count <= 1 ? Colors.textMuted : Colors.primary} />
                  </TouchableOpacity>
                  <Text style={m.stepperCount}>{count}</Text>
                  <TouchableOpacity
                    style={m.stepperBtn}
                    onPress={() => setCount(c => Math.min(20, c + 1))}
                  >
                    <Ionicons name="add" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                <Text style={m.quantityResultLabel}>
                  {scaledQuantityLabel(selectedFood.quantity, count)}
                </Text>

                <View style={m.quantityMacrosRow}>
                  <View style={m.quantityMacroItem}>
                    <Text style={m.quantityMacroVal}>{Math.round(selectedFood.calories * count)}</Text>
                    <Text style={m.quantityMacroLabel}>kcal</Text>
                  </View>
                  <View style={m.quantityMacroItem}>
                    <Text style={m.quantityMacroVal}>{Math.round(selectedFood.protein * count)}g</Text>
                    <Text style={m.quantityMacroLabel}>protein</Text>
                  </View>
                  <View style={m.quantityMacroItem}>
                    <Text style={m.quantityMacroVal}>{Math.round(selectedFood.carbs * count)}g</Text>
                    <Text style={m.quantityMacroLabel}>carbs</Text>
                  </View>
                  <View style={m.quantityMacroItem}>
                    <Text style={m.quantityMacroVal}>{Math.round(selectedFood.fat * count)}g</Text>
                    <Text style={m.quantityMacroLabel}>fat</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={m.closeBtn} onPress={handleConfirmAdd} activeOpacity={0.85} disabled={isSaving}>
                {isSaving
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Text style={m.closeBtnText}>Add to {meals.find(x => x.type === selectedMeal)?.label}</Text>}
              </TouchableOpacity>
            </>
          ) : (
            // ── Search step ──
            <>
              <View style={m.searchRow}>
                <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
                <TextInput
                  style={m.searchInput} value={query} onChangeText={setQuery}
                  placeholder="Search food..." placeholderTextColor={Colors.textMuted} autoFocus
                />
                {searching && <ActivityIndicator size="small" color={Colors.primary} />}
                {!searching && query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <Ionicons name="close-circle-outline" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView style={m.resultsList} showsVerticalScrollIndicator={false}>
                {results.length === 0 && !searching && (
                  <Text style={m.noResults}>No foods found — try a different search.</Text>
                )}
                {results.map(food => (
                  <TouchableOpacity key={food.id} style={m.foodRow} onPress={() => handlePickFood(food)} activeOpacity={0.7}>
                    <View style={m.foodIconBox}>
                      <Ionicons name="restaurant-outline" size={16} color={Colors.primary} />
                    </View>
                    <View style={m.foodInfo}>
                      <Text style={m.foodName}>{food.name}</Text>
                      <Text style={m.foodMeta}>{food.quantity} · P:{food.protein}g · C:{food.carbs}g · F:{food.fat}g</Text>
                    </View>
                    <View style={m.foodCalBadge}>
                      <Text style={m.foodCal}>{food.calories}</Text>
                      <Text style={m.foodCalUnit}>kcal</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity style={m.cancelCloseBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={m.cancelCloseBtnText}>Done</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DietScreen() {
  const [data, setData]                 = useState<DietData | null>(null);
  const [isLoading, setIsLoading]       = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalMealType, setAddModalMealType] = useState<Meal['type'] | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<Meal['type'] | null>('breakfast');
  const [isSaving, setIsSaving]         = useState(false);

  const todayIso = new Date().toISOString().split('T')[0];
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const fetchDiet = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get<DietData>(DIET_BASE, { params: { date: todayIso } });
      console.log('📥 Diet response:', JSON.stringify(data, null, 2));
      setData(data);
    } catch (error: any) {
      console.log('❌ Diet fetch error:', error?.response?.status, JSON.stringify(error?.response?.data));
      Alert.alert('Error', "Failed to load today's diet data.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [todayIso]);

  useFocusEffect(
    useCallback(() => {
      fetchDiet();
    }, [fetchDiet])
  );

  // Opens Quick Add already scoped to a specific meal — used by each meal
  // card's own "Add Food" button so you don't have to re-pick the meal
  // chip at the top of the sheet after already being inside that card.
  const openAddModal = (mealType: Meal['type'] | null) => {
    setAddModalMealType(mealType);
    setShowAddModal(true);
  };

  if (isLoading || !data) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const totalConsumed = data.calories_consumed;
  const remaining     = data.calories_target - totalConsumed;

  const toggleWater = async (index: number) => {
    const newVal = index < data.water_glasses ? index : index + 1;
    const previous = data.water_glasses;
    setData(prev => prev ? { ...prev, water_glasses: newVal } : prev); // optimistic
    try {
      await api.post(`${DIET_BASE}water/`, { glasses: newVal, date: todayIso });
    } catch (error: any) {
      console.log('❌ Water log error:', error?.response?.status);
      setData(prev => prev ? { ...prev, water_glasses: previous } : prev); // revert
    }
  };

  const handleAddFood = async (mealType: Meal['type'], food: FoodItem, count: number) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Scale the macros by count ourselves and send them explicitly —
      // MealItemView only fills in defaults from food_item for fields NOT
      // already present in the payload, so passing these directly makes it
      // log "2 Roti" worth of calories/macros instead of always 1 serving.
      const payload = {
        meal_type: mealType,
        food_item: food.id,
        date: todayIso,
        name: food.name,
        calories: Math.round(food.calories * count),
        protein: Math.round(food.protein * count),
        carbs: Math.round(food.carbs * count),
        fat: Math.round(food.fat * count),
        quantity: scaledQuantityLabel(food.quantity, count),
      };
      console.log('📤 Adding food:', payload);
      await api.post(`${DIET_BASE}items/`, payload);
      setShowAddModal(false);
      await fetchDiet();
    } catch (error: any) {
      console.log('❌ Add food error:', error?.response?.status, JSON.stringify(error?.response?.data));
      Alert.alert('Error', 'Failed to add food item.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFood = (itemId: number) => {
    Alert.alert('Remove Item', 'Remove this food item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`${DIET_BASE}items/${itemId}/`);
            await fetchDiet();
          } catch (error: any) {
            console.log('❌ Remove food error:', error?.response?.status);
            Alert.alert('Error', 'Failed to remove item.');
          }
        },
      },
    ]);
  };

  const toggleMealComplete = async (mealType: Meal['type']) => {
    const previous = data.meals;
    setData(prev => prev
      ? { ...prev, meals: prev.meals.map(m => m.type === mealType ? { ...m, completed: !m.completed } : m) }
      : prev); // optimistic
    try {
      await api.post(`${DIET_BASE}meals/${mealType}/complete/`, { date: todayIso });
    } catch (error: any) {
      console.log('❌ Toggle meal complete error:', error?.response?.status);
      setData(prev => prev ? { ...prev, meals: previous } : prev); // revert
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Diet Tracker</Text>
          <Text style={styles.headerDate}>{todayLabel}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => openAddModal(null)} activeOpacity={0.85}>
          <Ionicons name="add-outline" size={18} color={Colors.white} />
          <Text style={styles.addBtnText}>Add Food</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchDiet(true)} tintColor={Colors.primary} />
        }
      >

        <View style={styles.summaryCard}>
          <View style={styles.ringWrapper}>
            <View style={styles.ringOuter}>
              <View style={styles.ringInner}>
                <Text style={styles.ringValue}>{totalConsumed}</Text>
                <Text style={styles.ringUnit}>kcal eaten</Text>
              </View>
            </View>
            <View style={styles.ringStats}>
              <View style={styles.ringStat}>
                <View style={styles.ringStatIconRow}>
                  <Ionicons name="flag-outline" size={14} color={Colors.primary} />
                  <Text style={styles.ringStatVal}>{data.calories_target}</Text>
                </View>
                <Text style={styles.ringStatLabel}>Target</Text>
              </View>
              <View style={styles.ringStatDivider} />
              <View style={styles.ringStat}>
                <View style={styles.ringStatIconRow}>
                  <Ionicons
                    name={remaining >= 0 ? 'trending-down-outline' : 'trending-up-outline'}
                    size={14}
                    color={remaining >= 0 ? Colors.primary : '#E05C5C'}
                  />
                  <Text style={[styles.ringStatVal, { color: remaining >= 0 ? Colors.primary : '#E05C5C' }]}>
                    {Math.abs(remaining)}
                  </Text>
                </View>
                <Text style={styles.ringStatLabel}>{remaining >= 0 ? 'Remaining' : 'Over'}</Text>
              </View>
              <View style={styles.ringStatDivider} />
              <View style={styles.ringStat}>
                <View style={styles.ringStatIconRow}>
                  <Ionicons name="pie-chart-outline" size={14} color={Colors.primary} />
                  <Text style={styles.ringStatVal}>{Math.round(clamp((totalConsumed / (data.calories_target || 1)) * 100, 0, 100))}%</Text>
                </View>
                <Text style={styles.ringStatLabel}>Done</Text>
              </View>
            </View>
          </View>

          <View style={styles.macrosRow}>
            <MacroBar label="Protein" consumed={data.macros.protein.consumed} target={data.macros.protein.target} color="#4CAF50" />
            <MacroBar label="Carbs"   consumed={data.macros.carbs.consumed}   target={data.macros.carbs.target}   color="#2196F3" />
            <MacroBar label="Fat"     consumed={data.macros.fat.consumed}      target={data.macros.fat.target}     color="#FF9800" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Today's Meals</Text>
        <View style={styles.mealsGroup}>
          {data.meals.map(meal => {
            const mealCals  = getMealCalories(meal);
            const isExpanded = expandedMeal === meal.type;
            return (
              <View key={meal.type} style={[styles.mealCard, meal.completed && styles.mealCardDone]}>
                <TouchableOpacity style={styles.mealHeader} onPress={() => setExpandedMeal(isExpanded ? null : meal.type)} activeOpacity={0.7}>
                  <View style={styles.mealIconBox}>
                    <Ionicons name={meal.icon} size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.mealHeaderCenter}>
                    <Text style={styles.mealLabel}>{meal.label}</Text>
                    <View style={styles.mealTimeRow}>
                      <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.mealTime}>{meal.time}</Text>
                    </View>
                  </View>
                  <View style={styles.mealHeaderRight}>
                    <View style={styles.mealCalsRow}>
                      <Ionicons name="flame-outline" size={12} color={Colors.primary} />
                      <Text style={styles.mealCals}>{mealCals}<Text style={styles.mealCalsTarget}>/{meal.target_calories}</Text></Text>
                    </View>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.mealBody}>
                    {meal.items.length === 0 ? (
                      <View style={styles.emptyMealRow}>
                        <Ionicons name="add-circle-outline" size={16} color={Colors.textMuted} />
                        <Text style={styles.emptyMealText}>No items added yet</Text>
                      </View>
                    ) : (
                      meal.items.map(item => (
                        <TouchableOpacity key={item.id} style={styles.foodItem} onLongPress={() => handleRemoveFood(item.id)} activeOpacity={0.7}>
                          <View style={styles.foodItemIconBox}>
                            <Ionicons name="nutrition-outline" size={14} color={Colors.primary} />
                          </View>
                          <View style={styles.foodItemLeft}>
                            <Text style={styles.foodItemName}>{item.name}</Text>
                            <Text style={styles.foodItemMeta}>{item.quantity} · P:{item.protein}g C:{item.carbs}g F:{item.fat}g</Text>
                          </View>
                          <View style={styles.foodItemCalRow}>
                            <Ionicons name="flame-outline" size={12} color={Colors.primary} />
                            <Text style={styles.foodItemCal}>{item.calories}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                    <View style={styles.mealActions}>
                      <TouchableOpacity style={styles.mealAddBtn} onPress={() => openAddModal(meal.type)} activeOpacity={0.7}>
                        <Ionicons name="add-outline" size={16} color={Colors.primary} />
                        <Text style={styles.mealAddBtnText}>Add Food</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.mealDoneBtn, meal.completed && styles.mealDoneBtnActive]}
                        onPress={() => toggleMealComplete(meal.type)} activeOpacity={0.7}
                      >
                        <Ionicons name={meal.completed ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={meal.completed ? Colors.white : Colors.textMuted} />
                        <Text style={[styles.mealDoneBtnText, meal.completed && styles.mealDoneBtnTextActive]}>
                          {meal.completed ? 'Done' : 'Mark Done'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Water Intake</Text>
        <View style={styles.waterCard}>
          <View style={styles.waterTopRow}>
            <View>
              <View style={styles.waterTitleRow}>
                <Ionicons name="water-outline" size={22} color={Colors.primary} />
                <Text style={styles.waterTitle}>
                  {data.water_glasses}
                  <Text style={styles.waterTarget}>/{data.water_target} glasses</Text>
                </Text>
              </View>
              <Text style={styles.waterSub}>
                {data.water_glasses >= data.water_target
                  ? 'Daily goal reached!'
                  : `${data.water_target - data.water_glasses} more to go`}
              </Text>
            </View>
            <View style={styles.waterBadge}>
              <Text style={styles.waterPct}>
                {Math.round((data.water_glasses / data.water_target) * 100)}%
              </Text>
            </View>
          </View>
          <View style={styles.waterCupsRow}>
            {Array.from({ length: data.water_target }).map((_, i) => (
              <TouchableOpacity key={i} onPress={() => toggleWater(i)} activeOpacity={0.7} style={styles.waterCup}>
                <Ionicons
                  name={i < data.water_glasses ? 'water' : 'water-outline'}
                  size={28}
                  color={i < data.water_glasses ? Colors.primary : Colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>AI Coach Tip</Text>
        <View style={styles.aiTipCard}>
          <View style={styles.aiTipAvatar}>
            <Ionicons name="sparkles-outline" size={18} color={Colors.white} />
          </View>
          <Text style={styles.aiTipText}>{data.ai_tip}</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <QuickAddModal
        visible={showAddModal}
        meals={data.meals}
        initialMealType={addModalMealType}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddFood}
        isSaving={isSaving}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.primaryMuted },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  headerDate:  { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  addBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addBtnText: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.white },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  sectionTitle:  { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark, marginBottom: Spacing.sm, marginTop: Spacing.md },

  summaryCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },

  ringWrapper:  { alignItems: 'center', gap: Spacing.md },
  ringOuter:    { width: 140, height: 140, borderRadius: 70, borderWidth: 12, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primaryMuted },
  ringInner:    { alignItems: 'center' },
  ringValue:    { fontSize: 28, fontWeight: '800', color: Colors.primary },
  ringUnit:     { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  ringStats:    { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  ringStat:     { alignItems: 'center', gap: 2 },
  ringStatIconRow:{ flexDirection: 'row', alignItems: 'center', gap: 3 },
  ringStatVal:  { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  ringStatLabel:{ fontSize: 11, color: Colors.textMuted },
  ringStatDivider:{ width: 1, height: 32, backgroundColor: Colors.border },

  macrosRow: { gap: Spacing.sm },
  macroItem: { gap: 4 },
  macroTopRow:{ flexDirection: 'row', justifyContent: 'space-between' },
  macroLabel: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '600' },
  macroValue: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textDark },
  macroTarget:{ fontWeight: '400', color: Colors.textMuted },
  macroTrack: { height: 8, backgroundColor: Colors.background, borderRadius: 4, overflow: 'hidden' },
  macroFill:  { height: '100%', borderRadius: 4 },

  mealsGroup: { gap: 10 },
  mealCard:     { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  mealCardDone: { borderColor: Colors.primary, opacity: 0.85 },
  mealHeader:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
  mealIconBox:  { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  mealHeaderCenter: { flex: 1 },
  mealLabel:    { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  mealTimeRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  mealTime:     { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  mealHeaderRight: { alignItems: 'flex-end', gap: 4 },
  mealCalsRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  mealCals:     { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.primary },
  mealCalsTarget:{ fontWeight: '400', color: Colors.textMuted },

  mealBody:     { borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 6, backgroundColor: Colors.background },
  emptyMealRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: Spacing.sm },
  emptyMealText:{ fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontStyle: 'italic' },

  foodItem:       { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
  foodItemIconBox:{ width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  foodItemLeft:   { flex: 1 },
  foodItemName:   { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textDark },
  foodItemMeta:   { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  foodItemCalRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  foodItemCal:    { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.primary },

  mealActions: { flexDirection: 'row', gap: 8, paddingTop: Spacing.sm },
  mealAddBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.full, height: 38 },
  mealAddBtnText:{ fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
  mealDoneBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, height: 38 },
  mealDoneBtnActive:    { backgroundColor: Colors.primary, borderColor: Colors.primary },
  mealDoneBtnText:      { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '600' },
  mealDoneBtnTextActive:{ color: Colors.white },

  waterCard:    { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  waterTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waterTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  waterTitle:   { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.primary },
  waterTarget:  { fontSize: Fonts.sizes.md, fontWeight: '400', color: Colors.textMuted },
  waterSub:     { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 4 },
  waterBadge:   { backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  waterPct:     { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.primary },
  waterCupsRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  waterCup:     { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  aiTipCard:   { flexDirection: 'row', backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.primary, alignItems: 'flex-start' },
  aiTipAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  aiTipText:   { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.textDark, lineHeight: 20 },
});

const chartUnused = null; // (placeholder removed from earlier draft, kept file structure stable)

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg + 16, paddingTop: Spacing.sm, maxHeight: '85%' },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md },
  titleRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title:   { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark },
  mealScroll: { marginBottom: Spacing.md },
  mealChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.background },
  mealChipActive:    { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  mealChipText:      { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted },
  mealChipTextActive:{ color: Colors.primary },
  searchRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, borderWidth: 1.5, borderColor: Colors.border, gap: Spacing.sm, marginBottom: Spacing.md },
  searchInput:{ flex: 1, height: 44, fontSize: Fonts.sizes.md, color: Colors.textDark },
  resultsList:{ maxHeight: 320 },
  noResults:  { fontSize: Fonts.sizes.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.md },
  foodRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.sm },
  foodIconBox:{ width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  foodInfo:   { flex: 1 },
  foodName:   { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textDark },
  foodMeta:   { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  foodCalBadge:{ alignItems: 'center' },
  foodCal:    { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.primary },
  foodCalUnit:{ fontSize: 10, color: Colors.textMuted },
  closeBtn:   { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md },
  closeBtnText:{ fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },

  cancelCloseBtn:    { borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.md },
  cancelCloseBtnText:{ fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textMuted },

  quantityCard:       { backgroundColor: Colors.background, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', gap: Spacing.md },
  quantityBaseLabel:  { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  stepperRow:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  stepperBtn:         { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white },
  stepperBtnDisabled: { borderColor: Colors.border },
  stepperCount:       { fontSize: 28, fontWeight: '800', color: Colors.textDark, minWidth: 40, textAlign: 'center' },
  quantityResultLabel:{ fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.primary },
  quantityMacrosRow:  { flexDirection: 'row', width: '100%', justifyContent: 'space-around', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  quantityMacroItem:  { alignItems: 'center', gap: 2 },
  quantityMacroVal:   { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  quantityMacroLabel: { fontSize: 11, color: Colors.textMuted },
});