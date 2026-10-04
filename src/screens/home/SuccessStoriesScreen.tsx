import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import api from '@/src/services/api';

const CONTENT_BASE = '/content/';

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
          <Text style={styles.headerBack}>‹</Text>
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
          {stories.map((s) => (
            <View key={s.id} style={styles.card}>
              {!!s.photo_url && <Image source={{ uri: s.photo_url }} style={styles.photo} />}
              <View style={styles.cardBody}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>★ Success</Text>
                </View>
                <Text style={styles.name}>{s.name}</Text>
                {s.weight_lost_kg != null && (
                  <Text style={styles.lostText}>Lost {s.weight_lost_kg}kg {s.duration_text}</Text>
                )}
                {!!s.testimonial && <Text style={styles.testimonial}>"{s.testimonial}"</Text>}
              </View>
            </View>
          ))}
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
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.primaryMuted,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  card: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
  },
  photo: { width: '100%', height: 180, backgroundColor: Colors.primaryMuted },
  cardBody: { padding: Spacing.md, gap: 6 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#FFD70030', borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#B8860B' },
  name: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.textDark },
  lostText: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
  testimonial: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontStyle: 'italic', marginTop: 4 },
  emptyText: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});