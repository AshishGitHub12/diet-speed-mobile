import React, { useState } from 'react';
import { Alert, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, Fonts, Spacing } from '@/src/constants/theme';
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { saveSleep, saveSmoking, saveAlcohol } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import { markOnboardingStepSubmitted, setCurrentOnboardingStep } from '@/src/utils/onboardingStore';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import ChipToggle from '@/src/components/ui/ChipToggle';

const TOTAL_STEPS = 9; // final count once goal + looking-for are merged into one last screen

const SLEEP_OPTIONS = [
  { value: 'less_than_4', label: 'Less than 4 hours' },
  { value: '4_5', label: '4-5 hours' },
  { value: '6_7', label: '6-7 hours' },
  { value: '8_10', label: '8-10 hours' },
];

const SMOKING_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'occasionally', label: 'Occasionally' },
];

const ALCOHOL_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'socially', label: 'Socially' },
];

const OnboardingStep8Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Restore previous state so "Previous" from Step 9 isn't a blank screen.
  const sleepState = useAppSelector((state: any) => state.onboarding.sleep);
  const smokingState = useAppSelector((state: any) => state.onboarding.smoking);
  const alcoholState = useAppSelector((state: any) => state.onboarding.alcohol);

  const [sleepHours, setSleepHours] = useState<string | null>(sleepState?.hours ?? null);
  const [smokes, setSmokes] = useState<string | null>(smokingState?.status ?? null);
  const [alcohol, setAlcohol] = useState<string | null>(alcoholState?.status ?? null);
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = !!sleepHours && !!smokes && !!alcohol;

  const handleNext = async () => {
    if (!isFormValid || isLoading) return;
    setIsLoading(true);
    try {
      // All three questions save to the SAME backend endpoint
      // (/onboarding/step8/). Field names are sleep_hours, smokes,
      // consumes_alcohol — NOT smoking/alcohol, which the old dead code used.
      const payload = {
        sleep_hours: sleepHours,
        smokes,
        consumes_alcohol: alcohol,
      };
      console.log('📤 Step 8 (Lifestyle) payload:', payload);

      const { data, status } = await api.post('/onboarding/step8/', payload);
      console.log('📥 Step 8 response status:', status);
      console.log('📥 Step 8 response data:', JSON.stringify(data, null, 2));

      dispatch(saveSleep({ hours: sleepHours as string }));
      dispatch(saveSmoking({ status: smokes as string }));
      dispatch(saveAlcohol({ status: alcohol as string }));
      await markOnboardingStepSubmitted(8);
      await setCurrentOnboardingStep(9);

      router.push('/(onboarding)/step9');
    } catch (error: any) {
      console.log('❌ Step 8 error status:', error?.response?.status);
      console.log('❌ Step 8 error data:', JSON.stringify(error?.response?.data));
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={8}
      eyebrow="Lifestyle Details"
      title="A few lifestyle questions"
      primaryLabel="Next"
      onPrimaryPress={handleNext}
      primaryDisabled={!isFormValid}
      primaryLoading={isLoading}
      onPrevious={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(onboarding)/step7');
        }
      }}
    >
      <View style={styles.questionBlock}>
        <Text style={styles.questionLabel}>How much sleep do you usually get?</Text>
        <ChipToggle options={SLEEP_OPTIONS} selected={sleepHours} onSelect={setSleepHours} />
      </View>

      <View style={styles.questionBlock}>
        <Text style={styles.questionLabel}>Do you smoke?</Text>
        <ChipToggle options={SMOKING_OPTIONS} selected={smokes} onSelect={setSmokes} />
      </View>

      <View style={styles.questionBlock}>
        <Text style={styles.questionLabel}>Do you consume alcohol?</Text>
        <ChipToggle options={ALCOHOL_OPTIONS} selected={alcohol} onSelect={setAlcohol} />
      </View>
    </OnboardingScaffold>
  );
};

const styles = StyleSheet.create({
  questionBlock: {
    marginBottom: Spacing.lg,
  },
  questionLabel: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
});

export default OnboardingStep8Screen;