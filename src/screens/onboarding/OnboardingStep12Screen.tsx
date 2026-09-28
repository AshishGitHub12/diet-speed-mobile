import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppDispatch } from '@/src/redux/hooks';
import { saveAlcohol } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import ChipToggle from '@/src/components/ui/ChipToggle';

const TOTAL_STEPS = 14;
const OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'socially', label: 'Socially' },
];

const OnboardingStep12Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

//   const handleNext = async () => {
//     if (!selected) return;
//     setIsLoading(true);
//     try {
//       await api.post('/onboarding/step12/', { alcohol: selected });
//       dispatch(saveAlcohol({ status: selected }));
//       router.push('/(onboarding)/step13');
//     } catch (error: any) {
//       Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

  const handleNext = () => {
    router.push('/(onboarding)/step13');
  };

  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={12}
      eyebrow="Lifestyle Details"
      title="Do you consume alcohol?"
      primaryLabel="Next"
      onPrimaryPress={handleNext}
      primaryDisabled={!selected}
      primaryLoading={isLoading}
      onPrevious={() => router.back()}
    >
      <ChipToggle options={OPTIONS} selected={selected} onSelect={setSelected} />
    </OnboardingScaffold>
  );
};

export default OnboardingStep12Screen;
