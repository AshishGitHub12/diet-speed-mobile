import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { saveDietaryPreference } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import { markOnboardingStepSubmitted, setCurrentOnboardingStep } from '@/src/utils/onboardingStore';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import OptionCard from '@/src/components/ui/OptionCard';

const TOTAL_STEPS = 14;

const OPTIONS = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'pure_vegetarian', label: 'Pure Vegetarian' },
  { value: 'ovo_vegetarian', label: 'Ovo Vegetarian' },
  { value: 'non_vegetarian', label: 'Non Vegetarian' },
];

const OnboardingStep3Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Restore previous selection so "Previous" from Step 4 isn't a blank screen.
  const dietaryPreference = useAppSelector((state: any) => state.onboarding.dietaryPreference);
  const [selected, setSelected] = useState<string | null>(dietaryPreference?.preference ?? null);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (!selected || isLoading) return;
    setIsLoading(true);
    try {
      const payload = { dietary_preference: selected };
      console.log('📤 Step 3 (Dietary Preference) payload:', payload);

      const { data, status } = await api.post('/onboarding/step3/', payload);
      console.log('📥 Step 3 response status:', status);
      console.log('📥 Step 3 response data:', JSON.stringify(data, null, 2));

      dispatch(saveDietaryPreference({ preference: selected }));
      await markOnboardingStepSubmitted(3);
      await setCurrentOnboardingStep(4);

      router.push('/(onboarding)/step4');
    } catch (error: any) {
      console.log('❌ Step 3 error status:', error?.response?.status);
      console.log('❌ Step 3 error data:', JSON.stringify(error?.response?.data));
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={3}
      eyebrow="Profile Details"
      title="What's your dietary preference?"
      primaryLabel="Next"
      onPrimaryPress={handleNext}
      primaryDisabled={!selected}
      primaryLoading={isLoading}
      onPrevious={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(onboarding)/step2');
        }
      }}
    >
      {OPTIONS.map((opt) => (
        <OptionCard
          key={opt.value}
          label={opt.label}
          selected={selected === opt.value}
          onPress={() => setSelected(opt.value)}
          mode="radio"
        />
      ))}
    </OnboardingScaffold>
  );
};

export default OnboardingStep3Screen;