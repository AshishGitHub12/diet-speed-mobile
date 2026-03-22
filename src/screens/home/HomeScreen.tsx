import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { setHomeData } from '@/src/redux/userSlice';
import api from '@/src/services/api';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeData {
  user: { name: string; current_weight: number; target_weight: number; bmi: number; bmi_category: string };
  date: { today_date: string; day_name: string };
  success_stories: { id: number; name: string; result: string; image: string }[];
  recipes: { id: number; name: string; image: string; calories: number }[];
  workouts: { id: number; title: string; thumbnail: string; video_url: string; duration: string }[];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const getWeekDays = (todayStr: string) => {
  const today = new Date(todayStr);
  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d.getDate(),
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: i === 0,
    });
  }
  return days;
};

const formatDate = (dateStr: string, dayName: string) => {
  const d = new Date(dateStr);
  return `${dayName}, ${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getFullYear()}`;
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

  const weekDays = homeData ? getWeekDays(homeData.date.today_date) : [];

  return (
    <SafeAreaView style={styles.safe}>
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
              <Text style={styles.iconText}>🔔</Text>
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

        {/* ── Date / Calendar strip ── */}
        <View style={styles.card}>
          <View style={styles.dateHeader}>
            <Text style={styles.dateTitle}>
              {homeData ? formatDate(homeData.date.today_date, homeData.date.day_name) : ''}
            </Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </View>
          <View style={styles.weekRow}>
            {weekDays.map((d, i) => (
              <View key={i} style={styles.dayCol}>
                <Text style={styles.dayName}>{d.day}</Text>
                <View style={[styles.dayCircle, d.isToday && styles.dayCircleActive]}>
                  <Text style={[styles.dayNum, d.isToday && styles.dayNumActive]}>
                    {d.date}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Tools ── */}
        <View style={styles.section}>
          <SectionHeader title="Tools" onViewMore={() => {}} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.toolsRow}>

              {/* Weight Tracker */}
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolTitle}>Weight{'\n'}Tracker</Text>
                <Text style={styles.toolIcon}>⚖️</Text>
                <Text style={styles.toolSub}>
                  {homeData?.user?.current_weight
                    ? `${homeData.user.current_weight} kg`
                    : 'Current Weight'}
                </Text>
              </TouchableOpacity>

              {/* Meal Log */}
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolTitle}>Meal Log</Text>
                <Text style={styles.toolIcon}>🍽️</Text>
                <Text style={styles.toolSub}>Keep Track Of{'\n'}Your Daily Diet</Text>
              </TouchableOpacity>

              {/* Challenges */}
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolTitle}>Challenges</Text>
                <Text style={styles.toolIcon}>👟</Text>
                <Text style={styles.toolSub}>Join Now</Text>
              </TouchableOpacity>

              {/* Health Tracker */}
              <TouchableOpacity style={styles.toolCard}>
                <Text style={styles.toolTitle}>Health{'\n'}Tracker</Text>
                <Text style={styles.toolIcon}>🩺</Text>
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
                      <Text style={styles.playIcon}>▶</Text>
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
                      <Text style={styles.playIcon}>▶</Text>
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

        {/* Bottom padding for floating tab bar */}
        <View style={{ height: 100 }} />

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
  iconText: { fontSize: 18 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },

  // Greeting
  greetingContainer: { marginBottom: Spacing.md },
  greetingHello: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  greetingName: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.textDark },

  // Card (date)
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dateHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dateTitle: { fontSize: Fonts.sizes.sm, color: Colors.textDark, fontWeight: '500' },
  calendarIcon: { fontSize: 18 },

  // Week strip
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayName: { fontSize: 11, color: Colors.textMuted },
  dayCircle: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  dayCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayNum: { fontSize: Fonts.sizes.sm, color: Colors.textDark },
  dayNumActive: { color: Colors.white, fontWeight: '700' },

  // Sections
  section: { marginBottom: Spacing.lg },

  // Tools
  toolsRow: { flexDirection: 'row', gap: 12 },
  toolCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    width: 130,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 6,
  },
  toolTitle: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.primary, lineHeight: 18 },
  toolIcon: { fontSize: 28 },
  toolSub: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },

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
  playIcon: { fontSize: 14, color: Colors.primary, marginLeft: 2 },
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