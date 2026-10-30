import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import OnboardingProgress from '@/src/components/ui/Onboardingprogress';
import PrimaryButton from '@/src/components/ui/PrimaryButton';

// ─── Shared design tokens (same system as Home / Weight / Meal / Diet /
// Workout / Login / Register) ───────────────────────────────────────────────

const LIME = '#B9F24C';

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

interface OnboardingScaffoldProps {
  totalSteps: number;
  currentStep: number; // 1-indexed step number, e.g. step3 -> 3
  eyebrow?: string; // small label above the title, e.g. "Profile Details"
  title: string;
  subtitle?: string;
  footerNote?: string;
  children: React.ReactNode;
  primaryLabel?: string;
  onPrimaryPress: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  onPrevious?: () => void; // omit on the very first screen
  showLogo?: boolean;
}

const OnboardingScaffold: React.FC<OnboardingScaffoldProps> = ({
  totalSteps,
  currentStep,
  eyebrow,
  title,
  subtitle,
  footerNote,
  children,
  primaryLabel = 'Next',
  onPrimaryPress,
  primaryDisabled = false,
  primaryLoading = false,
  onPrevious,
  showLogo = true,
}) => {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Dark hero header — same pattern as Home/Login/Register */}
      <View style={styles.heroCard}>
        <View style={styles.heroBlobA} />
        <View style={styles.heroBlobB} />

        <View style={styles.progressWrapper}>
          <OnboardingProgress totalSteps={totalSteps} currentStep={currentStep - 1} />
        </View>

        {showLogo && (
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}

        {eyebrow && (
          <View style={styles.eyebrowPill}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>{eyebrow}</Text>
          </View>
        )}
        <Text style={styles.heading}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.bodyCard, leafRadius(BorderRadius.xl)]}>
            <View style={styles.body}>{children}</View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          {footerNote && <Text style={styles.footerNote}>{footerNote}</Text>}
          <View style={styles.buttonRow}>
            {onPrevious && (
              <TouchableOpacity
                style={styles.previousButton}
                onPress={onPrevious}
                activeOpacity={0.75}
              >
                <Ionicons name="arrow-back" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
            <View style={styles.primaryWrapper}>
              <PrimaryButton
                title={primaryLabel}
                onPress={onPrimaryPress}
                disabled={primaryDisabled}
                loading={primaryLoading}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  heroCard: {
    backgroundColor: Colors.textDark,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    overflow: 'hidden',
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroBlobA: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -90,
    right: -70,
  },
  heroBlobB: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -60,
    left: -40,
  },

  progressWrapper: {
    width: '100%',
    paddingTop: Platform.OS === 'android' ? Spacing.lg : Spacing.sm,
    paddingBottom: Spacing.sm,
  },

  logoContainer: {
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  logo: { width: 140, height: 50, tintColor: Colors.white },

  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: Spacing.sm,
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: LIME },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  heading: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.3,
  },

  subtitle: {
    fontSize: Fonts.sizes.sm,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginTop: 6,
    fontWeight: '500',
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },

  bodyCard: {
    width: '100%',
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    shadowColor: Colors.textDark,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  body: { width: '100%', gap: 12 },

  footerNote: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? Spacing.md : Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },

  previousButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },

  primaryWrapper: { flex: 1 },
});

export default OnboardingScaffold;