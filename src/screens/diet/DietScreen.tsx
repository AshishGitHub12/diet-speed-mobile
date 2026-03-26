import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FoodItem {
  id: number; name: string; calories: number;
  protein: number; carbs: number; fat: number; quantity: string;
}
interface Meal {
  id: number; type: 'breakfast'|'lunch'|'dinner'|'snack';
  label: string; icon: keyof typeof Ionicons.glyphMap;
  time: string; items: FoodItem[]; target_calories: number; completed: boolean;
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

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_DATA: DietData = {
  date: new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }),
  calories_target: 1800, calories_consumed: 1120,
  macros: {
    protein: { target: 120, consumed: 78 },
    carbs:   { target: 200, consumed: 134 },
    fat:     { target: 60,  consumed: 32 },
  },
  meals: [
    { id: 1, type: 'breakfast', label: 'Breakfast', icon: 'sunny-outline',        time: '08:00 AM', target_calories: 450, completed: true,
      items: [
        { id: 1, name: 'Oats with milk', calories: 280, protein: 12, carbs: 48, fat: 6,  quantity: '1 bowl' },
        { id: 2, name: 'Banana',         calories: 90,  protein: 1,  carbs: 23, fat: 0,  quantity: '1 medium' },
        { id: 3, name: 'Boiled egg',     calories: 78,  protein: 6,  carbs: 1,  fat: 5,  quantity: '1 piece' },
      ] },
    { id: 2, type: 'lunch',     label: 'Lunch',     icon: 'partly-sunny-outline', time: '01:00 PM', target_calories: 600, completed: false,
      items: [
        { id: 4, name: 'Brown rice',     calories: 210, protein: 5,  carbs: 44, fat: 2,  quantity: '1 cup' },
        { id: 5, name: 'Chicken curry',  calories: 320, protein: 28, carbs: 8,  fat: 18, quantity: '150g' },
      ] },
    { id: 3, type: 'snack',   label: 'Snack',   icon: 'cafe-outline',  time: '04:00 PM', target_calories: 200, completed: false, items: [] },
    { id: 4, type: 'dinner',  label: 'Dinner',  icon: 'moon-outline',  time: '08:00 PM', target_calories: 550, completed: false, items: [] },
  ],
  water_glasses: 5, water_target: 8,
  ai_tip: "You're 58g short on protein today. Try adding a handful of nuts or a boiled egg as your evening snack to hit your target!",
};

const FOOD_DB: FoodItem[] = [
  { id: 101, name: 'Apple',          calories: 95,  protein: 0,  carbs: 25, fat: 0,  quantity: '1 medium' },
  { id: 102, name: 'Banana',         calories: 90,  protein: 1,  carbs: 23, fat: 0,  quantity: '1 medium' },
  { id: 103, name: 'Boiled egg',     calories: 78,  protein: 6,  carbs: 1,  fat: 5,  quantity: '1 piece' },
  { id: 104, name: 'Brown rice',     calories: 210, protein: 5,  carbs: 44, fat: 2,  quantity: '1 cup' },
  { id: 105, name: 'Chicken breast', calories: 165, protein: 31, carbs: 0,  fat: 4,  quantity: '100g' },
  { id: 106, name: 'Greek yogurt',   calories: 100, protein: 17, carbs: 6,  fat: 1,  quantity: '1 cup' },
  { id: 107, name: 'Oats',           calories: 150, protein: 5,  carbs: 27, fat: 3,  quantity: '1/2 cup' },
  { id: 108, name: 'Paneer',         calories: 265, protein: 18, carbs: 3,  fat: 20, quantity: '100g' },
  { id: 109, name: 'Roti',           calories: 104, protein: 3,  carbs: 18, fat: 3,  quantity: '1 piece' },
  { id: 110, name: 'Salmon',         calories: 208, protein: 20, carbs: 0,  fat: 13, quantity: '100g' },
  { id: 111, name: 'Sweet potato',   calories: 86,  protein: 2,  carbs: 20, fat: 0,  quantity: '100g' },
  { id: 112, name: 'Whole milk',     calories: 149, protein: 8,  carbs: 12, fat: 8,  quantity: '1 cup' },
  { id: 113, name: 'Almonds',        calories: 164, protein: 6,  carbs: 6,  fat: 14, quantity: '28g' },
  { id: 114, name: 'Dal (lentils)',  calories: 230, protein: 18, carbs: 40, fat: 1,  quantity: '1 cup' },
  { id: 115, name: 'Chapati',        calories: 120, protein: 4,  carbs: 20, fat: 3,  quantity: '1 piece' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getMealCalories  = (meal: Meal) => meal.items.reduce((s, i) => s + i.calories, 0);
const getTotalConsumed = (meals: Meal[]) => meals.reduce((s, m) => s + getMealCalories(m), 0);
const clamp = (v: number, mn: number, mx: number) => Math.min(Math.max(v, mn), mx);

// ─── Macro Bar ────────────────────────────────────────────────────────────────

const MacroBar = ({ label, consumed, target, color }: { label: string; consumed: number; target: number; color: string }) => {
  const pct = clamp((consumed / target) * 100, 0, 100);
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

const QuickAddModal = ({ visible, meals, onClose, onAdd }: {
  visible: boolean; meals: Meal[]; onClose: () => void;
  onAdd: (mealId: number, food: FoodItem) => void;
}) => {
  const [query, setQuery]               = useState('');
  const [selectedMeal, setSelectedMeal] = useState<number|null>(null);

  const results = query.length > 1
    ? FOOD_DB.filter(f => f.name.toLowerCase().includes(query.toLowerCase()))
    : FOOD_DB.slice(0, 6);

  const handleAdd = (food: FoodItem) => {
    if (!selectedMeal) { Alert.alert('Select Meal', 'Please select which meal to add this to.'); return; }
    onAdd(selectedMeal, food);
    setQuery('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <View style={m.titleRow}>
            <Text style={m.title}>Quick Add Food</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Meal Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={m.mealScroll}>
            {meals.map(meal => (
              <TouchableOpacity
                key={meal.id}
                style={[m.mealChip, selectedMeal === meal.id && m.mealChipActive]}
                onPress={() => setSelectedMeal(meal.id)} activeOpacity={0.7}
              >
                <Ionicons name={meal.icon} size={16} color={selectedMeal === meal.id ? Colors.primary : Colors.textMuted} />
                <Text style={[m.mealChipText, selectedMeal === meal.id && m.mealChipTextActive]}>{meal.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search */}
          <View style={m.searchRow}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={m.searchInput} value={query} onChangeText={setQuery}
              placeholder="Search food..." placeholderTextColor={Colors.textMuted} autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle-outline" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Results */}
          <ScrollView style={m.resultsList} showsVerticalScrollIndicator={false}>
            {results.map(food => (
              <TouchableOpacity key={food.id} style={m.foodRow} onPress={() => handleAdd(food)} activeOpacity={0.7}>
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
                <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={m.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={m.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DietScreen() {
  const [data, setData]               = useState<DietData>(DUMMY_DATA);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState<number|null>(1);

  const totalConsumed = getTotalConsumed(data.meals);
  const remaining     = data.calories_target - totalConsumed;

  const toggleWater = (index: number) => {
    const newVal = index < data.water_glasses ? index : index + 1;
    setData(prev => ({ ...prev, water_glasses: newVal }));
  };

  const handleAddFood = (mealId: number, food: FoodItem) => {
    setData(prev => ({
      ...prev,
      meals: prev.meals.map(m =>
        m.id === mealId ? { ...m, items: [...m.items, { ...food, id: Date.now() }] } : m
      ),
    }));
    setShowAddModal(false);
  };

  const handleRemoveFood = (mealId: number, foodId: number) => {
    Alert.alert('Remove Item', 'Remove this food item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () =>
        setData(prev => ({
          ...prev,
          meals: prev.meals.map(m =>
            m.id === mealId ? { ...m, items: m.items.filter(i => i.id !== foodId) } : m
          ),
        }))
      },
    ]);
  };

  const toggleMealComplete = (mealId: number) =>
    setData(prev => ({
      ...prev,
      meals: prev.meals.map(m => m.id === mealId ? { ...m, completed: !m.completed } : m),
    }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Diet Tracker</Text>
          <Text style={styles.headerDate}>{data.date}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.85}>
          <Ionicons name="add-outline" size={18} color={Colors.white} />
          <Text style={styles.addBtnText}>Add Food</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          {/* Calorie Ring */}
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
                  <Text style={styles.ringStatVal}>{Math.round(clamp((totalConsumed / data.calories_target) * 100, 0, 100))}%</Text>
                </View>
                <Text style={styles.ringStatLabel}>Done</Text>
              </View>
            </View>
          </View>

          {/* Macros */}
          <View style={styles.macrosRow}>
            <MacroBar label="Protein" consumed={data.macros.protein.consumed} target={data.macros.protein.target} color="#4CAF50" />
            <MacroBar label="Carbs"   consumed={data.macros.carbs.consumed}   target={data.macros.carbs.target}   color="#2196F3" />
            <MacroBar label="Fat"     consumed={data.macros.fat.consumed}      target={data.macros.fat.target}     color="#FF9800" />
          </View>
        </View>

        {/* Meals */}
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        <View style={styles.mealsGroup}>
          {data.meals.map(meal => {
            const mealCals  = getMealCalories(meal);
            const isExpanded = expandedMeal === meal.id;
            return (
              <View key={meal.id} style={[styles.mealCard, meal.completed && styles.mealCardDone]}>
                <TouchableOpacity style={styles.mealHeader} onPress={() => setExpandedMeal(isExpanded ? null : meal.id)} activeOpacity={0.7}>
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
                        <TouchableOpacity key={item.id} style={styles.foodItem} onLongPress={() => handleRemoveFood(meal.id, item.id)} activeOpacity={0.7}>
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
                      <TouchableOpacity style={styles.mealAddBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.7}>
                        <Ionicons name="add-outline" size={16} color={Colors.primary} />
                        <Text style={styles.mealAddBtnText}>Add Food</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.mealDoneBtn, meal.completed && styles.mealDoneBtnActive]}
                        onPress={() => toggleMealComplete(meal.id)} activeOpacity={0.7}
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

        {/* Water Intake */}
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

        {/* AI Tip */}
        <Text style={styles.sectionTitle}>AI Coach Tip</Text>
        <View style={styles.aiTipCard}>
          <View style={styles.aiTipAvatar}>
            <Ionicons name="sparkles-outline" size={18} color={Colors.white} />
          </View>
          <Text style={styles.aiTipText}>{data.ai_tip}</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <QuickAddModal visible={showAddModal} meals={data.meals} onClose={() => setShowAddModal(false)} onAdd={handleAddFood} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
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
});