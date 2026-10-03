import React, { useState } from 'react';
import { Alert, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, Fonts, Spacing } from '@/src/constants/theme';
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { saveActivityLevel, saveExercise } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import { markOnboardingStepSubmitted, setCurrentOnboardingStep } from '@/src/utils/onboardingStore';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import OptionCard from '@/src/components/ui/OptionCard';
import ChipToggle from '@/src/components/ui/ChipToggle';

const TOTAL_STEPS = 9; // final count: 9 screens matching the 9 backend endpoints 1:1

const ACTIVITY_OPTIONS = [
  {
    value: 'not_very_active',
    label: 'Not Very Active',
    description: 'Spend most of the day sitting (e.g., bank teller, desk job).',
  },
  {
    value: 'lightly_active',
    label: 'Lightly Active',
    description: 'Spend a good part of the day on your feet (e.g., salesperson).',
  },
  {
    value: 'active',
    label: 'Active',
    description: 'Spend a good part of the day doing some physical activity (e.g., food server).',
  },
  {
    value: 'very_active',
    label: 'Very Active',
    description: 'Spend a good part of the day doing heavy physical activity (e.g., bike messenger).',
  },
];

const EXERCISE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const OnboardingStep7Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Restore previous state so "Previous" from Step 8 isn't a blank screen.
  const activityLevelState = useAppSelector((state: any) => state.onboarding.activityLevel);
  const exerciseState = useAppSelector((state: any) => state.onboarding.exercise);

  const [activityLevel, setActivityLevel] = useState<string | null>(activityLevelState?.level ?? null);
  const [exercises, setExercises] = useState<string | null>(
    exerciseState?.exercisesRegularly === undefined
      ? null
      : exerciseState.exercisesRegularly
        ? 'yes'
        : 'no',
  );
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = !!activityLevel && !!exercises;

  const handleNext = async () => {
    if (!isFormValid || isLoading) return;
    setIsLoading(true);
    try {
      // Both questions save to the SAME backend endpoint (/onboarding/step7/),
      // so they're one screen, one call. exercises_regularly is a string
      // choice on the backend ("yes"/"no"), not a boolean — sending true/false
      // here would fail serializer validation.
      const payload = {
        activity_level: activityLevel,
        exercises_regularly: exercises, // "yes" | "no"
      };
      console.log('📤 Step 7 (Activity Level + Exercise) payload:', payload);

      const { data, status } = await api.post('/onboarding/step7/', payload);
      console.log('📥 Step 7 response status:', status);
      console.log('📥 Step 7 response data:', JSON.stringify(data, null, 2));

      dispatch(saveActivityLevel({ level: activityLevel as string }));
      dispatch(saveExercise({ exercisesRegularly: exercises === 'yes' }));
      await markOnboardingStepSubmitted(7);
      await setCurrentOnboardingStep(8);

      router.push('/(onboarding)/step8');
    } catch (error: any) {
      console.log('❌ Step 7 error status:', error?.response?.status);
      console.log('❌ Step 7 error data:', JSON.stringify(error?.response?.data));
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={7}
      eyebrow="Activity Level"
      title="What is your baseline activity level?"
      primaryLabel="Next"
      onPrimaryPress={handleNext}
      primaryDisabled={!isFormValid}
      primaryLoading={isLoading}
      onPrevious={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(onboarding)/step6');
        }
      }}
    >
      {ACTIVITY_OPTIONS.map((opt) => (
        <OptionCard
          key={opt.value}
          label={opt.label}
          description={opt.description}
          selected={activityLevel === opt.value}
          onPress={() => setActivityLevel(opt.value)}
          mode="radio"
        />
      ))}

      <View style={styles.questionBlock}>
        <Text style={styles.questionLabel}>Do you exercise regularly?</Text>
        <ChipToggle options={EXERCISE_OPTIONS} selected={exercises} onSelect={setExercises} />
      </View>
    </OnboardingScaffold>
  );
};

const styles = StyleSheet.create({
  questionBlock: {
    marginTop: Spacing.lg,
  },
  questionLabel: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
});

export default OnboardingStep7Screen;