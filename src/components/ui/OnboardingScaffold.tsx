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

import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import OnboardingProgress from '@/src/components/ui/Onboardingprogress';
import PrimaryButton from '@/src/components/ui/PrimaryButton';

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
      <View style={styles.progressWrapper}>
        <OnboardingProgress totalSteps={totalSteps} currentStep={currentStep - 1} />
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
          {showLogo && (
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          )}

          {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
          <Text style={styles.heading}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

          <View style={styles.body}>{children}</View>
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
                <Text style={styles.previousText}>Previous</Text>
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

  progressWrapper: {
    paddingTop: Platform.OS === 'android' ? Spacing.lg : Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },

  logoContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  logo: { width: 160, height: 60 },

  eyebrow: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },

  heading: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '600',
    color: Colors.textDark,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: Spacing.sm,
  },

  subtitle: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  body: { width: '100%', gap: 12, marginTop: Spacing.sm },

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
    flex: 1,
    height: 56,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  previousText: {
    fontSize: Fonts.sizes.md,
    color: Colors.primary,
    fontWeight: '600',
  },

  primaryWrapper: { flex: 2 },
});

export default OnboardingScaffold;
