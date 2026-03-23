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
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { setHomeData } from '@/src/redux/userSlice';
import api from '@/src/services/api';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICON_BELL       = require('@/assets/icons/Bell.png');
const ICON_CALENDAR   = require('@/assets/icons/calendar.png');
const ICON_WEIGHT     = require('@/assets/icons/weight.png');
const ICON_MEAL       = require('@/assets/icons/meal.png');
const ICON_CHALLENGES = require('@/assets/icons/steps.png');
const ICON_HEALTH     = require('@/assets/icons/heart.png');
const ICON_PLAY       = require('@/assets/icons/play.png');

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeData {
  user: { name: string; current_weight: number; target_weight: number; bmi: number; bmi_category: string };
  date: { today_date: string; day_name: string };
  success_stories: { id: number; name: string; result: string; image: string }[];
  recipes: { id: number; name: string; image: string; calories: number }[];
  workouts: { id: number; title: string; thumbnail: string; video_url: string; duration: string }[];
}

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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  viewMore: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '500' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [homeData, setHomeDataLocal] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
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

              {/* Weight Tracker */}
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolTitle}>Weight Tracker</Text>
                <Image source={ICON_WEIGHT} style={styles.toolImg} resizeMode="contain" />
                <Text style={styles.toolSub}>
                  {homeData?.user?.current_weight
                    ? `${homeData.user.current_weight} kg`
                    : 'Current Weight\n--'}
                </Text>
              </TouchableOpacity>

              {/* Meal Log */}
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolTitle}>Meal Log</Text>
                <Image source={ICON_MEAL} style={styles.toolImg} resizeMode="contain" />
                <Text style={styles.toolSub}>Your Daily Diet</Text>
              </TouchableOpacity>

              {/* Challenges */}
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolTitle}>Challenges</Text>
                <Image source={ICON_CHALLENGES} style={styles.toolImg} resizeMode="contain" />
                <Text style={styles.toolSub}>Join Now</Text>
              </TouchableOpacity>

              {/* Health Tracker */}
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolTitle}>Health Tracker</Text>
                <Image source={ICON_HEALTH} style={styles.toolImg} resizeMode="contain" />
                <Text style={styles.toolSub}>Join Now</Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </View>

        {/* ── Success Stories ── */}
        {homeData?.success_stories && homeData.success_stories.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Success Stories" onViewMore={() => {}} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.storiesRow}>
                {homeData.success_stories.map((story) => (
                  <TouchableOpacity key={story.id} style={styles.storyCard}>
                    <Image
                      source={{ uri: story.image }}
                      style={styles.storyImage}
                      defaultSource={require('@/assets/images/logo.png')}
                    />
                    <View style={styles.storyOverlay}>
                      <Text style={styles.storyText} numberOfLines={2}>
                        {story.name} {story.result}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Explore / Workouts ── */}
        {homeData?.workouts && homeData.workouts.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Explore" onViewMore={() => {}} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.exploreRow}>
                {homeData.workouts.map((workout) => (
                  <TouchableOpacity key={workout.id} style={styles.exploreCard}>
                    <Image
                      source={{ uri: workout.thumbnail }}
                      style={styles.exploreImage}
                      defaultSource={require('@/assets/images/logo.png')}
                    />
                    <View style={styles.playBtn}>
                      <Image source={ICON_PLAY} style={styles.playImg} resizeMode="contain" />
                    </View>
                    <View style={styles.exploreOverlay}>
                      <Text style={styles.exploreTitle}>{workout.title}</Text>
                      <Text style={styles.exploreDuration}>{workout.duration}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── Recipes ── */}
        {homeData?.recipes && homeData.recipes.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Recipes" onViewMore={() => {}} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.recipesRow}>
                {homeData.recipes.map((recipe) => (
                  <TouchableOpacity key={recipe.id} style={styles.recipeCard}>
                    <Image
                      source={{ uri: recipe.image }}
                      style={styles.recipeImage}
                      defaultSource={require('@/assets/images/logo.png')}
                    />
                    <View style={styles.playBtn}>
                      <Image source={ICON_PLAY} style={styles.playImg} resizeMode="contain" />
                    </View>
                    <View style={styles.recipeOverlay}>
                      <Text style={styles.recipeTitle}>{recipe.name}</Text>
                      <Text style={styles.recipeCalories}>{recipe.calories} cal</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Bottom padding for floating tab bar — enough for both iOS and Android */}
        <View style={{ height: 120 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {},
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 120, height: 36 },
  iconBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  iconImg: { width: 20, height: 20 },
  calendarImg: { width: 24, height: 24 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },

  // Greeting
  greetingContainer: { marginBottom: Spacing.md, marginTop: Spacing.sm },
  greetingHello: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  greetingName: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.textDark },

  // Date card
  dateCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dateDayName: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  dateFullDate: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.textDark,
  },

  // Sections
  section: { marginBottom: Spacing.lg },

  // Tools
  toolsRow: { flexDirection: 'row', gap: 12, paddingBottom: 4 },
  toolCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: 140,
    height: 160,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolImg: { width: 36, height: 36 },
  toolTitle: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 22,
    textAlign: 'center',
  },
  toolSub: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textDark,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Success Stories
  storiesRow: { flexDirection: 'row', gap: 12 },
  storyCard: {
    width: 160, height: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.primaryMuted,
  },
  storyImage: { width: '100%', height: '100%', position: 'absolute' },
  storyOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: Spacing.sm,
  },
  storyText: { fontSize: 11, color: '#fff', fontWeight: '500' },

  // Explore
  exploreRow: { flexDirection: 'row', gap: 12 },
  exploreCard: {
    width: 200, height: 130,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.primaryMuted,
  },
  exploreImage: { width: '100%', height: '100%', position: 'absolute' },
  playBtn: {
    position: 'absolute',
    top: '50%', left: '50%',
    marginTop: -18, marginLeft: -18,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center', alignItems: 'center',
  },
  playImg: { width: 16, height: 16 },
  exploreOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: Spacing.sm,
  },
  exploreTitle: { fontSize: Fonts.sizes.sm, color: '#fff', fontWeight: '600' },
  exploreDuration: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },

  // Recipes
  recipesRow: { flexDirection: 'row', gap: 12 },
  recipeCard: {
    width: 160, height: 160,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.primaryMuted,
  },
  recipeImage: { width: '100%', height: '100%', position: 'absolute' },
  recipeOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: Spacing.sm,
  },
  recipeTitle: { fontSize: Fonts.sizes.sm, color: '#fff', fontWeight: '600' },
  recipeCalories: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
});