import React, { useState } from 'react';
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
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';   
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { saveStep2 } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import OnboardingProgress from '@/src/components/ui/Onboardingprogress';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import FieldRow from '@/src/components/ui/Fieldrow';
import DropdownModal from '@/src/components/ui/Dropdownmodal';

// ─── Constants ────────────────────────────────────────────────────────────────

const HEIGHT_UNITS = ['cm', 'ft'];

// ─── Screen ───────────────────────────────────────────────────────────────────

const OnboardingStep2Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Pre-fill from Step 1 Redux state
  const step1 = useAppSelector((state) => state.onboarding.step1);

  const [height, setHeight] = useState(String(step1?.height ?? '180'));
  const [heightUnit, setHeightUnit] = useState(step1?.height_unit ?? 'cm');
  const [weight, setWeight] = useState(String(step1?.weight ?? '70'));
  const [isLoading, setIsLoading] = useState(false);
  const [showHeightUnit, setShowHeightUnit] = useState(false);

  const isFormValid = !!height && !!weight;

  // ─── API Call ─────────────────────────────────────────────────────────────

  const handleCalculate = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    try {
      const payload = {
        height: parseFloat(height),
        height_unit: heightUnit,
        weight: parseFloat(weight),
      };

      console.log('📤 Step 2 payload:', payload);
      const response = await api.post('/onboarding/step2/', payload);
      const { bmi } = response.data;

      // Save to Redux so Step 3 can read it
      dispatch(saveStep2({
        height: payload.height,
        height_unit: payload.height_unit,
        weight: payload.weight,
        bmi,
      }));

      // Navigate to Step 3 (result screen)
      router.push('/(onboarding)/step3');
    } catch (error: any) {
      console.log('❌ Step 2 error:', JSON.stringify(error?.response?.data));
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/(onboarding)/step3');
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* Progress — step 2 of 3 */}
      <View style={styles.progressWrapper}>
        <OnboardingProgress totalSteps={3} currentStep={2} />
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
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>BMI</Text>
          <Text style={styles.subtitle}>Calculate your BMI</Text>

          {/* Fields */}
          <View style={styles.fieldsContainer}>
            <FieldRow icon="↕">
              <TextInput
                style={styles.editableInput}
                value={`${height}.0${heightUnit}`}
                editable={false}
              />
              <TouchableOpacity
                style={styles.chevronBtn}
                onPress={() => setShowHeightUnit(true)}
              >
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </FieldRow>

            <FieldRow icon="⚖️">
              <TextInput
                style={styles.editableInput}
                value={`${weight} kg`}
                editable={false}
              />
              <Text style={styles.chevron}>›</Text>
            </FieldRow>
          </View>

          {/* About BMI */}
          <View style={styles.aboutContainer}>
            <Text style={styles.aboutTitle}>About BMI</Text>
            <Text style={styles.aboutBody}>
              Body mass index (BMI) is a measurement that compares a person's
              weight to their height. It's a quick and inexpensive way to screen
              for weight categories like underweight, overweight, and obesity.
            </Text>
          </View>

        </ScrollView>

        {/* Fixed bottom buttons */}
        <View style={styles.bottomBar}>
          <PrimaryButton
            title="Calculate BMI"
            onPress={handleCalculate}
            disabled={!isFormValid || isLoading}
            loading={isLoading}
          />
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      <DropdownModal
        visible={showHeightUnit}
        title="Height Unit"
        options={HEIGHT_UNITS}
        selected={heightUnit}
        onSelect={setHeightUnit}
        onClose={() => setShowHeightUnit(false)}
      />

    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  logoContainer: { marginTop: Spacing.md, marginBottom: Spacing.lg, alignItems: 'center' },
  logo: { width: 160, height: 60 },

  title: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Fonts.sizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  fieldsContainer: { width: '100%', gap: 12, marginBottom: Spacing.xl },

  editableInput: {
    flex: 1,
    fontSize: Fonts.sizes.md,
    color: Colors.textDark,
    paddingVertical: 4,
  },

  chevronBtn: { padding: 4 },
  chevron: { fontSize: 22, color: Colors.textMuted },

  aboutContainer: { width: '100%', marginBottom: Spacing.lg },
  aboutTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  aboutBody: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    lineHeight: 22,
    textAlign: 'justify',
  },

  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? Spacing.md : Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  skipButton: {
    height: 56,
    width: '100%',
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  skipText: { fontSize: Fonts.sizes.md, color: Colors.primary, fontWeight: '600' },
});

export default OnboardingStep2Screen;