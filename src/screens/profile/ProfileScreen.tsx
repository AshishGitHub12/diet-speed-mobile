import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '@/src/redux/hooks';
import { logout } from '@/src/redux/authSlice';
import { setProfile, resetUser } from '@/src/redux/userSlice';
import { resetOnboarding } from '@/src/redux/onboardingSlice';
import { clearOnboardingProgress } from '@/src/utils/onboardingStore';
import { clearTokens } from '@/src/utils/secureStore';
import api from '@/src/services/api';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Shared design tokens (same system as Home / Weight / Meal / Diet /
// Workout / Login / Register / Onboarding / Tabs) ───────────────────────────

const Accent = {
  gold: '#B9892E',
  plum: '#6E5A8C',
  teal: '#3E7CA6',
  berry: '#8B3A42',
};

const Tint = {
  mint: '#E1EEDD',
  peach: '#F5E6D3',
  lilac: '#E7E2F0',
  sky: '#DCEAF2',
};

const LIME = '#B9F24C';

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: number;
  name: string;
  dob: string;
  gender: string;
  height: number;
  height_unit: string;
  weight: number;
  bmi: number;
  target_weight: number;
  medical_conditions: string[];
  onboarding_completed: boolean;
}

// ─── Sub Components ───────────────────────────────────────────────────────────

const MenuRow = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity style={[styles.menuRow, leafRadius(BorderRadius.lg)]} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.menuLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
  </TouchableOpacity>
);

const QUICK_TINTS = [Tint.mint, Tint.peach, Tint.lilac];
const QUICK_ACCENTS = [Colors.primary, Accent.gold, Accent.plum];

const QuickCard = ({
  icon,
  label,
  onPress,
  index,
}: {
  icon: ImageSourcePropType;
  label: string;
  onPress: () => void;
  index: number;
}) => (
  <TouchableOpacity
    style={[styles.quickCard, leafRadius(BorderRadius.lg), { backgroundColor: QUICK_TINTS[index % QUICK_TINTS.length] }]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={[styles.quickIconWrapper, { backgroundColor: Colors.white }]}>
      <Image source={icon} style={styles.quickIcon} />
    </View>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name[0]?.toUpperCase() ?? 'U';
};

const formatDob = (dob: string) => {
  const d = new Date(dob);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '—';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [profile, setProfileLocal] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/profile/');
      setProfileLocal(res.data);
      dispatch(setProfile(res.data));
    } catch (e) {
      console.log('❌ Profile fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  // Refetch every time this screen regains focus, not just on first mount —
  // so editing a field in My Account and navigating back here shows the
  // updated value immediately instead of whatever was loaded the first time
  // this screen mounted.
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  // ─── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            // Clear token from device storage
            await clearTokens();

            // Reset auth + user cache in Redux
            dispatch(logout());
            dispatch(resetUser());

            // IMPORTANT: onboarding answers are NOT re-fetched from the
            // server on next login — they only ever enter this slice via
            // each onboarding screen's own submit call, and every screen
            // pre-fills itself from this slice on mount (so "Previous"
            // works). Without clearing it here, the next person to log in
            // on this device sees the previous user's onboarding answers.
            dispatch(resetOnboarding());

            // Same issue for the SecureStore-persisted resume flags
            // (current step, which steps were already submitted) — these
            // are meant to survive app restarts for the SAME user, so they
            // must be cleared explicitly on logout, not just on onboarding
            // completion.
            await clearOnboardingProgress();

            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={19} color={Colors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Profile Hero Card ── */}
        {/* No edit button here — use My Account for editing */}
        <View style={[styles.profileCard, leafRadius(BorderRadius.xl)]}>
          <View style={styles.heroBlobA} />
          <View style={styles.heroBlobB} />

          <View style={styles.profileTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {getInitials(profile?.name ?? 'U')}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.name ?? '—'}</Text>
              <Text style={styles.profileSub}>
                {capitalize(profile?.gender ?? '')} • {profile?.dob ? formatDob(profile.dob) : '—'}
              </Text>
            </View>
          </View>

          {/* ── Stats Row (now inside the hero) ── */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statDot} />
              <Text style={styles.statValue}>{profile?.weight ?? '—'}</Text>
              <Text style={styles.statLabel}>Weight (kg)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#8FD6FF' }]} />
              <Text style={styles.statValue}>{profile?.target_weight ?? '—'}</Text>
              <Text style={styles.statLabel}>Target (kg)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#FFC56B' }]} />
              <Text style={styles.statValue}>{profile?.bmi ?? '—'}</Text>
              <Text style={styles.statLabel}>BMI</Text>
            </View>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        {/* My Account → all user details + edit info */}
        <View style={styles.quickRow}>
          <QuickCard index={0} icon={require('@/assets/icons/myaccount.png')} label="My Account" onPress={() => router.push('/my-account')} />
          <QuickCard index={1} icon={require('@/assets/icons/mygoals.png')} label="Streaks"   onPress={() => router.push('/streak-badges' as any)} />
          <QuickCard index={2} icon={require('@/assets/icons/myplan.png')} label="Summary"    onPress={() => router.push('/summary')} />
        </View>

        {/* ── More ── */}
        <Text style={styles.sectionTitle}>More</Text>
        {/* <View style={styles.menuGroup}>
        <MenuRow label="Track my Programs"  onPress={() => router.push('/profile/track-programs' as any)} />
        <MenuRow label="Progress Reports"   onPress={() => router.push('/profile/progress-reports' as any)} />
        <MenuRow label="Health Logs"        onPress={() => router.push('/profile/health-logs' as any)} />
          <MenuRow label="Diet Preferences"   onPress={() => router.push('/profile/diet-preferences' as any)} />
          <MenuRow label="Favorites"          onPress={() => router.push('/profile/favorites' as any)} />
          <MenuRow label="Connected Devices"  onPress={() => router.push('/profile/connected-devices' as any)} />
          <MenuRow label="Reminders"          onPress={() => router.push('/profile/reminders' as any)} />
        </View> */}

        {/* ── About ── */}
        {/* <Text style={styles.sectionTitle}>About</Text> */}
        <View style={styles.menuGroup}>
          <MenuRow label="Contact Us"          onPress={() => {}} />
          <MenuRow label="Terms & Conditions"  onPress={() => {}} />
          <MenuRow label="Privacy Policy"      onPress={() => {}} />
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },

  // Header — flat bg + bordered circular buttons, matching Weight/Meal/Diet
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.background,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.textDark },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  // Profile Hero Card — dark, same pattern as Home calorie card
  profileCard: {
    backgroundColor: Colors.textDark,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    shadowColor: Colors.textDark,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroBlobA: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -70, right: -60,
  },
  heroBlobB: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.03)', bottom: -50, left: -30,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LIME,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: Colors.textDark },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.3,
  },
  profileSub: {
    fontSize: Fonts.sizes.sm,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 3,
    fontWeight: '500',
  },

  // Stats Row (inside hero card)
  statsRow: {
    flexDirection: 'row',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: LIME, marginBottom: 2 },
  statValue: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '800',
    color: Colors.white,
  },
  statLabel: { fontSize: 10.5, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 2 },

  // Quick Actions
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  quickCard: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 8,
  },
  quickIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickIcon: { width: 40, height: 40, resizeMode: 'contain' },
  quickLabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textDark,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Section title
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },

  // Menu
  menuGroup: { gap: 8, marginBottom: Spacing.lg },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuLabel: { fontSize: Fonts.sizes.md, color: Colors.textDark, fontWeight: '600' },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.error,
    borderRadius: BorderRadius.full,
    height: 56,
  },
  logoutText: {
    fontSize: Fonts.sizes.md,
    fontWeight: '700',
    color: Colors.error,
    letterSpacing: 0.3,
  },
});