import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { saveAllergies } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import { markOnboardingStepSubmitted, setCurrentOnboardingStep } from '@/src/utils/onboardingStore';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import OptionCard from '@/src/components/ui/OptionCard';

const TOTAL_STEPS = 14;

const OPTIONS = [
  { value: 'dairy', label: 'Dairy' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'fish', label: 'Fish' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'peanuts', label: 'Peanuts' },
  { value: 'others', label: 'Others' },
  { value: 'none', label: 'None' },
];

const OnboardingStep4Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Restore previous selection so "Previous" from Step 5 isn't a blank screen.
  const allergiesState = useAppSelector((state: any) => state.onboarding.allergies);
  const [selected, setSelected] = useState<string[]>(allergiesState?.allergies ?? []);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = (value: string) => {
    if (value === 'none') {
      setSelected(['none']);
      return;
    }
    setSelected((prev) => {
      const withoutNone = prev.filter((v) => v !== 'none');
      return withoutNone.includes(value)
        ? withoutNone.filter((v) => v !== value)
        : [...withoutNone, value];
    });
  };

  const handleNext = async () => {
    if (selected.length === 0 || isLoading) return;
    setIsLoading(true);
    try {
      // NOTE: the backend serializer field is `food_allergies`, not `allergies`.
      const payload = { food_allergies: selected };
      console.log('📤 Step 4 (Allergies) payload:', payload);

      const { data, status } = await api.post('/onboarding/step4/', payload);
      console.log('📥 Step 4 response status:', status);
      console.log('📥 Step 4 response data:', JSON.stringify(data, null, 2));

      dispatch(saveAllergies({ allergies: selected }));
      await markOnboardingStepSubmitted(4);
      await setCurrentOnboardingStep(5);

      router.push('/(onboarding)/step5');
    } catch (error: any) {
      console.log('❌ Step 4 error status:', error?.response?.status);
      console.log('❌ Step 4 error data:', JSON.stringify(error?.response?.data));
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={4}
      eyebrow="Profile Details"
      title="Do you have any food allergies?"
      primaryLabel="Next"
      onPrimaryPress={handleNext}
      primaryDisabled={selected.length === 0}
      primaryLoading={isLoading}
      onPrevious={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(onboarding)/step3');
        }
      }}
    >
      {OPTIONS.map((opt) => (
        <OptionCard
          key={opt.value}
          label={opt.label}
          selected={selected.includes(opt.value)}
          onPress={() => toggle(opt.value)}
          mode="checkbox"
        />
      ))}
    </OnboardingScaffold>
  );
};

export default OnboardingStep4Screen;