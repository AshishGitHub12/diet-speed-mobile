import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Alert,
  ActivityIndicator, RefreshControl, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import api from '@/src/services/api';

const CONTENT_BASE = '/content/';

interface RecipeListItem {
  id: number; title: string; image_url: string; calories: number; prep_time_minutes: number;
}
interface RecipeDetail {
  id: number; title: string; image_url: string; calories: number; protein: number; carbs: number; fat: number;
  quantity_label: string; prep_time_minutes: number; servings: number;
  suggested_meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  ingredients: string[]; steps: string[]; video_url: string;
}

const MEAL_TYPES: Array<RecipeDetail['suggested_meal_type']> = ['breakfast', 'lunch', 'snack', 'dinner'];

const RecipeDetailModal = ({ recipeId, onClose }: { recipeId: number | null; onClose: () => void }) => {
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<RecipeDetail['suggested_meal_type']>('breakfast');
  const [logging, setLogging] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!recipeId) return;
      setLoading(true);
      api.get<RecipeDetail>(`${CONTENT_BASE}recipes/${recipeId}/`)
        .then(({ data }) => { setRecipe(data); setSelectedMeal(data.suggested_meal_type); })
        .catch((error) => console.log('❌ Recipe detail fetch error:', error))
        .finally(() => setLoading(false));
    }, [recipeId])
  );

  const logMeal = async () => {
    if (!recipe || logging) return;
    setLogging(true);
    try {
      const { data } = await api.post(`${CONTENT_BASE}recipes/${recipe.id}/log/`, { meal_type: selectedMeal });
      Alert.alert('Logged!', data.detail || 'Added to your Diet Tracker.', [{ text: 'OK', onPress: onClose }]);
    } catch (error: any) {
      console.log('❌ Log recipe error:', error?.response?.status, JSON.stringify(error?.response?.data));
      Alert.alert('Error', 'Could not log this meal. Please try again.');
    } finally {
      setLogging(false);
    }
  };

  const insets = useSafeAreaInsets();
  // On Android, a Modal opens in its own window and react-native-safe-area-context
  // can report insets.top as 0 inside it (the Modal isn't under the same
  // SafeAreaProvider layout pass), which is what caused the header to sit
  // under the status bar. StatusBar.currentHeight is a reliable Android fallback.
  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight || insets.top || 24) : insets.top;

  return (
    <Modal visible={!!recipeId} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[detailStyles.safe, { paddingTop: topInset }]}>
        <View style={detailStyles.header}>
          <TouchableOpacity onPress={onClose} style={detailStyles.headerBtn}>
            <Text style={detailStyles.headerBack}>‹</Text>
          </TouchableOpacity>
          <Text style={detailStyles.headerTitle} numberOfLines={1}>{recipe?.title ?? 'Recipe'}</Text>
          <View style={detailStyles.headerBtn} />
        </View>

        {loading || !recipe ? (
          <View style={detailStyles.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>
        ) : (
          <ScrollView contentContainerStyle={detailStyles.scrollContent}>
            {!!recipe.image_url && <Image source={{ uri: recipe.image_url }} style={detailStyles.image} />}

            <View style={detailStyles.macroRow}>
              <View style={detailStyles.macroItem}><Text style={detailStyles.macroVal}>{recipe.calories}</Text><Text style={detailStyles.macroLabel}>kcal</Text></View>
              <View style={detailStyles.macroItem}><Text style={detailStyles.macroVal}>{recipe.protein}g</Text><Text style={detailStyles.macroLabel}>Protein</Text></View>
              <View style={detailStyles.macroItem}><Text style={detailStyles.macroVal}>{recipe.carbs}g</Text><Text style={detailStyles.macroLabel}>Carbs</Text></View>
              <View style={detailStyles.macroItem}><Text style={detailStyles.macroVal}>{recipe.fat}g</Text><Text style={detailStyles.macroLabel}>Fat</Text></View>
            </View>
            <View style={detailStyles.metaRow}>
              <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
              <Text style={detailStyles.metaText}>
                {recipe.prep_time_minutes} min · Serves {recipe.servings} · {recipe.quantity_label}
              </Text>
            </View>

            <Text style={detailStyles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ing, i) => (
              <View key={i} style={detailStyles.bulletRow}>
                <Text style={detailStyles.bulletDot}>•</Text>
                <Text style={detailStyles.bulletText}>{ing}</Text>
              </View>
            ))}

            <Text style={detailStyles.sectionTitle}>Steps</Text>
            {recipe.steps.map((step, i) => (
              <View key={i} style={detailStyles.stepRow}>
                <View style={detailStyles.stepNum}><Text style={detailStyles.stepNumText}>{i + 1}</Text></View>
                <Text style={detailStyles.stepText}>{step}</Text>
              </View>
            ))}

            <Text style={detailStyles.sectionTitle}>Log this as</Text>
            <View style={detailStyles.mealTypeRow}>
              {MEAL_TYPES.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[detailStyles.mealTypePill, selectedMeal === m && detailStyles.mealTypePillActive]}
                  onPress={() => setSelectedMeal(m)}
                >
                  <Text style={[detailStyles.mealTypeText, selectedMeal === m && detailStyles.mealTypeTextActive]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[detailStyles.logBtn, logging && detailStyles.logBtnDisabled]} onPress={logMeal} disabled={logging} activeOpacity={0.85}>
              {logging ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={detailStyles.logBtnText}>Log this Meal</Text>}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

export default function RecipesScreen() {
  const router = useRouter();
  const { recipeId } = useLocalSearchParams<{ recipeId?: string }>();
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openRecipeId, setOpenRecipeId] = useState<number | null>(null);
  const autoOpenedRef = React.useRef<string | null>(null);

  const fetchRecipes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data } = await api.get<RecipeListItem[]>(`${CONTENT_BASE}recipes/`);
      setRecipes(data);
      // Deep-linked from Home: open the tapped recipe's detail automatically, once.
      if (recipeId && autoOpenedRef.current !== recipeId) {
        const match = data.find((r) => String(r.id) === String(recipeId));
        if (match) { setOpenRecipeId(match.id); autoOpenedRef.current = recipeId; }
      }
    } catch (error) {
      console.log('❌ Recipes fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [recipeId]);

  useFocusEffect(useCallback(() => { fetchRecipes(); }, [fetchRecipes]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipes</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRecipes(true)} tintColor={Colors.primary} />}
        >
          <View style={styles.grid}>
            {recipes.map((r) => (
              <TouchableOpacity key={r.id} style={styles.card} activeOpacity={0.85} onPress={() => setOpenRecipeId(r.id)}>
                <View style={styles.thumbWrap}>
                  {!!r.image_url && <Image source={{ uri: r.image_url }} style={styles.thumb} />}
                  <View style={styles.calBadge}>
                    <Ionicons name="flame-outline" size={11} color={Colors.white} />
                    <Text style={styles.calBadgeText}>{r.calories} cal</Text>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.recipeTitle}>{r.title}</Text>
                  <View style={styles.recipeMetaRow}>
                    <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
                    <Text style={styles.recipeMeta}>{r.prep_time_minutes} min</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {recipes.length === 0 && <Text style={styles.emptyText}>No recipes yet — check back soon!</Text>}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <RecipeDetailModal recipeId={openRecipeId} onClose={() => setOpenRecipeId(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.primaryMuted,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  scrollContent: { padding: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  thumbWrap: { width: '100%', height: 120, backgroundColor: Colors.primaryMuted },
  thumb: { width: '100%', height: '100%' },
  calBadge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: BorderRadius.full, paddingHorizontal: 6, paddingVertical: 2 },
  calBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '700' },
  cardBody: { padding: Spacing.sm, gap: 2 },
  recipeTitle: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textDark },
  recipeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  recipeMeta: { fontSize: 11, color: Colors.textMuted },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});

const detailStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.primaryMuted },
  headerBtn: { width: 40, alignItems: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  scrollContent: { padding: Spacing.md },
  image: { width: '100%', height: 200, borderRadius: BorderRadius.lg, backgroundColor: Colors.primaryMuted, marginBottom: Spacing.md },
  macroRow: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, paddingVertical: Spacing.sm },
  macroItem: { flex: 1, alignItems: 'center' },
  macroVal: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  macroLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.sm },
  metaText: { fontSize: 12, color: Colors.textMuted },
  sectionTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  bulletRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  bulletDot: { color: Colors.primary, fontWeight: '700' },
  bulletText: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.textDark },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  stepNumText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  stepText: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.textDark, lineHeight: 20 },
  mealTypeRow: { flexDirection: 'row', gap: 8 },
  mealTypePill: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center' },
  mealTypePillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  mealTypeText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  mealTypeTextActive: { color: Colors.white },
  logBtn: { marginTop: Spacing.lg, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 52, justifyContent: 'center', alignItems: 'center' },
  logBtnDisabled: { opacity: 0.6 },
  logBtnText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});