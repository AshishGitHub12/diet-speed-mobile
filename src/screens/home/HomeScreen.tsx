import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { setHomeData } from '@/src/redux/userSlice';
import api from '@/src/services/api';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICON_BELL       = require('@/assets/icons/bell.png');
const ICON_CALENDAR   = require('@/assets/icons/calendar.png');
const ICON_WEIGHT     = require('@/assets/icons/weight.png');
const ICON_MEAL       = require('@/assets/icons/meal.png');
const ICON_CHALLENGES = require('@/assets/icons/challenges.png');
const ICON_HEALTH     = require('@/assets/icons/health.png');
const ICON_PLAY       = require('@/assets/icons/play.png');

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeData {
  user: { name: string; current_weight: number; target_weight: number; bmi: number; bmi_category: string };
  date: { today_date: string; day_name: string };
  success_stories: { id: number; name: string; result: string; image: string }[];
  recipes: { id: number; name: string; image: string; calories: number }[];
  workouts: { id: number; title: string; thumbnail: string; video_url: string; duration: string }[];
}

// ─── Dummy Data (used when API returns empty) ─────────────────────────────────

const DUMMY_STORIES = [
  { id: 1, name: 'Rahul',  result: 'Lost 10kg in 3 months',  image: '' },
  { id: 2, name: 'Neha',   result: 'Lost 8kg in 2 months',   image: '' },
  { id: 3, name: 'Arjun',  result: 'Lost 15kg in 5 months',  image: '' },
  { id: 4, name: 'Priya',  result: 'Lost 6kg in 6 weeks',    image: '' },
];

const DUMMY_WORKOUTS = [
  { id: 1, title: 'Full Body Workout',    thumbnail: '', video_url: '', duration: '30 min' },
  { id: 2, title: 'Morning Yoga Flow',    thumbnail: '', video_url: '', duration: '20 min' },
  { id: 3, title: 'HIIT Cardio Blast',    thumbnail: '', video_url: '', duration: '25 min' },
  { id: 4, title: 'Core Strength',        thumbnail: '', video_url: '', duration: '15 min' },
];

const DUMMY_RECIPES = [
  { id: 1, name: 'Oats Smoothie Bowl',    image: '', calories: 320 },
  { id: 2, name: 'Grilled Chicken Salad', image: '', calories: 410 },
  { id: 3, name: 'Avocado Toast',         image: '', calories: 280 },
  { id: 4, name: 'Protein Pancakes',      image: '', calories: 350 },
];

// Story avatar colors for placeholder
const STORY_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#E05C5C'];

// ─── Date helpers ─────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getFullYear()}`;
};

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({ title, onViewMore }: { title: string; onViewMore?: () => void }) => (
  <View style={sectionStyles.row}>
    <Text style={sectionStyles.title}>{title}</Text>
    {onViewMore && (
      <TouchableOpacity onPress={onViewMore}>
        <Text style={sectionStyles.viewMore}>View More</Text>
      </TouchableOpacity>
    )}
  </View>
);

const sectionStyles = StyleSheet.create({
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title:    { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  viewMore: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '500' },
});

// ─── Skeleton Card ────────────────────────────────────────────────────────────

const SkeletonCard = ({ width, height }: { width: number; height: number }) => {
  const [opacity] = useState(0.5);
  return (
    <View style={[skeletonStyles.card, { width, height }]}>
      <View style={skeletonStyles.shimmer} />
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  card:    { borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.primaryMuted },
  shimmer: { flex: 1, backgroundColor: Colors.border, opacity: 0.6 },
});

// ─── Story Placeholder ────────────────────────────────────────────────────────

const StoryPlaceholder = ({ name, index }: { name: string; index: number }) => {
  const color = STORY_COLORS[index % STORY_COLORS.length];
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <View style={[placeholderStyles.container, { backgroundColor: color + '22' }]}>
      <View style={[placeholderStyles.circle, { backgroundColor: color }]}>
        <Text style={placeholderStyles.initials}>{initials}</Text>
      </View>
      <Ionicons name="person-outline" size={32} color={color} style={{ opacity: 0.3, position: 'absolute' }} />
    </View>
  );
};

const placeholderStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  circle:    { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  initials:  { fontSize: 20, fontWeight: '800', color: '#fff' },
});

// ─── Workout Placeholder ──────────────────────────────────────────────────────

const WorkoutPlaceholder = () => (
  <View style={workoutPlaceholderStyles.container}>
    <Ionicons name="videocam-outline" size={36} color={Colors.primary} style={{ opacity: 0.4 }} />
  </View>
);

const workoutPlaceholderStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primaryMuted },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const [homeData, setHomeDataLocal]     = useState<HomeData | null>(null);
  const [isLoading, setIsLoading]        = useState(true);
  const [refreshing, setRefreshing]      = useState(false);
  const [storiesLoading, setStoriesLoading]   = useState(true);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [recipesLoading, setRecipesLoading]   = useState(true);

  const fetchHome = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/home/');
      setHomeDataLocal(res.data);
      dispatch(setHomeData(res.data));
    } catch (e) {
      console.log('❌ Home fetch error:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      // Stagger skeleton removal for natural feel
      setTimeout(() => setStoriesLoading(false),  400);
      setTimeout(() => setWorkoutsLoading(false),  700);
      setTimeout(() => setRecipesLoading(false),  1000);
    }
  };

  useEffect(() => { fetchHome(); }, []);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Use API data if available, fallback to dummy data
  const stories  = homeData?.success_stories?.length  ? homeData.success_stories  : DUMMY_STORIES;
  const workouts = homeData?.workouts?.length          ? homeData.workouts          : DUMMY_WORKOUTS;
  const recipes  = homeData?.recipes?.length           ? homeData.recipes           : DUMMY_RECIPES;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchHome(true)} tintColor={Colors.primary} />
        }
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
              <Image source={ICON_BELL} style={styles.iconImg} resizeMode="contain" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {homeData?.user?.name?.[0]?.toUpperCase() ?? 'U'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Greeting ── */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingHello}>Hello!</Text>
          <Text style={styles.greetingName}>{homeData?.user?.name ?? 'User'}</Text>
        </View>

        {/* ── Date Card ── */}
        <View style={styles.dateCard}>
          <View>
            <Text style={styles.dateDayName}>{homeData?.date?.day_name ?? ''}</Text>
            <Text style={styles.dateFullDate}>
              {homeData ? formatDate(homeData.date.today_date) : ''}
            </Text>
          </View>
          <Image source={ICON_CALENDAR} style={styles.calendarImg} resizeMode="contain" />
        </View>

        {/* ── Tools ── */}
        <View style={styles.section}>
          <SectionHeader title="Tools" onViewMore={() => {}} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.toolsRow}>
              <TouchableOpacity style={styles.toolCard} onPress={() => router.push('/tools/weight-tracker' as any)}>
                <Text style={styles.toolTitle}>Weight Tracker</Text>
                <Image source={ICON_WEIGHT} style={styles.toolImg} resizeMode="contain" />
                <Text style={styles.toolSub}>
                  {homeData?.user?.current_weight ? `${homeData.user.current_weight} kg` : 'Current Weight\n--'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolCard} onPress={() => router.push('/tools/meal-log' as any)}>
                <Text style={styles.toolTitle}>Meal Log</Text>
                <Image source={ICON_MEAL} style={styles.toolImg} resizeMode="contain" />
                <Text style={styles.toolSub}>Your Daily Diet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolCard} onPress={() => router.push('/tools/challenges' as any)}>
                <Text style={styles.toolTitle}>Challenges</Text>
                <Image source={ICON_CHALLENGES} style={styles.toolImg} resizeMode="contain" />
                <Text style={styles.toolSub}>Join Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolCard} onPress={() => router.push('/tools/health-tracker' as any)}>
                <Text style={styles.toolTitle}>Health Tracker</Text>
                <Image source={ICON_HEALTH} style={styles.toolImg} resizeMode="contain" />
                <Text style={styles.toolSub}>Join Now</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* ── Success Stories ── */}
        <View style={styles.section}>
          <SectionHeader title="Success Stories" onViewMore={() => router.push('/success-stories')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.storiesRow}>
              {storiesLoading
                ? [1, 2, 3].map(i => <SkeletonCard key={i} width={160} height={210} />)
                : stories.map((story, index) => (
                    <TouchableOpacity key={story.id} style={styles.storyCard} activeOpacity={0.85}>
                      {/* Image or Placeholder */}
                      {story.image
                        ? <Image source={{ uri: story.image }} style={styles.storyImage} />
                        : <StoryPlaceholder name={story.name} index={index} />
                      }
                      {/* Gradient Overlay */}
                      <View style={styles.storyOverlay}>
                        <View style={styles.storyBadge}>
                          <Ionicons name="star" size={10} color="#FFD700" />
                          <Text style={styles.storyBadgeText}>Success</Text>
                        </View>
                        <Text style={styles.storyName} numberOfLines={1}>{story.name}</Text>
                        <Text style={styles.storyResult} numberOfLines={2}>{story.result}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
              }
            </View>
          </ScrollView>
        </View>

        {/* ── Explore / Workouts ── */}
        <View style={styles.section}>
          <SectionHeader title="Explore" onViewMore={() => router.push('/explore')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.exploreRow}>
              {workoutsLoading
                ? [1, 2, 3].map(i => <SkeletonCard key={i} width={220} height={150} />)
                : workouts.map(workout => (
                    <TouchableOpacity key={workout.id} style={styles.exploreCard} activeOpacity={0.85}>
                      {/* Thumbnail or placeholder */}
                      {workout.thumbnail
                        ? <Image source={{ uri: workout.thumbnail }} style={styles.exploreImage} />
                        : <WorkoutPlaceholder />
                      }
                      {/* Play Button */}
                      <View style={styles.playBtn}>
                        <Image source={ICON_PLAY} style={styles.playImg} resizeMode="contain" />
                      </View>
                      {/* Duration Chip */}
                      <View style={styles.durationChip}>
                        <Ionicons name="time-outline" size={11} color="#fff" />
                        <Text style={styles.durationText}>{workout.duration}</Text>
                      </View>
                      {/* Bottom Overlay */}
                      <View style={styles.exploreOverlay}>
                        <Text style={styles.exploreTitle} numberOfLines={1}>{workout.title}</Text>
                        <View style={styles.exploreMetaRow}>
                          <Ionicons name="barbell-outline" size={11} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.exploreMetaText}>Workout Video</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
              }
            </View>
          </ScrollView>
        </View>

        {/* ── Recipes ── */}
        <View style={styles.section}>
          <SectionHeader title="Recipes" onViewMore={() => router.push('/recipes')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.recipesRow}>
              {recipesLoading
                ? [1, 2, 3].map(i => <SkeletonCard key={i} width={170} height={180} />)
                : recipes.map(recipe => (
                    <TouchableOpacity key={recipe.id} style={styles.recipeCard} activeOpacity={0.85}>
                      {/* Image or Placeholder */}
                      {recipe.image
                        ? <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
                        : (
                          <View style={styles.recipePlaceholder}>
                            <Ionicons name="restaurant-outline" size={36} color={Colors.primary} style={{ opacity: 0.4 }} />
                          </View>
                        )
                      }
                      {/* Play Button */}
                      <View style={styles.playBtn}>
                        <Image source={ICON_PLAY} style={styles.playImg} resizeMode="contain" />
                      </View>
                      {/* Calorie Chip */}
                      <View style={styles.calChip}>
                        <Ionicons name="flame-outline" size={11} color="#fff" />
                        <Text style={styles.calChipText}>{recipe.calories} cal</Text>
                      </View>
                      {/* Bottom Overlay */}
                      <View style={styles.recipeOverlay}>
                        <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.name}</Text>
                        <View style={styles.recipeMetaRow}>
                          <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.recipeMetaText}>Watch Recipe</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
              }
            </View>
          </ScrollView>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.background },
  loader:        { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md },

  // Header — unchanged
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  headerLeft:  {},
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo:        { width: 120, height: 36 },
  iconBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  iconImg:     { width: 20, height: 20 },
  calendarImg: { width: 24, height: 24 },
  avatar:      { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  avatarText:  { fontSize: 16, fontWeight: '700', color: Colors.primary },

  // Greeting — unchanged
  greetingContainer: { marginBottom: Spacing.md },
  greetingHello:     { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  greetingName:      { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.textDark },

  // Date card — unchanged
  dateCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4, marginBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  dateDayName:  { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginBottom: 2 },
  dateFullDate: { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textDark },

  // Sections
  section: { marginBottom: Spacing.lg },

  // Tools — unchanged
  toolsRow: { flexDirection: 'row', gap: 12, paddingBottom: 4 },
  toolCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, width: 160, height: 160, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4, justifyContent: 'space-between', alignItems: 'center' },
  toolImg:   { width: 40, height: 40 },
  toolTitle: { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.primary, lineHeight: 22, textAlign: 'center' },
  toolSub:   { fontSize: Fonts.sizes.sm, color: Colors.textDark, lineHeight: 18, textAlign: 'center' },

  // ── Success Stories (FIXED) ──
  storiesRow: { flexDirection: 'row', gap: 12, paddingBottom: 4 },
  storyCard:  { width: 160, height: 210, borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.primaryMuted },
  storyImage: { width: '100%', height: '100%', position: 'absolute' },
  storyOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: Spacing.sm, gap: 3,
    paddingBottom: Spacing.sm + 2,
  },
  storyBadge:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
  storyBadgeText: { fontSize: 10, color: '#FFD700', fontWeight: '700' },
  storyName:      { fontSize: Fonts.sizes.sm, color: '#fff', fontWeight: '700', lineHeight: 18 },
  storyResult:    { fontSize: 11, color: 'rgba(255,255,255,0.85)', lineHeight: 15, marginTop: 1 },

  // ── Explore / Workouts (FIXED) ──
  exploreRow:  { flexDirection: 'row', gap: 12, paddingBottom: 4 },
  exploreCard: { width: 220, height: 150, borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.primaryMuted },
  exploreImage: { width: '100%', height: '100%', position: 'absolute' },
  durationChip: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  durationText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  exploreOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: Spacing.sm, gap: 3 },
  exploreTitle:   { fontSize: Fonts.sizes.sm, color: '#fff', fontWeight: '700', lineHeight: 18 },
  exploreMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exploreMetaText:{ fontSize: 11, color: 'rgba(255,255,255,0.8)' },

  // ── Recipes (FIXED) ──
  recipesRow:  { flexDirection: 'row', gap: 12, paddingBottom: 4 },
  recipeCard:  { width: 170, height: 180, borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.primaryMuted },
  recipeImage: { width: '100%', height: '100%', position: 'absolute' },
  recipePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primaryMuted },
  calChip:     { position: 'absolute', top: Spacing.sm, right: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  calChipText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  recipeOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: Spacing.sm, gap: 3 },
  recipeTitle:   { fontSize: Fonts.sizes.sm, color: '#fff', fontWeight: '700', lineHeight: 18 },
  recipeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recipeMetaText:{ fontSize: 11, color: 'rgba(255,255,255,0.8)' },

  // Play button — same position logic, slightly improved
  playBtn:  { position: 'absolute', top: '50%', left: '50%', marginTop: -18, marginLeft: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  playImg:  { width: 16, height: 16 },
});