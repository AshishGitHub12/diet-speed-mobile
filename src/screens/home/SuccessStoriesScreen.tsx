import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import api from '@/src/services/api';

const CONTENT_BASE = '/content/';

// ─── Shared design system (matches Home, Weight Tracker, Meal Log, Diet,
// Challenges, Profile, Notifications, Recipes, Explore…) ───────────────────

const Accent = { gold: '#B9892E', plum: '#6E5A8C', teal: '#3E7CA6', berry: '#8B3A42' };
const Tint   = { mint: '#E1EEDD', peach: '#F5E6D3', lilac: '#E7E2F0', sky: '#DCEAF2' };
const LIME   = '#B9F24C';

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

// Cycle through the pastel family for each story card, same pattern as
// Home's success-story row and the recipe/explore cards.
const CARD_TINTS = [Tint.mint, Tint.peach, Tint.lilac, Tint.sky];

interface SuccessStory {
  id: number;
  name: string;
  photo_url: string;
  weight_lost_kg: number | null;
  duration_text: string;
  testimonial: string;
}

export default function SuccessStoriesScreen() {
  const router = useRouter();
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStories = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data } = await api.get<SuccessStory[]>(`${CONTENT_BASE}success-stories/`);
      setStories(data);
    } catch (error) {
      console.log('❌ Success stories fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchStories(); }, [fetchStories]));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Success Stories</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchStories(true)} tintColor={Colors.primary} />}
        >
          {stories.map((s, i) => {
            const tint = CARD_TINTS[i % CARD_TINTS.length];
            return (
              <View key={s.id} style={[styles.card, leafRadius(BorderRadius.xl)]}>
                {!!s.photo_url && <Image source={{ uri: s.photo_url }} style={styles.photo} />}
                <View style={[styles.cardBody, { backgroundColor: tint }]}>
                  <View style={styles.badge}>
                    <Ionicons name="star" size={11} color={Colors.textDark} />
                    <Text style={styles.badgeText}>Success</Text>
                  </View>
                  <Text style={styles.name}>{s.name}</Text>
                  {s.weight_lost_kg != null && (
                    <View style={styles.lostRow}>
                      <Ionicons name="trending-down" size={13} color={Colors.primary} />
                      <Text style={styles.lostText}>Lost {s.weight_lost_kg}kg {s.duration_text}</Text>
                    </View>
                  )}
                  {!!s.testimonial && (
                    <View style={styles.testimonialRow}>
                      <Ionicons name="chatbubble-ellipses-outline" size={13} color={Colors.textMuted} style={{ marginTop: 2 }} />
                      <Text style={styles.testimonial}>"{s.testimonial}"</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
          {stories.length === 0 && (
            <Text style={styles.emptyText}>No success stories yet — check back soon!</Text>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  card: {
    backgroundColor: Colors.white, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
  },
  photo: { width: '100%', height: 180, backgroundColor: Tint.mint },
  cardBody: { padding: Spacing.md, gap: 6 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', backgroundColor: LIME,
    borderRadius: BorderRadius.full, paddingHorizontal: 9, paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: Colors.textDark },
  name: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.textDark },
  lostRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  lostText: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '700' },
  testimonialRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  testimonial: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.textDark, fontStyle: 'italic', lineHeight: 19 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});