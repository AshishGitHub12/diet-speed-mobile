import React, { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useAppDispatch } from '@/src/redux/hooks';
import { logout } from '@/src/redux/authSlice';
import { setProfile, resetUser } from '@/src/redux/userSlice';
import { clearTokens } from '@/src/utils/secureStore';
import api from '@/src/services/api';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

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
  <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.menuLabel}>{label}</Text>
    <Text style={styles.menuChevron}>›</Text>
  </TouchableOpacity>
);

const QuickCard = ({ icon, label, onPress }: { 
    icon: ImageSourcePropType; 
    label: string; 
    onPress: () => void 
  }) => (
    <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.quickIconWrapper}>
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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile/');
      setProfileLocal(res.data);
      dispatch(setProfile(res.data));
    } catch (e) {
      console.log('❌ Profile fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

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
            // Reset only auth + user cache in Redux
            // onboarding & weight data stays — server has it, re-fetched on next login
            dispatch(logout());
            dispatch(resetUser());
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
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.headerBtn}>
        <Image source={require('@/assets/icons/Bell.png')} style={styles.iconSm} /> 
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Profile Card ── */}
        {/* No edit button here — use My Account for editing */}
        <View style={styles.profileCard}>
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

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.weight ?? '—'}</Text>
            <Text style={styles.statLabel}>Weight (kg)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.bmi ?? '—'}</Text>
            <Text style={styles.statLabel}>BMI</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile?.target_weight ?? '—'}</Text>
            <Text style={styles.statLabel}>Target (kg)</Text>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        {/* My Account → all user details + edit info */}
        <View style={styles.quickRow}>
          <QuickCard icon={require('@/assets/icons/myaccount.png')} label="My Account" onPress={() => router.push('/my-account')} />
          <QuickCard icon={require('@/assets/icons/mygoals.png')} label="My Goals"   onPress={() => router.push('/my-goal')} />
          <QuickCard icon={require('@/assets/icons/myplan.png')} label="My Plan"    onPress={() => router.push('/my-plan')} />
        </View>

        {/* ── More ── */}
        <Text style={styles.sectionTitle}>More</Text>
        <View style={styles.menuGroup}>
          <MenuRow label="Track my Programs"  onPress={() => {}} />
          <MenuRow label="Progress Reports"   onPress={() => {}} />
          <MenuRow label="Health Logs"        onPress={() => {}} />
          <MenuRow label="Diet Preferences"   onPress={() => {}} />
          <MenuRow label="Favorites"          onPress={() => {}} />
          <MenuRow label="Connected Devices"  onPress={() => {}} />
          <MenuRow label="Reminders"          onPress={() => {}} />
        </View>

        {/* ── About ── */}
        <Text style={styles.sectionTitle}>About</Text>
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

  // Header — green tinted background like Figma
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryMuted,
  },
  headerBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  headerBell: { fontSize: 20 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

//   quickIcon: { width: 6, height: 16, resizeMode: 'contain' },

  iconSm: { width: 22, height: 22, resizeMode: 'contain' },

  // Profile Card — green tinted, no edit button
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: Colors.white },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  profileSub: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    marginTop: 3,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: { fontSize: 11, color: Colors.textMuted },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  // Quick Actions
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 8,
  },
  quickIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    // backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickIcon: { width: 48, height: 48, resizeMode: 'contain' },
  quickLabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textDark,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Section title
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
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
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuLabel: { fontSize: Fonts.sizes.md, color: Colors.textDark },
  menuChevron: { fontSize: 22, color: Colors.textMuted },

  // Logout
  logoutBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: Fonts.sizes.md,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
});