import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Modal, Linking, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

const ICON_PLAY = require('@/assets/icons/play.png');
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - 12) / 2;

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Drinks'];

const RECIPES = [
  { id: 1,  name: 'Oats Smoothie Bowl',      category: 'Breakfast', calories: 320, protein: 12, carbs: 48, fat: 8,  prep_time: '10 min', image: '', video_url: '', diet: 'Vegetarian' },
  { id: 2,  name: 'Grilled Chicken Salad',   category: 'Lunch',     calories: 410, protein: 38, carbs: 18, fat: 14, prep_time: '20 min', image: '', video_url: '', diet: 'Non-Veg' },
  { id: 3,  name: 'Avocado Toast',            category: 'Breakfast', calories: 280, protein: 8,  carbs: 32, fat: 14, prep_time: '5 min',  image: '', video_url: '', diet: 'Vegan' },
  { id: 4,  name: 'Protein Pancakes',         category: 'Breakfast', calories: 350, protein: 22, carbs: 40, fat: 8,  prep_time: '15 min', image: '', video_url: '', diet: 'Vegetarian' },
  { id: 5,  name: 'Dal Tadka & Brown Rice',   category: 'Lunch',     calories: 480, protein: 18, carbs: 72, fat: 10, prep_time: '30 min', image: '', video_url: '', diet: 'Vegan' },
  { id: 6,  name: 'Baked Salmon',             category: 'Dinner',    calories: 520, protein: 42, carbs: 8,  fat: 28, prep_time: '25 min', image: '', video_url: '', diet: 'Non-Veg' },
  { id: 7,  name: 'Mixed Nuts & Fruits',      category: 'Snacks',    calories: 180, protein: 5,  carbs: 22, fat: 9,  prep_time: '2 min',  image: '', video_url: '', diet: 'Vegan' },
  { id: 8,  name: 'Green Detox Smoothie',     category: 'Drinks',    calories: 140, protein: 4,  carbs: 28, fat: 2,  prep_time: '5 min',  image: '', video_url: '', diet: 'Vegan' },
  { id: 9,  name: 'Paneer Tikka Bowl',        category: 'Dinner',    calories: 440, protein: 26, carbs: 30, fat: 22, prep_time: '35 min', image: '', video_url: '', diet: 'Vegetarian' },
  { id: 10, name: 'Banana Protein Shake',     category: 'Drinks',    calories: 260, protein: 18, carbs: 36, fat: 3,  prep_time: '3 min',  image: '', video_url: '', diet: 'Vegetarian' },
];

const DIET_COLORS: Record<string, string> = {
  Vegan:       '#4CAF50',
  Vegetarian:  '#FF9800',
  'Non-Veg':   '#E05C5C',
};

const CAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Breakfast: 'sunny-outline',
  Lunch:     'partly-sunny-outline',
  Dinner:    'moon-outline',
  Snacks:    'cafe-outline',
  Drinks:    'wine-outline',
};

// ─── Recipe Detail Modal ──────────────────────────────────────────────────────

const RecipeModal = ({ recipe, visible, onClose }: {
  recipe: typeof RECIPES[0] | null; visible: boolean; onClose: () => void;
}) => {
  if (!recipe) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <View style={m.titleRow}>
            <View style={m.titleLeft}>
              <Ionicons name={CAT_ICONS[recipe.category] ?? 'restaurant-outline'} size={20} color={Colors.primary} />
              <Text style={m.title} numberOfLines={2}>{recipe.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Video Placeholder */}
          <View style={m.videoBox}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.primary} style={{ opacity: 0.35 }} />
            <Text style={m.videoText}>Recipe Video</Text>
          </View>

          {/* Macros */}
          <View style={m.macrosRow}>
            {[
              { label: 'Calories', val: `${recipe.calories}`, unit: 'kcal', icon: 'flame-outline'     as const, color: '#FF9800' },
              { label: 'Protein',  val: `${recipe.protein}`,  unit: 'g',    icon: 'barbell-outline'   as const, color: '#4CAF50' },
              { label: 'Carbs',    val: `${recipe.carbs}`,    unit: 'g',    icon: 'leaf-outline'      as const, color: '#2196F3' },
              { label: 'Fat',      val: `${recipe.fat}`,      unit: 'g',    icon: 'water-outline'     as const, color: '#9C27B0' },
            ].map((macro, i) => (
              <View key={i} style={m.macroCard}>
                <Ionicons name={macro.icon} size={16} color={macro.color} />
                <Text style={[m.macroVal, { color: macro.color }]}>{macro.val}</Text>
                <Text style={m.macroUnit}>{macro.unit}</Text>
                <Text style={m.macroLabel}>{macro.label}</Text>
              </View>
            ))}
          </View>

          {/* Meta */}
          <View style={m.metaRow}>
            <View style={m.metaChip}>
              <Ionicons name="time-outline" size={14} color={Colors.primary} />
              <Text style={m.metaText}>{recipe.prep_time}</Text>
            </View>
            <View style={[m.metaChip, { backgroundColor: DIET_COLORS[recipe.diet] + '18' }]}>
              <Ionicons name="leaf-outline" size={14} color={DIET_COLORS[recipe.diet]} />
              <Text style={[m.metaText, { color: DIET_COLORS[recipe.diet] }]}>{recipe.diet}</Text>
            </View>
            <View style={m.metaChip}>
              <Ionicons name={CAT_ICONS[recipe.category] ?? 'restaurant-outline'} size={14} color={Colors.primary} />
              <Text style={m.metaText}>{recipe.category}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={m.watchBtn}
            onPress={() => { if (recipe.video_url) Linking.openURL(recipe.video_url); }}
            activeOpacity={0.85}
          >
            <Ionicons name="play-circle-outline" size={20} color={Colors.white} />
            <Text style={m.watchBtnText}>Watch Recipe Video</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RecipesScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory]   = useState('All');
  const [selectedRecipe, setSelectedRecipe]   = useState<typeof RECIPES[0] | null>(null);
  const [showModal, setShowModal]             = useState(false);

  const filtered = activeCategory === 'All'
    ? RECIPES
    : RECIPES.filter(r => r.category === activeCategory);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipes</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconBox}>
            <Ionicons name="restaurant-outline" size={28} color={Colors.primary} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Healthy Recipes</Text>
            <Text style={styles.bannerSub}>{RECIPES.length} recipes · Watch & cook</Text>
          </View>
        </View>

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
              onPress={() => setActiveCategory(cat)} activeOpacity={0.7}
            >
              {cat !== 'All' && (
                <Ionicons
                  name={CAT_ICONS[cat] ?? 'restaurant-outline'}
                  size={13}
                  color={activeCategory === cat ? Colors.primary : Colors.textMuted}
                />
              )}
              <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Count */}
        <View style={styles.countRow}>
          <Ionicons name="restaurant-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.countText}>{filtered.length} recipes</Text>
        </View>

        {/* Recipe Grid */}
        <View style={styles.grid}>
          {filtered.map(recipe => (
            <TouchableOpacity
              key={recipe.id}
              style={styles.recipeCard}
              onPress={() => { setSelectedRecipe(recipe); setShowModal(true); }}
              activeOpacity={0.85}
            >
              {/* Image / Placeholder */}
              {recipe.image
                ? <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
                : (
                  <View style={styles.recipePlaceholder}>
                    <Ionicons name={CAT_ICONS[recipe.category] ?? 'restaurant-outline'} size={36} color={Colors.primary} style={{ opacity: 0.35 }} />
                  </View>
                )
              }

              {/* Play Button */}
              <View style={styles.playBtn}>
                <Image source={ICON_PLAY} style={styles.playImg} resizeMode="contain" />
              </View>

              {/* Calorie Chip */}
              <View style={styles.calChip}>
                <Ionicons name="flame-outline" size={10} color="#fff" />
                <Text style={styles.calChipText}>{recipe.calories}</Text>
              </View>

              {/* Diet Badge */}
              <View style={[styles.dietBadge, { backgroundColor: DIET_COLORS[recipe.diet] }]}>
                <Text style={styles.dietBadgeText}>{recipe.diet[0]}</Text>
              </View>

              {/* Overlay */}
              <View style={styles.recipeOverlay}>
                <Text style={styles.recipeName} numberOfLines={2}>{recipe.name}</Text>
                <View style={styles.recipeMetaRow}>
                  <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.recipeMetaText}>{recipe.prep_time}</Text>
                  <Text style={styles.recipeMetaDot}>·</Text>
                  <Text style={styles.recipeMetaText}>{recipe.category}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <RecipeModal recipe={selectedRecipe} visible={showModal} onClose={() => setShowModal(false)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.primaryMuted },
  headerBtn:   { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.md },
  bannerIconBox:{ width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
  bannerText:  { flex: 1 },
  bannerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  bannerSub:   { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2 },

  tabsScroll:  { marginBottom: Spacing.sm },
  tabsContent: { gap: 8, paddingVertical: 4 },
  categoryTab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  categoryTabActive:     { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  categoryTabText:       { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted },
  categoryTabTextActive: { color: Colors.primary },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  countText:{ fontSize: Fonts.sizes.sm, color: Colors.textMuted },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  recipeCard:        { width: CARD_WIDTH, height: 190, borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.primaryMuted },
  recipeImage:       { width: '100%', height: '100%', position: 'absolute' },
  recipePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primaryMuted },
  playBtn:  { position: 'absolute', top: '50%', left: '50%', marginTop: -16, marginLeft: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  playImg:  { width: 13, height: 13 },
  calChip:  { position: 'absolute', top: Spacing.sm, left: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  calChipText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  dietBadge:    { position: 'absolute', top: Spacing.sm, right: Spacing.sm, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dietBadgeText:{ fontSize: 10, color: '#fff', fontWeight: '800' },
  recipeOverlay:  { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: Spacing.sm, gap: 3 },
  recipeName:     { fontSize: Fonts.sizes.sm, color: '#fff', fontWeight: '700', lineHeight: 17 },
  recipeMetaRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recipeMetaText: { fontSize: 10, color: 'rgba(255,255,255,0.8)' },
  recipeMetaDot:  { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg + 20, paddingTop: Spacing.sm, gap: Spacing.md },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.sm },
  titleRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flex: 1, marginRight: Spacing.sm },
  title:     { flex: 1, fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark },
  videoBox:  { height: 160, backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', gap: 6 },
  videoText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  macrosRow: { flexDirection: 'row', gap: 8 },
  macroCard: { flex: 1, backgroundColor: Colors.background, borderRadius: BorderRadius.lg, padding: Spacing.sm, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: Colors.border },
  macroVal:  { fontSize: Fonts.sizes.md, fontWeight: '800' },
  macroUnit: { fontSize: 10, color: Colors.textMuted },
  macroLabel:{ fontSize: 10, color: Colors.textMuted },
  metaRow:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaChip:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  metaText:  { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
  watchBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 52 },
  watchBtnText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});