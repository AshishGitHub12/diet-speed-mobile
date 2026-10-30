import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Shared design system (matches Home, Diet, Challenges, Recipes, Explore,
// Notifications, Reminders…) ─────────────────────────────────────────────────

const Accent = { gold: '#B9892E', plum: '#6E5A8C', teal: '#3E7CA6', berry: '#8B3A42' };
const Tint   = { mint: '#E1EEDD', peach: '#F5E6D3', lilac: '#E7E2F0', sky: '#DCEAF2' };
const LIME   = '#B9F24C';

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

const FAVORITES = {
  Recipes: [
    { id: '1', title: 'Grilled Chicken Salad', calories: 320, time: '25 min', icon: '🥗' },
    { id: '2', title: 'Oats with Berries', calories: 280, time: '10 min', icon: '🥣' },
    { id: '3', title: 'Protein Smoothie', calories: 210, time: '5 min', icon: '🥤' },
    { id: '4', title: 'Boiled Eggs & Toast', calories: 380, time: '15 min', icon: '🍳' },
  ],
  Workouts: [
    { id: '5', title: 'Full Body HIIT', calories: 450, time: '30 min', icon: '🔥' },
    { id: '6', title: 'Morning Yoga', calories: 180, time: '20 min', icon: '🧘' },
    { id: '7', title: 'Strength Training', calories: 380, time: '45 min', icon: '💪' },
  ],
};

const TABS = ['Recipes', 'Workouts'] as const;
type TabType = typeof TABS[number];

// Each tab gets its own accent/tint pairing, cycled per-card, same pattern
// used across Recipes/Explore/Challenges.
const TAB_CARD_TINTS: Record<TabType, string[]> = {
  Recipes: [Tint.peach, Tint.mint, Tint.sky, Tint.lilac],
  Workouts: [Tint.lilac, Tint.sky, Tint.peach],
};
const TAB_ACCENT: Record<TabType, string> = {
  Recipes: Accent.gold,
  Workouts: Accent.teal,
};

export default function FavoritesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('Recipes');
  const [saved, setSaved] = useState<string[]>(['1', '2', '3', '4', '5', '6', '7']);

  const toggleSave = (id: string) => {
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const items = FAVORITES[activeTab];
  const visibleItems = items.filter(item => saved.includes(item.id));
  const tints = TAB_CARD_TINTS[activeTab];
  const accent = TAB_ACCENT[activeTab];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Dark hero summary card */}
        <View style={[styles.hero, leafRadius(BorderRadius.xl)]}>
          <View style={styles.heroBlobTop} />
          <View style={styles.heroBlobBottom} />
          <View style={styles.heroIconWrap}>
            <Ionicons name="heart" size={22} color={LIME} />
          </View>
          <Text style={styles.heroValue}>{saved.length} saved</Text>
          <Text style={styles.heroSub}>Recipes & workouts you love</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { backgroundColor: Colors.textDark }]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons
                name={tab === 'Recipes' ? 'restaurant-outline' : 'barbell-outline'}
                size={14}
                color={activeTab === tab ? LIME : Colors.textMuted}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Items */}
        {visibleItems.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="heart-dislike-outline" size={28} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>Save {activeTab.toLowerCase()} to find them here</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item, index) => (
              saved.includes(item.id) && (
                <View key={item.id} style={[styles.itemCard, leafRadius(BorderRadius.lg), { backgroundColor: tints[index % tints.length] }]}>
                  <View style={styles.itemIconWrapper}>
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.itemMetaRow}>
                      <Ionicons name="flame-outline" size={12} color={accent} />
                      <Text style={[styles.itemMeta, { color: accent }]}>{item.calories} kcal</Text>
                      <View style={styles.dot} />
                      <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                      <Text style={styles.itemMeta}>{item.time}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => toggleSave(item.id)} style={styles.heartBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="heart" size={20} color={Accent.berry} />
                  </TouchableOpacity>
                </View>
              )
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
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
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

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

  tabs: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: BorderRadius.full, padding: 4,
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: BorderRadius.full },
  tabText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: Colors.white, fontWeight: '800' },

  list: { gap: 10 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.md,
  },
  itemIconWrapper: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center',
  },
  itemIcon: { fontSize: 24 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.textDark },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  itemMeta: { fontSize: 11.5, color: Colors.textMuted, fontWeight: '700' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textMuted, marginHorizontal: 2 },
  heartBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center',
  },

  empty: { alignItems: 'center', paddingTop: 50, gap: 10 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.textDark },
  emptyText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '500' },
});