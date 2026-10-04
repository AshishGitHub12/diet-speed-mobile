import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppDispatch } from '@/src/redux/hooks';
import { setHomeData } from '@/src/redux/userSlice';
import api from '@/src/services/api';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICON_BELL       = require('@/assets/icons/Bell.png');
const ICON_CALENDAR   = require('@/assets/icons/calendar.png');
const ICON_WEIGHT     = require('@/assets/icons/weight.png');
const ICON_MEAL       = require('@/assets/icons/meal.png');
const ICON_CHALLENGES = require('@/assets/icons/challenges.png');
const ICON_HEALTH     = require('@/assets/icons/health.png');
const ICON_PLAY       = require('@/assets/icons/play.png');

const CONTENT_BASE = '/content/';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeUserData {
  user: {
    name: string; current_weight: number; target_weight: number; bmi: number; bmi_category: string;
    calories_consumed_today: number; calorie_goal: number;
  };
  date: { today_date: string; day_name: string };
}

interface SuccessStory {
  id: number; name: string; photo_url: string; weight_lost_kg: number | null; duration_text: string;
}
interface ExploreVideo {
  id: number; title: string; subtitle: string; thumbnail_url: string; duration_minutes: number;
}
interface Recipe {
  id: number; title: string; image_url: string; calories: number; prep_time_minutes: number;
}

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
      <TouchableOpacity onPress={onViewMore} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <View style={sectionStyles.viewMoreRow}>
          <Text style={sectionStyles.viewMore}>View More</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </View>
      </TouchableOpacity>
    )}
  </View>
);

const sectionStyles = StyleSheet.create({
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title:        { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark },
  viewMoreRow:  { flexDirection: 'row', alignItems: 'center', gap: 1 },
  viewMore:     { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
});

// ─── Animated Shimmer Skeleton ────────────────────────────────────────────────

const SkeletonCard = ({ width, height }: { width: number; height: number }) => {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={[skeletonStyles.card, { width, height }]}>
      <Animated.View style={[skeletonStyles.shimmer, { opacity: pulse }]} />
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  card:    { borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.primaryMuted },
  shimmer: { flex: 1, backgroundColor: Colors.border },
});

// ─── Fallback visuals (used only if a card has no image yet) ──────────────────

const InitialsAvatar = ({ name, index }: { name: string; index: number }) => {
  const color = STORY_COLORS[index % STORY_COLORS.length];
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <View style={[fallbackStyles.container, { backgroundColor: color + '22' }]}>
      <View style={[fallbackStyles.circle, { backgroundColor: color }]}>
        <Text style={fallbackStyles.initials}>{initials}</Text>
      </View>
    </View>
  );
};

const IconFallback = ({ name }: { name: keyof typeof Ionicons.glyphMap }) => (
  <View style={fallbackStyles.container}>
    <Ionicons name={name} size={32} color={Colors.primary} style={{ opacity: 0.35 }} />
  </View>
);

const fallbackStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primaryMuted },
  circle:    { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  initials:  { fontSize: 20, fontWeight: '800', color: '#fff' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router   = useRouter();
  const dispatch = useAppDispatch();

  const [homeData, setHomeDataLocal] = useState<HomeUserData | null>(null);
  const [stories, setStories]       = useState<SuccessStory[]>([]);
  const [workouts, setWorkouts]     = useState<ExploreVideo[]>([]);
  const [recipes, setRecipes]       = useState<Recipe[]>([]);

  const [isLoading, setIsLoading]             = useState(true);
  const [refreshing, setRefreshing]           = useState(false);
  const [storiesLoading, setStoriesLoading]   = useState(true);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [recipesLoading, setRecipesLoading]   = useState(true);

  const fetchHome = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else {
      setIsLoading(true);
      setStoriesLoading(true);
      setWorkoutsLoading(true);
      setRecipesLoading(true);
    }
    try {
      const [homeRes, storiesRes, workoutsRes, recipesRes] = await Promise.all([
        api.get('/home/'),
        api.get<SuccessStory[]>(`${CONTENT_BASE}success-stories/`, { params: { featured: 'true' } }),
        api.get<ExploreVideo[]>(`${CONTENT_BASE}explore/`, { params: { featured: 'true' } }),
        api.get<Recipe[]>(`${CONTENT_BASE}recipes/`, { params: { featured: 'true' } }),
      ]);
      setHomeDataLocal(homeRes.data);
      dispatch(setHomeData(homeRes.data));
      setStories(storiesRes.data);
      setWorkouts(workoutsRes.data);
      setRecipes(recipesRes.data);
    } catch (e) {
      console.log('❌ Home fetch error:', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setStoriesLoading(false);
      setWorkoutsLoading(false);
      setRecipesLoading(false);
    }
  }, [dispatch]);

  // Refetch every time this screen regains focus — not just on first mount —
  // so logging a new weight in Weight Tracker and navigating back here shows
  // the updated current_weight immediately instead of a stale value.
  useFocusEffect(
    useCallback(() => {
      fetchHome();
    }, [fetchHome])
  );

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
          <SectionHeader title="Tools" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.toolsRow}>
              <TouchableOpacity style={styles.toolCard} onPress={() => router.push('/tools/weight-tracker' as any)}>
                <Text style={styles.toolTitle}>Weight Tracker</Text>
                <Image source={ICON_WEIGHT} style={styles.toolImg} resizeMode="contain" />
                <Text style={styles.toolSub}>
                  {homeData?.user?.current_weight != null
                    ? `Current Weight\n${homeData.user.current_weight} kg`
                    : 'Current Weight\n--'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolCard} onPress={() => router.push('/tools/meal-log' as any)}>
                <Text style={styles.toolTitle}>Meal Log</Text>
                <Image source={ICON_MEAL} style={styles.toolImg} resizeMode="contain" />
                <Text style={styles.toolSub}>
                  {homeData?.user?.calorie_goal != null
                    ? `Today\n${homeData.user.calories_consumed_today}/${homeData.user.calorie_goal} kcal`
                    : 'Today\n--'}
                </Text>
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
            <View style={styles.cardsRow}>
              {storiesLoading
                ? [1, 2, 3].map((i) => <SkeletonCard key={i} width={158} height={212} />)
                : stories.map((story, index) => (
                    <TouchableOpacity
                      key={story.id}
                      style={styles.storyCard}
                      activeOpacity={0.9}
                      onPress={() => router.push('/success-stories')}
                    >
                      {story.photo_url
                        ? <Image source={{ uri: story.photo_url }} style={styles.cardImage} />
                        : <InitialsAvatar name={story.name} index={index} />
                      }
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.75)']}
                        locations={[0.35, 1]}
                        style={styles.cardGradient}
                      >
                        <View style={styles.storyBadge}>
                          <Ionicons name="star" size={10} color="#FFD700" />
                          <Text style={styles.storyBadgeText}>Success</Text>
                        </View>
                        <Text style={styles.storyName} numberOfLines={1}>{story.name}</Text>
                        {story.weight_lost_kg != null && (
                          <Text style={styles.storyResult} numberOfLines={1}>
                            Lost {story.weight_lost_kg}kg {story.duration_text}
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  ))
              }
              {!storiesLoading && stories.length === 0 && (
                <Text style={styles.emptyRowText}>No success stories yet.</Text>
              )}
            </View>
          </ScrollView>
        </View>

        {/* ── Explore / Workouts ── */}
        <View style={styles.section}>
          <SectionHeader title="Explore" onViewMore={() => router.push('/explore')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.cardsRow}>
              {workoutsLoading
                ? [1, 2, 3].map((i) => <SkeletonCard key={i} width={220} height={150} />)
                : workouts.map((workout) => (
                    <TouchableOpacity
                      key={workout.id}
                      style={styles.exploreCard}
                      activeOpacity={0.9}
                      onPress={() => router.push({ pathname: '/explore', params: { videoId: String(workout.id) } })}
                    >
                      {workout.thumbnail_url
                        ? <Image source={{ uri: workout.thumbnail_url }} style={styles.cardImage} />
                        : <IconFallback name="videocam-outline" />
                      }
                      <View style={styles.playBtn}>
                        <Image source={ICON_PLAY} style={styles.playImg} resizeMode="contain" />
                      </View>
                      <View style={styles.durationChip}>
                        <Ionicons name="time-outline" size={11} color="#fff" />
                        <Text style={styles.chipText}>{workout.duration_minutes} min</Text>
                      </View>
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.75)']}
                        locations={[0.4, 1]}
                        style={styles.cardGradient}
                      >
                        <Text style={styles.exploreTitle} numberOfLines={1}>{workout.title}</Text>
                        <View style={styles.exploreMetaRow}>
                          <Ionicons name="barbell-outline" size={11} color="rgba(255,255,255,0.85)" />
                          <Text style={styles.exploreMetaText}>{workout.subtitle || 'Workout Video'}</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))
              }
              {!workoutsLoading && workouts.length === 0 && (
                <Text style={styles.emptyRowText}>No videos yet.</Text>
              )}
            </View>
          </ScrollView>
        </View>

        {/* ── Recipes ── */}
        <View style={styles.section}>
          <SectionHeader title="Recipes" onViewMore={() => router.push('/recipes')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.cardsRow}>
              {recipesLoading
                ? [1, 2, 3].map((i) => <SkeletonCard key={i} width={168} height={180} />)
                : recipes.map((recipe) => (
                    <TouchableOpacity
                      key={recipe.id}
                      style={styles.recipeCard}
                      activeOpacity={0.9}
                      onPress={() => router.push({ pathname: '/recipes', params: { recipeId: String(recipe.id) } })}
                    >
                      {recipe.image_url
                        ? <Image source={{ uri: recipe.image_url }} style={styles.cardImage} />
                        : <IconFallback name="restaurant-outline" />
                      }
                      <View style={styles.calChip}>
                        <Ionicons name="flame-outline" size={11} color="#fff" />
                        <Text style={styles.chipText}>{recipe.calories} cal</Text>
                      </View>
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.75)']}
                        locations={[0.4, 1]}
                        style={styles.cardGradient}
                      >
                        <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
                        <View style={styles.recipeMetaRow}>
                          <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.85)" />
                          <Text style={styles.recipeMetaText}>{recipe.prep_time_minutes} min</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))
              }
              {!recipesLoading && recipes.length === 0 && (
                <Text style={styles.emptyRowText}>No recipes yet.</Text>
              )}
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

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  headerLeft:  {},
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo:        { width: 120, height: 36 },
  iconBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  iconImg:     { width: 20, height: 20 },
  calendarImg: { width: 24, height: 24 },
  avatar:      { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  avatarText:  { fontSize: 16, fontWeight: '700', color: Colors.primary },

  greetingContainer: { marginBottom: Spacing.md },
  greetingHello:     { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  greetingName:      { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.textDark },

  dateCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4,
    marginBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  dateDayName:  { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginBottom: 2 },
  dateFullDate: { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textDark },

  section: { marginBottom: Spacing.lg },

  toolsRow: { flexDirection: 'row', gap: 12, paddingBottom: 4 },
  toolCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, width: 160, height: 160,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
    justifyContent: 'space-between', alignItems: 'center',
  },
  toolImg:   { width: 40, height: 40 },
  toolTitle: { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.primary, lineHeight: 22, textAlign: 'center' },
  toolSub:   { fontSize: Fonts.sizes.sm, color: Colors.textDark, lineHeight: 18, textAlign: 'center' },

  // Shared card row + image + gradient overlay, reused by all three sections.
  cardsRow:    { flexDirection: 'row', gap: 12, paddingBottom: 4 },
  cardImage:   { width: '100%', height: '100%', position: 'absolute' },
  cardGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.sm, paddingTop: Spacing.lg, paddingBottom: Spacing.sm + 2, gap: 3,
  },
  emptyRowText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, paddingVertical: Spacing.lg },

  storyCard: {
    width: 158, height: 212, borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.primaryMuted,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  storyBadge:     { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: BorderRadius.full, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 3 },
  storyBadgeText: { fontSize: 10, color: '#FFD700', fontWeight: '700' },
  storyName:      { fontSize: Fonts.sizes.sm, color: '#fff', fontWeight: '700', lineHeight: 18 },
  storyResult:    { fontSize: 11, color: 'rgba(255,255,255,0.9)', lineHeight: 15, marginTop: 1 },

  exploreCard: {
    width: 220, height: 150, borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.primaryMuted,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  durationChip: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  chipText:     { fontSize: 10, color: '#fff', fontWeight: '600' },
  exploreTitle:   { fontSize: Fonts.sizes.sm, color: '#fff', fontWeight: '700', lineHeight: 18 },
  exploreMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exploreMetaText:{ fontSize: 11, color: 'rgba(255,255,255,0.85)' },

  recipeCard: {
    width: 168, height: 180, borderRadius: BorderRadius.lg, overflow: 'hidden', backgroundColor: Colors.primaryMuted,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  calChip:     { position: 'absolute', top: Spacing.sm, right: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  recipeTitle:   { fontSize: Fonts.sizes.sm, color: '#fff', fontWeight: '700', lineHeight: 18 },
  recipeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recipeMetaText:{ fontSize: 11, color: 'rgba(255,255,255,0.85)' },

  playBtn: {
    position: 'absolute', top: '50%', left: '50%', marginTop: -18, marginLeft: -18, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  playImg: { width: 16, height: 16 },
});