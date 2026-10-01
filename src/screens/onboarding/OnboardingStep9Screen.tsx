import React, { useState } from 'react';

import {
  Alert,
  Text,
  View,
  StyleSheet,
  TextInput,
} from 'react-native';

import { useRouter } from 'expo-router';

import { Colors, Fonts, Spacing } from '@/src/constants/theme';

import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';

import { saveGoal, saveLookingFor } from '@/src/redux/onboardingSlice';

import api from '@/src/services/api';

import {
  markOnboardingStepSubmitted,
  clearOnboardingProgress,
} from '@/src/utils/onboardingStore';

import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';

import OptionCard from '@/src/components/ui/OptionCard';

const TOTAL_STEPS = 9;

const GOAL_OPTIONS = [
  { value: 'weight_lose', label: 'Weight Lose' },
  { value: 'weight_gain', label: 'Weight Gain' },
  { value: 'lifestyle_management', label: 'Lifestyle Management' },
  { value: 'stamina_mobility', label: 'Stamina & Mobility' },
  { value: 'strength_conditioning', label: 'Strength & Conditioning' },
];

// Matches UserProfile.LOOKING_FOR_CHOICES on the backend exactly.
const LOOKING_FOR_OPTIONS = [
  {
    value: 'diet_and_training',
    label: 'Diet and Training Plans',
    description: 'Tailored plans for myself.',
  },
  {
    value: 'personal_training_online',
    label: 'Personal Training',
    description: 'Online personal trainer, without a diet plan.',
  },
  {
    value: 'tailored_diet_plans',
    label: 'Diet and Tailored Plans',
    description: 'A personalized nutrition plan built for you.',
  },
  {
    value: 'both',
    label: 'Both Nutrition & Training Plans',
    description: 'Along with an online trainer.',
  },
];

const OnboardingStep9Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Restore previous state so "Previous" isn't a blank screen.
  const goalState = useAppSelector(
    (state: any) => state.onboarding.goal
  );

  const lookingForState = useAppSelector(
    (state: any) => state.onboarding.lookingFor
  );

  const [goal, setGoal] = useState<string | null>(
    goalState?.goal ?? null
  );

  const [lookingFor, setLookingFor] = useState<string | null>(
    lookingForState?.option ?? null
  );

  const [targetWeight, setTargetWeight] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);

  const isTargetWeightValid =
    targetWeight.trim() !== '' &&
    !Number.isNaN(Number(targetWeight)) &&
    Number(targetWeight) > 0 &&
    Number(targetWeight) <= 500;

  const isFormValid =
    !!goal &&
    !!lookingFor &&
    isTargetWeightValid;

  const handleSave = async () => {
    if (!isFormValid || isLoading) return;

    setIsLoading(true);

    try {
      const payload = {
        goal,
        looking_for: lookingFor,
        target_weight: Number(targetWeight),
      };

      console.log('📤 Step 9 payload:', payload);

      const { data, status } = await api.post(
        '/onboarding/step9/',
        payload
      );

      console.log('📥 Step 9 response status:', status);
      console.log(
        '📥 Step 9 response data:',
        JSON.stringify(data, null, 2)
      );

      dispatch(saveGoal({ goal: goal as string }));

      dispatch(
        saveLookingFor({
          option: lookingFor as string,
        })
      );

      await markOnboardingStepSubmitted(9);

      // Onboarding is fully done now.
      await clearOnboardingProgress();

      router.push('/(tabs)/home');
    } catch (error: any) {
      console.log(
        '❌ Step 9 error status:',
        error?.response?.status
      );

      console.log(
        '❌ Step 9 error data:',
        JSON.stringify(error?.response?.data, null, 2)
      );

      console.log(
        '❌ Step 9 error message:',
        error?.message
      );

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          'Something went wrong. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={9}
      eyebrow="Lifestyle Details"
      title="What is your goal?"
      primaryLabel="Save"
      onPrimaryPress={handleSave}
      primaryDisabled={!isFormValid}
      primaryLoading={isLoading}
      onPrevious={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(onboarding)/step8');
        }
      }}
    >
      {GOAL_OPTIONS.map((opt) => (
        <OptionCard
          key={opt.value}
          label={opt.label}
          selected={goal === opt.value}
          onPress={() => setGoal(opt.value)}
          mode="radio"
        />
      ))}

      <View style={styles.questionBlock}>
        <Text style={styles.questionLabel}>
          What is your target weight?
        </Text>

        <View style={styles.weightInputContainer}>
          <TextInput
            style={styles.weightInput}
            value={targetWeight}
            onChangeText={setTargetWeight}
            placeholder="Enter target weight"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            maxLength={6}
          />

          <Text style={styles.unitText}>kg</Text>
        </View>

        {targetWeight.length > 0 && !isTargetWeightValid && (
          <Text style={styles.errorText}>
            Please enter a valid target weight.
          </Text>
        )}
      </View>

      <View style={styles.questionBlock}>
        <Text style={styles.questionLabel}>
          What are you looking for?
        </Text>

        {LOOKING_FOR_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            label={opt.label}
            description={opt.description}
            selected={lookingFor === opt.value}
            onPress={() => setLookingFor(opt.value)}
            mode="radio"
          />
        ))}
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

  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
  },

  weightInput: {
    flex: 1,
    height: 52,
    fontSize: Fonts.sizes.md,
    color: Colors.textDark,
  },

  unitText: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.textDark,
    marginLeft: Spacing.sm,
  },

  errorText: {
    marginTop: Spacing.xs,
    fontSize: Fonts.sizes.xs,
    color: Colors.error,
  },
});

export default OnboardingStep9Screen;