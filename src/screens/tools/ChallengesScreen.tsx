import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Static Data ──────────────────────────────────────────────────────────────

const CHALLENGES = [
  {
    id: '1',
    title: '7-Day Water Challenge',
    description: 'Drink 8 glasses of water every day for 7 days.',
    icon: '💧',
    duration: '7 days',
    difficulty: 'Easy',
    participants: 1240,
    joined: false,
  },
  {
    id: '2',
    title: '30-Day Weight Loss',
    description: 'Follow a structured diet and workout plan to lose weight in 30 days.',
    icon: '⚖️',
    duration: '30 days',
    difficulty: 'Medium',
    participants: 3560,
    joined: false,
  },
  {
    id: '3',
    title: '10K Steps Daily',
    description: 'Walk at least 10,000 steps every day for 14 days.',
    icon: '👟',
    duration: '14 days',
    difficulty: 'Medium',
    participants: 2890,
    joined: false,
  },
  {
    id: '4',
    title: 'No Sugar Week',
    description: 'Avoid all added sugars for 7 days. Reset your cravings!',
    icon: '🚫',
    duration: '7 days',
    difficulty: 'Hard',
    participants: 987,
    joined: false,
  },
  {
    id: '5',
    title: 'Morning Workout',
    description: 'Complete a 20-minute workout every morning for 21 days.',
    icon: '🏋️',
    duration: '21 days',
    difficulty: 'Medium',
    participants: 1450,
    joined: false,
  },
  {
    id: '6',
    title: 'Protein Goal',
    description: 'Hit your daily protein target every day for 14 days.',
    icon: '🥩',
    duration: '14 days',
    difficulty: 'Easy',
    participants: 2100,
    joined: false,
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:   '#4CAF50',
  Medium: '#FF9800',
  Hard:   '#F44336',
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChallengesScreen() {
  const router = useRouter();
  const [challenges, setChallenges] = useState(CHALLENGES);
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'Easy', 'Medium', 'Hard'];
  const joined = challenges.filter(c => c.joined);

  const filtered = activeFilter === 'All'
    ? challenges
    : challenges.filter(c => c.difficulty === activeFilter);

  const toggleJoin = (id: string) => {
    setChallenges(prev => prev.map(c =>
      c.id === id ? { ...c, joined: !c.joined } : c
    ));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Challenges</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Joined summary */}
        {joined.length > 0 && (
          <View style={styles.joinedCard}>
            <Text style={styles.joinedTitle}>🏆 Active Challenges</Text>
            <Text style={styles.joinedCount}>{joined.length} challenge{joined.length > 1 ? 's' : ''} in progress</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.joinedRow}>
                {joined.map(c => (
                  <View key={c.id} style={styles.joinedChip}>
                    <Text style={styles.joinedChipIcon}>{c.icon}</Text>
                    <Text style={styles.joinedChipText}>{c.title}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {filters.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Challenge cards */}
        <View style={styles.challengesList}>
          {filtered.map(challenge => (
            <View key={challenge.id} style={styles.challengeCard}>
              <View style={styles.challengeTop}>
                <View style={styles.challengeIconWrapper}>
                  <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <View style={styles.challengeMeta}>
                    <Text style={styles.challengeDuration}>⏱ {challenge.duration}</Text>
                    <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[challenge.difficulty] + '20' }]}>
                      <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[challenge.difficulty] }]}>
                        {challenge.difficulty}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <Text style={styles.challengeDesc}>{challenge.description}</Text>

              <View style={styles.challengeBottom}>
                <Text style={styles.participants}>
                  👥 {challenge.participants.toLocaleString()} joined
                </Text>
                <TouchableOpacity
                  style={[styles.joinBtn, challenge.joined && styles.joinBtnActive]}
                  onPress={() => toggleJoin(challenge.id)}
                >
                  <Text style={[styles.joinText, challenge.joined && styles.joinTextActive]}>
                    {challenge.joined ? '✓ Joined' : 'Join Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryMuted,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },

  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  // Joined
  joinedCard: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, gap: 8,
  },
  joinedTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  joinedCount: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.8)' },
  joinedRow: { flexDirection: 'row', gap: 8 },
  joinedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  joinedChipIcon: { fontSize: 14 },
  joinedChipText: { fontSize: 12, color: Colors.white, fontWeight: '500' },

  // Filters
  filterScroll: { marginBottom: Spacing.md },
  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  filterTextActive: { color: Colors.white, fontWeight: '600' },

  // Cards
  challengesList: { gap: 12 },
  challengeCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
    padding: Spacing.md, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  challengeTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  challengeIconWrapper: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  challengeIcon: { fontSize: 24 },
  challengeInfo: { flex: 1, gap: 4 },
  challengeTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  challengeMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  challengeDuration: { fontSize: 12, color: Colors.textMuted },
  diffBadge: { borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  diffText: { fontSize: 11, fontWeight: '600' },
  challengeDesc: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, lineHeight: 20 },
  challengeBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  participants: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  joinBtn: {
    backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.full,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  joinBtnActive: { backgroundColor: Colors.primary },
  joinText: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
  joinTextActive: { color: Colors.white },
});