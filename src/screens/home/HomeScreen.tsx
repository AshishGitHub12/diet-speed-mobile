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
import Svg, { Circle } from 'react-native-svg';
import { useAppDispatch } from '@/src/redux/hooks';
import { setHomeData } from '@/src/redux/userSlice';
import api from '@/src/services/api';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICON_WEIGHT     = require('@/assets/icons/weight.png');
const ICON_MEAL       = require('@/assets/icons/meal.png');
const ICON_CHALLENGES = require('@/assets/icons/challenges.png');

const CONTENT_BASE = '/content/';

// ─── Palette ──────────────────────────────────────────────────────────────────
// Everything here is derived from your real theme (Colors.primary /
// primaryLight / primaryMuted). The two extra hues — a muted plum for
// Challenges and a soft teal for Workouts — sit next to your greens the same
// way Meal Log's gold does, so the four tool cards read as a set.

const Accent = {
  gold:  '#B9892E', // Meal Log
  plum:  '#6E5A8C', // Challenges
  teal:  '#3E7CA6', // Workouts
  berry: '#8B3A42', // Success Stories
};

const Tint = {
  mint:   '#E1EEDD', // primary family
  peach:  '#F5E6D3', // gold family
  lilac:  '#E7E2F0', // plum family
  sky:    '#DCEAF2', // teal family
};

// A single signature shape for every card in the app: one corner rounds
// further than the rest, instead of the uniform rounded-rectangle default.
const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeUserData {
  user: {
    name: string; current_weight: number; target_weight: number; bmi: number; bmi_category: string;
    calories_consumed_today: number; calorie_goal: number;
  };
  date: { today_date: string; day_name: string };
}

interface SuccessStory {
  id: number; name: string; photo_url: string; weight_lost_kg: number | null; duration_text: string; testimonial?: string;
}
interface ExploreVideo {
  id: number; title: string; subtitle: string; thumbnail_url: string; duration_minutes: number; category?: string;
}
interface Recipe {
  id: number; title: string; image_url: string; calories: number; prep_time_minutes: number;
}

const TINT_CYCLE = [Tint.mint, Tint.peach, Tint.lilac, Tint.sky];
const STORY_ACCENTS = [Colors.primary, Accent.gold, Accent.plum, Accent.teal, Accent.berry];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('en-US', { weekday: 'short' })}, ${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// ─── Calorie ring ─────────────────────────────────────────────────────────────

const RING_SIZE = 78;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const CalorieRing = ({ ratio }: { ratio: number }) => (
  <View style={{ width: RING_SIZE, height: RING_SIZE, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={RING_SIZE} height={RING_SIZE}>
      <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} stroke="rgba(255,255,255,0.18)" strokeWidth={RING_STROKE} fill="none" />
      <Circle
        cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
        stroke="#B9F24C" strokeWidth={RING_STROKE} fill="none"
        strokeDasharray={`${RING_CIRCUMFERENCE}, ${RING_CIRCUMFERENCE}`}
        strokeDashoffset={RING_CIRCUMFERENCE * (1 - ratio)}
        strokeLinecap="round"
        rotation="-90"
        originX={RING_SIZE / 2}
        originY={RING_SIZE / 2}
      />
    </Svg>
    <View style={styles.ringCenter} pointerEvents="none" />
  </View>
);

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({
  icon, iconTint, title, subtitle, onViewMore,
}: { icon: keyof typeof Ionicons.glyphMap; iconTint: string; title: string; subtitle: string; onViewMore?: () => void }) => (
  <View style={sectionStyles.row}>
    <View style={sectionStyles.titleRow}>
      <View style={[sectionStyles.iconChip, { backgroundColor: iconTint }]}>
        <Ionicons name={icon} size={16} color={Colors.primary} />
      </View>
      <View>
        <Text style={sectionStyles.title}>{title}</Text>
        <Text style={sectionStyles.subtitle}>{subtitle}</Text>
      </View>
    </View>
    {onViewMore && (
      <TouchableOpacity onPress={onViewMore} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={sectionStyles.viewMorePill}>
        <Text style={sectionStyles.viewMore}>View All</Text>
        <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
      </TouchableOpacity>
    )}
  </View>
);

const sectionStyles = StyleSheet.create({
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  titleRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconChip:     { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  title:        { fontSize: 16, fontWeight: '800', color: Colors.textDark, letterSpacing: -0.2 },
  subtitle:     { fontSize: 11.5, color: Colors.textMuted, fontWeight: '600', marginTop: 1 },
  viewMorePill: { flexDirection: 'row', alignItems: 'center', gap: 1, paddingVertical: 4, paddingLeft: 10 },
  viewMore:     { fontSize: 12.5, color: Colors.primary, fontWeight: '700' },
});

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────

const SkeletonCard = ({ width, height }: { width: number; height: number }) => {
  const pulse = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <View style={[skeletonStyles.card, leafRadius(BorderRadius.lg), { width, height }]}>
      <Animated.View style={[skeletonStyles.shimmer, { opacity: pulse }]} />
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  card:    { overflow: 'hidden', backgroundColor: Colors.primaryMuted },
  shimmer: { flex: 1, backgroundColor: Colors.border },
});

const InitialsAvatar = ({ name, index }: { name: string; index: number }) => {
  const color = STORY_ACCENTS[index % STORY_ACCENTS.length];
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <View style={[avatarStyles.circle, { backgroundColor: color }]}>
      <Text style={avatarStyles.initials}>{initials}</Text>
    </View>
  );
};

const avatarStyles = StyleSheet.create({
  circle:   { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  initials: { fontSize: 18, fontWeight: '800', color: '#fff' },
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

  const caloriesEaten = homeData?.user?.calories_consumed_today ?? 0;
  const calorieGoal   = homeData?.user?.calorie_goal ?? 0;
  const calorieRatio  = calorieGoal > 0 ? Math.min(caloriesEaten / calorieGoal, 1) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchHome(true)} tintColor={Colors.primary} />}
      >
        {/* ── Header ── */}
        <View style={styles.topRow}>
          <View style={styles.badgePill}>
            <Ionicons name="leaf" size={12} color={Colors.primary} />
            <Text style={styles.badgeText}>Diet Speed</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={20} color={Colors.textDark} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingLine}>
              {getGreeting()}, <Text style={styles.greetingName}>{homeData?.user?.name ?? 'there'}</Text> 👋
            </Text>
            <Text style={styles.greetingSub}>Small steps every day lead to big results. Keep going!</Text>
          </View>
          <View style={styles.datePill}>
            <Ionicons name="calendar-outline" size={13} color={Colors.primary} />
            <Text style={styles.datePillText}>{homeData ? formatDate(homeData.date.today_date) : ''}</Text>
          </View>
        </View>

        {/* ── Daily calories card ── */}
        <View style={[styles.calorieCard, leafRadius(BorderRadius.xl)]}>
          <View style={styles.calorieBlobA} pointerEvents="none" />
          <View style={styles.calorieTopRow}>
            <CalorieRing ratio={calorieRatio} />
            <View style={styles.calorieCenterNum} pointerEvents="none">
              <Text style={styles.calorieBigNum}>{caloriesEaten}</Text>
              <Text style={styles.calorieBigLabel}>kcal</Text>
            </View>
            <View style={styles.calorieInfo}>
              <Text style={styles.calorieInfoLabel}>Daily Calories</Text>
              <Text style={styles.calorieInfoValue}>
                {caloriesEaten} <Text style={styles.calorieInfoGoal}>/ {calorieGoal || '--'} kcal</Text>
              </Text>
              <View style={styles.calorieTrack}>
                <View style={[styles.calorieFill, { width: `${calorieRatio * 100}%` }]} />
              </View>
            </View>
          </View>

          <View style={styles.statChipsRow}>
            <View style={styles.statChip}>
              <View style={[styles.statChipDot, { backgroundColor: '#B9F24C' }]} />
              <Text style={styles.statChipLabel}>Weight</Text>
              <Text style={styles.statChipValue}>
                {homeData?.user?.current_weight != null ? `${homeData.user.current_weight} kg` : '--'}
              </Text>
            </View>
            <View style={styles.statChipDivider} />
            <View style={styles.statChip}>
              <View style={[styles.statChipDot, { backgroundColor: '#FFC56B' }]} />
              <Text style={styles.statChipLabel}>Target</Text>
              <Text style={styles.statChipValue}>
                {homeData?.user?.target_weight != null ? `${homeData.user.target_weight} kg` : '--'}
              </Text>
            </View>
            <View style={styles.statChipDivider} />
            <View style={styles.statChip}>
              <View style={[styles.statChipDot, { backgroundColor: '#8FD6FF' }]} />
              <Text style={styles.statChipLabel}>BMI</Text>
              <Text style={styles.statChipValue}>{homeData?.user?.bmi != null ? homeData.user.bmi.toFixed(1) : '--'}</Text>
            </View>
          </View>
        </View>

        {/* ── Tools ── */}
        <View style={styles.toolsGrid}>
          <TouchableOpacity style={[styles.toolCard, leafRadius(BorderRadius.lg), { backgroundColor: Tint.mint }]} activeOpacity={0.88} onPress={() => router.push('/tools/weight-tracker' as any)}>
            <View style={[styles.toolIconChip, { backgroundColor: Colors.primary }]}>
              <Image source={ICON_WEIGHT} style={styles.toolImg} resizeMode="contain" />
            </View>
            <Text style={styles.toolTitle}>Weight Tracker</Text>
            <Text style={styles.toolSub}>Log your progress</Text>
            <View style={[styles.toolArrow, { backgroundColor: 'rgba(45,90,39,0.12)' }]}>
              <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.toolCard, leafRadius(BorderRadius.lg), { backgroundColor: Tint.peach }]} activeOpacity={0.88} onPress={() => router.push('/tools/meal-log' as any)}>
            <View style={[styles.toolIconChip, { backgroundColor: Accent.gold }]}>
              <Image source={ICON_MEAL} style={styles.toolImg} resizeMode="contain" />
            </View>
            <Text style={styles.toolTitle}>Meal Log</Text>
            <Text style={styles.toolSub}>Track your meals</Text>
            <View style={[styles.toolArrow, { backgroundColor: 'rgba(185,137,46,0.14)' }]}>
              <Ionicons name="arrow-forward" size={14} color={Accent.gold} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.toolCard, leafRadius(BorderRadius.lg), { backgroundColor: Tint.peach }]} activeOpacity={0.88} onPress={() => router.push('/profile/favorites' as any)}>
            <View style={[styles.toolIconChip, { backgroundColor: Accent.berry }]}>
              <Ionicons name="heart" size={20} color="#fff" />
            </View>
            <Text style={styles.toolTitle}>Favorites</Text>
            <Text style={styles.toolSub}>Your saved picks</Text>
            <View style={[styles.toolArrow, { backgroundColor: 'rgba(139,58,66,0.14)' }]}>
              <Ionicons name="arrow-forward" size={14} color={Accent.berry} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.toolCard, leafRadius(BorderRadius.lg), { backgroundColor: Tint.sky }]} activeOpacity={0.88} onPress={() => router.push('/profile/reminders')}>
            <View style={[styles.toolIconChip, { backgroundColor: Accent.teal }]}>
              <Ionicons name="notifications" size={20} color="#fff" />
            </View>
            <Text style={styles.toolTitle}>Reminders</Text>
            <Text style={styles.toolSub}>Never miss a beat</Text>
            <View style={[styles.toolArrow, { backgroundColor: 'rgba(62,124,166,0.14)' }]}>
              <Ionicons name="arrow-forward" size={14} color={Accent.teal} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.toolCard, leafRadius(BorderRadius.lg), { backgroundColor: Tint.lilac }]} activeOpacity={0.88} onPress={() => router.push('/tools/challenges' as any)}>
            <View style={[styles.toolIconChip, { backgroundColor: Accent.plum }]}>
              <Image source={ICON_CHALLENGES} style={styles.toolImg} resizeMode="contain" />
            </View>
            <Text style={styles.toolTitle}>Challenges</Text>
            <Text style={styles.toolSub}>Stay motivated</Text>
            <View style={[styles.toolArrow, { backgroundColor: 'rgba(110,90,140,0.14)' }]}>
              <Ionicons name="arrow-forward" size={14} color={Accent.plum} />
            </View>
          </TouchableOpacity>

          

         
        </View>

        {/* ── Explore / Workouts ── */}
        <View style={[styles.sectionCard, leafRadius(BorderRadius.xl)]}>
          <SectionHeader
            icon="videocam" iconTint={Tint.sky}
            title="Explore Workouts" subtitle="Follow guided videos & get stronger"
            onViewMore={() => router.push('/explore')}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.cardsRow}>
              {workoutsLoading
                ? [1, 2, 3].map((i) => <SkeletonCard key={i} width={212} height={144} />)
                : workouts.map((workout) => (
                    <TouchableOpacity
                      key={workout.id}
                      style={[styles.exploreCard, leafRadius(BorderRadius.lg)]}
                      activeOpacity={0.9}
                      onPress={() => router.push({ pathname: '/explore', params: { videoId: String(workout.id) } })}
                    >
                      {workout.thumbnail_url
                        ? <Image source={{ uri: workout.thumbnail_url }} style={styles.cardImage} />
                        : <View style={[styles.cardImage, styles.exploreFallback]} />
                      }
                      <View style={styles.exploreDarken} pointerEvents="none" />
                      <View style={styles.playBtn}>
                        <Ionicons name="play" size={16} color={Colors.textDark} style={{ marginLeft: 2 }} />
                      </View>
                      <View style={styles.exploreBottom}>
                        <Text style={styles.exploreTitle} numberOfLines={1}>{workout.title}</Text>
                        <View style={styles.exploreMetaRow}>
                          <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.85)" />
                          <Text style={styles.exploreMetaText}>{workout.duration_minutes} min · {workout.category || workout.subtitle || 'Workout'}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
              }
              {!workoutsLoading && workouts.length === 0 && <Text style={styles.emptyRowText}>No videos yet.</Text>}
            </View>
          </ScrollView>
        </View>

        {/* ── Recipes ── */}
        <View style={[styles.sectionCard, leafRadius(BorderRadius.xl)]}>
          <SectionHeader
            icon="restaurant" iconTint={Tint.peach}
            title="Healthy Recipes" subtitle="Tasty · Nutritious · Easy"
            onViewMore={() => router.push('/recipes')}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.cardsRow}>
              {recipesLoading
                ? [1, 2, 3].map((i) => <SkeletonCard key={i} width={266} height={88} />)
                : recipes.map((recipe, index) => (
                    <TouchableOpacity
                      key={recipe.id}
                      style={[styles.recipeRow, { backgroundColor: TINT_CYCLE[index % TINT_CYCLE.length] }]}
                      activeOpacity={0.88}
                      onPress={() => router.push({ pathname: '/recipes', params: { recipeId: String(recipe.id) } })}
                    >
                      {recipe.image_url
                        ? <Image source={{ uri: recipe.image_url }} style={styles.recipeThumb} />
                        : <View style={[styles.recipeThumb, styles.recipeThumbFallback]}>
                            <Ionicons name="restaurant-outline" size={20} color={Colors.primary} />
                          </View>
                      }
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recipeTitle} numberOfLines={1}>{recipe.title}</Text>
                        <Text style={styles.recipeMeta}>{recipe.calories} kcal · {recipe.prep_time_minutes} min</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  ))
              }
              {!recipesLoading && recipes.length === 0 && <Text style={styles.emptyRowText}>No recipes yet.</Text>}
            </View>
          </ScrollView>
        </View>

        {/* ── Success Stories ── */}
        <View style={[styles.sectionCard, leafRadius(BorderRadius.xl)]}>
          <SectionHeader
            icon="people" iconTint={Tint.mint}
            title="Success Stories" subtitle="Real people. Real results."
            onViewMore={() => router.push('/success-stories')}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.cardsRow}>
              {storiesLoading
                ? [1, 2, 3].map((i) => <SkeletonCard key={i} width={178} height={140} />)
                : stories.map((story, index) => {
                    const tint = TINT_CYCLE[index % TINT_CYCLE.length];
                    const accent = STORY_ACCENTS[index % STORY_ACCENTS.length];
                    return (
                      <TouchableOpacity
                        key={story.id}
                        style={[styles.storyCard, { backgroundColor: tint }]}
                        activeOpacity={0.88}
                        onPress={() => router.push('/success-stories')}
                      >
                        <View style={styles.storyTopRow}>
                          {story.photo_url
                            ? <Image source={{ uri: story.photo_url }} style={styles.storyAvatarImg} />
                            : <InitialsAvatar name={story.name} index={index} />
                          }
                          <View style={{ flex: 1 }}>
                            <Text style={styles.storyName} numberOfLines={1}>{story.name}</Text>
                            {story.weight_lost_kg != null && (
                              <Text style={[styles.storyResult, { color: accent }]} numberOfLines={1}>
                                −{story.weight_lost_kg} kg in {story.duration_text}
                              </Text>
                            )}
                          </View>
                        </View>
                        {!!story.testimonial && (
                          <Text style={styles.storyQuote} numberOfLines={2}>"{story.testimonial}"</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })
              }
              {!storiesLoading && stories.length === 0 && <Text style={styles.emptyRowText}>No success stories yet.</Text>}
            </View>
          </ScrollView>
        </View>

        {/* Bottom clearance so the last card never sits flush against the tab bar */}
        <View style={{ height: Spacing.xxl + 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.background },
  loader:{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  badgePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 6,
  },
  badgeText: { fontSize: 11.5, fontWeight: '700', color: Colors.primary },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  bellDot: { position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.error, borderWidth: 1.5, borderColor: Colors.white },

  greetingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.lg, gap: Spacing.sm },
  greetingLine: { fontSize: 22, fontWeight: '800', color: Colors.textDark, letterSpacing: -0.4, lineHeight: 28 },
  greetingName: { color: Colors.primary },
  greetingSub:  { fontSize: 13, color: Colors.textMuted, marginTop: 4, lineHeight: 18, maxWidth: 220 },
  datePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.white,
    borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border,
  },
  datePillText: { fontSize: 11.5, fontWeight: '700', color: Colors.textDark },

  // Calorie card
  calorieCard: {
    backgroundColor: Colors.textDark, padding: Spacing.md, marginBottom: Spacing.md, overflow: 'hidden',
    shadowColor: Colors.textDark, shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  calorieBlobA: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.04)', top: -70, right: -60 },
  calorieTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  calorieCenterNum: { position: 'absolute', left: 0, width: RING_SIZE, alignItems: 'center' },
  calorieBigNum: { fontSize: 17, fontWeight: '800', color: '#fff' },
  calorieBigLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
  ringCenter: {},
  calorieInfo: { flex: 1, gap: 6 },
  calorieInfoLabel: { fontSize: 12.5, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  calorieInfoValue: { fontSize: 19, fontWeight: '800', color: '#fff' },
  calorieInfoGoal: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.65)' },
  calorieTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden', marginTop: 2 },
  calorieFill: { height: '100%', borderRadius: 3, backgroundColor: '#B9F24C' },

  statChipsRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  statChip: { flex: 1, alignItems: 'center', gap: 3 },
  statChipDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  statChipLabel: { fontSize: 10.5, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  statChipValue: { fontSize: 13.5, color: '#fff', fontWeight: '800' },
  statChipDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Tools grid
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },
  toolCard: { width: '48%', padding: Spacing.sm + 2, gap: 2, minHeight: 112 },
  toolIconChip: { width: 38, height: 38, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  toolImg:   { width: 19, height: 19, tintColor: '#fff' },
  toolTitle: { fontSize: 13.5, fontWeight: '800', color: Colors.textDark },
  toolSub:   { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  toolArrow: { position: 'absolute', right: 10, bottom: 10, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },

  // Section card shell (wraps each content row the way the reference's white panels do)
  sectionCard: {
    backgroundColor: Colors.white, padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardsRow: { flexDirection: 'row', gap: 12, paddingBottom: 2 },
  cardImage: { width: '100%', height: '100%', position: 'absolute' },
  emptyRowText: { fontSize: 13, color: Colors.textMuted, paddingVertical: Spacing.md },

  // Success story cards
  storyCard: { width: 178, borderRadius: BorderRadius.lg, padding: Spacing.sm + 2, gap: 8 },
  storyTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  storyAvatarImg: { width: 52, height: 52, borderRadius: 26 },
  storyName: { fontSize: 13.5, fontWeight: '800', color: Colors.textDark },
  storyResult: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  storyQuote: { fontSize: 11.5, color: Colors.textMuted, fontStyle: 'italic', lineHeight: 15 },

  // Explore cards
  exploreCard: { width: 212, height: 144, overflow: 'hidden', backgroundColor: Colors.primaryMuted },
  exploreFallback: { backgroundColor: Colors.primaryMuted },
  exploreDarken: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,20,10,0.22)' },
  playBtn: {
    position: 'absolute', top: '50%', left: '50%', marginTop: -18, marginLeft: -18, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)', justifyContent: 'center', alignItems: 'center',
  },
  exploreBottom: { position: 'absolute', left: 12, right: 12, bottom: 10, gap: 3 },
  exploreTitle: { fontSize: 13.5, color: '#fff', fontWeight: '800' },
  exploreMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exploreMetaText: { fontSize: 10.5, color: 'rgba(255,255,255,0.88)', fontWeight: '600' },

  // Recipe rows
  recipeRow: { width: 266, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: BorderRadius.lg, padding: Spacing.sm + 2 },
  recipeThumb: { width: 56, height: 56, borderRadius: 14 },
  recipeThumbFallback: { backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
  recipeTitle: { fontSize: 13.5, fontWeight: '800', color: Colors.textDark },
  recipeMeta:  { fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginTop: 2 },
});