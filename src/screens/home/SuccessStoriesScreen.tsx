import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Modal, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - 12) / 2;

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const STORIES = [
  { id: 1,  name: 'Rahul Sharma',  result: 'Lost 10kg',  duration: '3 months',  weight_before: 85, weight_after: 75, age: 28, quote: 'Diet Speed changed my life completely. The meal plans were easy to follow!', color: '#4CAF50' },
  { id: 2,  name: 'Neha Gupta',    result: 'Lost 8kg',   duration: '2 months',  weight_before: 68, weight_after: 60, age: 24, quote: 'I never thought I could lose weight this fast without starving myself.', color: '#2196F3' },
  { id: 3,  name: 'Arjun Mehta',   result: 'Lost 15kg',  duration: '5 months',  weight_before: 95, weight_after: 80, age: 32, quote: 'The workout and diet combination is unbeatable. Highly recommend!', color: '#FF9800' },
  { id: 4,  name: 'Priya Singh',   result: 'Lost 6kg',   duration: '6 weeks',   weight_before: 62, weight_after: 56, age: 26, quote: 'Finally found something that works for my busy schedule.', color: '#9C27B0' },
  { id: 5,  name: 'Vikram Joshi',  result: 'Lost 12kg',  duration: '4 months',  weight_before: 90, weight_after: 78, age: 35, quote: 'The AI coach feature is a game changer. It keeps me motivated daily.', color: '#E05C5C' },
  { id: 6,  name: 'Anjali Patel',  result: 'Lost 9kg',   duration: '3 months',  weight_before: 72, weight_after: 63, age: 29, quote: 'Best investment I ever made in my health. Worth every rupee!', color: '#00BCD4' },
  { id: 7,  name: 'Rohan Das',     result: 'Lost 18kg',  duration: '6 months',  weight_before: 100, weight_after: 82, age: 31, quote: 'From 100kg to 82kg — I feel like a completely new person.', color: '#795548' },
  { id: 8,  name: 'Kavya Nair',    result: 'Lost 5kg',   duration: '5 weeks',   weight_before: 58, weight_after: 53, age: 22, quote: 'Loved how the app tracks everything for me. So easy to use!', color: '#607D8B' },
];

const STORY_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#E05C5C', '#00BCD4', '#795548', '#607D8B'];

// ─── Detail Modal ─────────────────────────────────────────────────────────────

const StoryDetailModal = ({ story, visible, onClose }: {
  story: typeof STORIES[0] | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!story) return null;
  const initials = story.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />

          {/* Avatar */}
          <View style={[m.avatar, { backgroundColor: story.color }]}>
            <Text style={m.avatarText}>{initials}</Text>
          </View>

          <Text style={m.name}>{story.name}</Text>
          <Text style={m.age}>Age {story.age}</Text>

          {/* Stats */}
          <View style={m.statsRow}>
            <View style={m.statCard}>
              <Text style={m.statVal}>{story.weight_before} kg</Text>
              <Text style={m.statLabel}>Before</Text>
            </View>
            <View style={[m.statCard, m.statCardCenter]}>
              <View style={m.lostBadge}>
                <Ionicons name="trending-down-outline" size={16} color="#4CAF50" />
                <Text style={m.lostVal}>{story.result}</Text>
              </View>
              <Text style={m.statLabel}>Lost</Text>
            </View>
            <View style={m.statCard}>
              <Text style={m.statVal}>{story.weight_after} kg</Text>
              <Text style={m.statLabel}>After</Text>
            </View>
          </View>

          {/* Duration */}
          <View style={m.durationRow}>
            <Ionicons name="time-outline" size={16} color={Colors.primary} />
            <Text style={m.durationText}>Achieved in {story.duration}</Text>
          </View>

          {/* Quote */}
          <View style={m.quoteBox}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
            <Text style={m.quoteText}>"{story.quote}"</Text>
          </View>

          <TouchableOpacity style={m.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={m.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SuccessStoriesScreen() {
  const router = useRouter();
  const [selectedStory, setSelectedStory] = useState<typeof STORIES[0] | null>(null);
  const [showModal, setShowModal]         = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Success Stories</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconBox}>
            <Ionicons name="trophy-outline" size={28} color={Colors.primary} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Real People, Real Results</Text>
            <Text style={styles.bannerSub}>Tap any card to read their full story</Text>
          </View>
        </View>

        {/* Stats Strip */}
        <View style={styles.statsStrip}>
          {[
            { val: '10K+', label: 'Members',   icon: 'people-outline'        as const },
            { val: '4.8★', label: 'Rating',    icon: 'star-outline'          as const },
            { val: '95%',  label: 'Success',   icon: 'checkmark-circle-outline' as const },
          ].map((s, i) => (
            <View key={i} style={styles.stripStat}>
              <Ionicons name={s.icon} size={18} color={Colors.primary} />
              <Text style={styles.stripVal}>{s.val}</Text>
              <Text style={styles.stripLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {STORIES.map((story, index) => {
            const initials = story.name.split(' ').map(n => n[0]).join('').toUpperCase();
            return (
              <TouchableOpacity
                key={story.id}
                style={styles.storyCard}
                onPress={() => { setSelectedStory(story); setShowModal(true); }}
                activeOpacity={0.85}
              >
                {/* Placeholder avatar */}
                <View style={[styles.storyAvatarBg, { backgroundColor: story.color + '22' }]}>
                  <View style={[styles.storyAvatar, { backgroundColor: story.color }]}>
                    <Text style={styles.storyAvatarText}>{initials}</Text>
                  </View>
                </View>

                {/* Overlay */}
                <View style={styles.storyOverlay}>
                  <View style={styles.storyBadge}>
                    <Ionicons name="star" size={9} color="#FFD700" />
                    <Text style={styles.storyBadgeText}>Success</Text>
                  </View>
                  <Text style={styles.storyName} numberOfLines={1}>{story.name}</Text>
                  <Text style={styles.storyResult} numberOfLines={1}>{story.result} · {story.duration}</Text>
                </View>

                {/* Arrow */}
                <View style={styles.arrowBtn}>
                  <Ionicons name="arrow-forward" size={12} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CTA */}
        <View style={styles.ctaCard}>
          <Ionicons name="heart-outline" size={24} color={Colors.primary} />
          <Text style={styles.ctaText}>Your story could inspire others!</Text>
          <Text style={styles.ctaSub}>Start your journey today and share your transformation.</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <StoryDetailModal story={selectedStory} visible={showModal} onClose={() => setShowModal(false)} />
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

  statsStrip: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, justifyContent: 'space-around' },
  stripStat:  { alignItems: 'center', gap: 4 },
  stripVal:   { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.textDark },
  stripLabel: { fontSize: 11, color: Colors.textMuted },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.md },
  storyCard: { width: CARD_WIDTH, height: 200, borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.primaryMuted },
  storyAvatarBg:   { flex: 1, justifyContent: 'center', alignItems: 'center' },
  storyAvatar:     { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  storyAvatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  storyOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: Spacing.sm, gap: 2, paddingBottom: Spacing.sm + 2 },
  storyBadge:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  storyBadgeText: { fontSize: 10, color: '#FFD700', fontWeight: '700' },
  storyName:      { fontSize: Fonts.sizes.sm, color: '#fff', fontWeight: '700' },
  storyResult:    { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  arrowBtn: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },

  ctaCard: { backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: Colors.primary },
  ctaText: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary, textAlign: 'center' },
  ctaSub:  { fontSize: Fonts.sizes.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: Spacing.lg + 20, alignItems: 'center', gap: Spacing.md },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, marginBottom: Spacing.sm },
  avatar:  { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  name:    { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.textDark },
  age:     { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: -8 },
  statsRow:       { flexDirection: 'row', width: '100%', gap: 8 },
  statCard:       { flex: 1, backgroundColor: Colors.background, borderRadius: BorderRadius.lg, padding: Spacing.sm, alignItems: 'center', gap: 4 },
  statCardCenter: { backgroundColor: Colors.primaryMuted },
  statVal:        { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.textDark },
  statLabel:      { fontSize: 11, color: Colors.textMuted },
  lostBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lostVal:   { fontSize: Fonts.sizes.lg, fontWeight: '800', color: '#4CAF50' },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  durationText:{ fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '600' },
  quoteBox:  { backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', width: '100%' },
  quoteText: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.textDark, lineHeight: 20, fontStyle: 'italic' },
  closeBtn:  { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 52, width: '100%', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});