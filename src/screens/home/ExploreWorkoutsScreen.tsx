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

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Strength', 'Cardio', 'Yoga', 'HIIT', 'Stretching'];

const WORKOUTS = [
  { id: 1,  title: 'Full Body Strength',      category: 'Strength',   duration: '30 min', level: 'Intermediate', calories: 320, thumbnail: '', video_url: '' },
  { id: 2,  title: 'Morning Yoga Flow',        category: 'Yoga',       duration: '20 min', level: 'Beginner',     calories: 150, thumbnail: '', video_url: '' },
  { id: 3,  title: 'HIIT Cardio Blast',        category: 'HIIT',       duration: '25 min', level: 'Advanced',     calories: 400, thumbnail: '', video_url: '' },
  { id: 4,  title: 'Core Strength Training',   category: 'Strength',   duration: '15 min', level: 'Beginner',     calories: 180, thumbnail: '', video_url: '' },
  { id: 5,  title: 'Fat Burning Cardio',       category: 'Cardio',     duration: '35 min', level: 'Intermediate', calories: 450, thumbnail: '', video_url: '' },
  { id: 6,  title: 'Full Body Stretching',     category: 'Stretching', duration: '20 min', level: 'Beginner',     calories: 100, thumbnail: '', video_url: '' },
  { id: 7,  title: 'Upper Body Power',         category: 'Strength',   duration: '40 min', level: 'Advanced',     calories: 380, thumbnail: '', video_url: '' },
  { id: 8,  title: 'Tabata HIIT',              category: 'HIIT',       duration: '20 min', level: 'Advanced',     calories: 360, thumbnail: '', video_url: '' },
  { id: 9,  title: 'Evening Wind Down Yoga',   category: 'Yoga',       duration: '25 min', level: 'Beginner',     calories: 120, thumbnail: '', video_url: '' },
  { id: 10, title: 'Leg Day Workout',          category: 'Strength',   duration: '45 min', level: 'Intermediate', calories: 420, thumbnail: '', video_url: '' },
];

const LEVEL_COLORS: Record<string, string> = {
  Beginner:     '#4CAF50',
  Intermediate: '#FF9800',
  Advanced:     '#E05C5C',
};

// ─── Video Modal ──────────────────────────────────────────────────────────────

const VideoModal = ({ workout, visible, onClose }: {
  workout: typeof WORKOUTS[0] | null; visible: boolean; onClose: () => void;
}) => {
  if (!workout) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <View style={m.titleRow}>
            <Text style={m.title} numberOfLines={2}>{workout.title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Video Placeholder */}
          <View style={m.videoBox}>
            <Ionicons name="videocam-outline" size={48} color={Colors.primary} style={{ opacity: 0.4 }} />
            <Text style={m.videoPlaceholderText}>Video Preview</Text>
          </View>

          {/* Details */}
          <View style={m.detailsRow}>
            {[
              { icon: 'time-outline'   as const, val: workout.duration },
              { icon: 'flame-outline'  as const, val: `${workout.calories} kcal` },
              { icon: 'barbell-outline'as const, val: workout.level },
              { icon: 'grid-outline'   as const, val: workout.category },
            ].map((d, i) => (
              <View key={i} style={m.detailChip}>
                <Ionicons name={d.icon} size={14} color={Colors.primary} />
                <Text style={m.detailText}>{d.val}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={m.watchBtn}
            onPress={() => { if (workout.video_url) Linking.openURL(workout.video_url); }}
            activeOpacity={0.85}
          >
            <Ionicons name="play-circle-outline" size={20} color={Colors.white} />
            <Text style={m.watchBtnText}>Watch Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExploreWorkoutsScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedWorkout, setSelectedWorkout] = useState<typeof WORKOUTS[0] | null>(null);
  const [showModal, setShowModal] = useState(false);

  const filtered = activeCategory === 'All'
    ? WORKOUTS
    : WORKOUTS.filter(w => w.category === activeCategory);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Workouts</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconBox}>
            <Ionicons name="barbell-outline" size={28} color={Colors.primary} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Workout Videos</Text>
            <Text style={styles.bannerSub}>{WORKOUTS.length} videos · All levels</Text>
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
              <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Count */}
        <View style={styles.countRow}>
          <Ionicons name="videocam-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.countText}>{filtered.length} videos</Text>
        </View>

        {/* Workout Cards */}
        <View style={styles.workoutList}>
          {filtered.map(workout => (
            <TouchableOpacity
              key={workout.id}
              style={styles.workoutCard}
              onPress={() => { setSelectedWorkout(workout); setShowModal(true); }}
              activeOpacity={0.85}
            >
              {/* Thumbnail */}
              <View style={styles.thumbnailBox}>
                {workout.thumbnail
                  ? <Image source={{ uri: workout.thumbnail }} style={styles.thumbnail} />
                  : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Ionicons name="videocam-outline" size={32} color={Colors.primary} style={{ opacity: 0.4 }} />
                    </View>
                  )
                }
                {/* Play Button */}
                <View style={styles.playBtn}>
                  <Image source={ICON_PLAY} style={styles.playImg} resizeMode="contain" />
                </View>
                {/* Duration */}
                <View style={styles.durationChip}>
                  <Ionicons name="time-outline" size={10} color="#fff" />
                  <Text style={styles.durationText}>{workout.duration}</Text>
                </View>
              </View>

              {/* Info */}
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutTitle} numberOfLines={2}>{workout.title}</Text>
                <View style={styles.workoutMetaRow}>
                  <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[workout.level] + '22' }]}>
                    <Text style={[styles.levelText, { color: LEVEL_COLORS[workout.level] }]}>{workout.level}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{workout.category}</Text>
                  </View>
                </View>
                <View style={styles.workoutStatsRow}>
                  <View style={styles.workoutStat}>
                    <Ionicons name="flame-outline" size={13} color="#FF9800" />
                    <Text style={styles.workoutStatText}>{workout.calories} kcal</Text>
                  </View>
                  <View style={styles.workoutStat}>
                    <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.workoutStatText}>{workout.duration}</Text>
                  </View>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <VideoModal workout={selectedWorkout} visible={showModal} onClose={() => setShowModal(false)} />
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
  categoryTab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  categoryTabActive:     { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  categoryTabText:       { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted },
  categoryTabTextActive: { color: Colors.primary },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  countText:{ fontSize: Fonts.sizes.sm, color: Colors.textMuted },

  workoutList: { gap: 12 },
  workoutCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', gap: Spacing.sm, paddingRight: Spacing.sm },

  thumbnailBox:        { width: 110, height: 90, position: 'relative' },
  thumbnail:           { width: '100%', height: '100%' },
  thumbnailPlaceholder:{ width: '100%', height: '100%', backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  playBtn:    { position: 'absolute', top: '50%', left: '50%', marginTop: -14, marginLeft: -14, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  playImg:    { width: 12, height: 12 },
  durationChip: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  durationText: { fontSize: 9, color: '#fff', fontWeight: '600' },

  workoutInfo:    { flex: 1, paddingVertical: Spacing.sm, gap: 4 },
  workoutTitle:   { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textDark, lineHeight: 18 },
  workoutMetaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  levelBadge:     { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  levelText:      { fontSize: 10, fontWeight: '700' },
  categoryBadge:  { backgroundColor: Colors.background, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: Colors.border },
  categoryBadgeText:{ fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  workoutStatsRow:{ flexDirection: 'row', gap: Spacing.sm },
  workoutStat:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  workoutStatText:{ fontSize: 11, color: Colors.textMuted },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg + 20, paddingTop: Spacing.sm, gap: Spacing.md },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.sm },
  titleRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title:   { flex: 1, fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark, marginRight: Spacing.sm },
  videoBox:{ height: 180, backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  videoPlaceholderText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  detailText: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
  watchBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 52 },
  watchBtnText:{ fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});