import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppDispatch } from '@/src/redux/hooks';
import { saveAllergies } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
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
  const [selected, setSelected] = useState<string[]>([]);
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

  // const handleNext = async () => {
  //   if (selected.length === 0) return;
  //   setIsLoading(true);
  //   try {
  //     await api.post('/onboarding/step4/', { allergies: selected });
  //     dispatch(saveAllergies({ allergies: selected }));
  //     router.push('/(onboarding)/step5');
  //   } catch (error: any) {
  //     Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleNext = () => {
    router.push('/(onboarding)/step5');
  }

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
      onPrevious={() => router.back()}
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
