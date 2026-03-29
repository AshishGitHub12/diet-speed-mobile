import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

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

export default function FavoritesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('Recipes');
  const [saved, setSaved] = useState<string[]>(['1', '2', '3', '4', '5', '6', '7']);

  const toggleSave = (id: string) => {
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const items = FAVORITES[activeTab];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Tabs */}
        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Items */}
        {items.filter(item => saved.includes(item.id)).length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💔</Text>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>Save {activeTab.toLowerCase()} to find them here</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map(item => (
              saved.includes(item.id) && (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemIconWrapper}>
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemMeta}>🔥 {item.calories} kcal  •  ⏱ {item.time}</Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleSave(item.id)} style={styles.heartBtn}>
                    <Text style={styles.heartIcon}>❤️</Text>
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
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryMuted,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  tabs: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: BorderRadius.full, padding: 4,
    marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: BorderRadius.full, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: Colors.white, fontWeight: '700' },

  list: { gap: 10 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  itemIconWrapper: {
    width: 50, height: 50, borderRadius: 12,
    backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center',
  },
  itemIcon: { fontSize: 26 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textDark },
  itemMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  heartBtn: { padding: 4 },
  heartIcon: { fontSize: 22 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark },
  emptyText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
});