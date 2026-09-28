import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppDispatch } from '@/src/redux/hooks';
import { saveSleep } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import ChipToggle from '@/src/components/ui/ChipToggle';

const TOTAL_STEPS = 14;
const OPTIONS = [
  { value: 'less_than_4', label: 'Less than 4 hours' },
  { value: '4_5', label: '4-5 hours' },
  { value: '6_7', label: '6-7 hours' },
  { value: '8_10', label: '8-10 hours' },
];

const OnboardingStep10Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

//   const handleNext = async () => {
//     if (!selected) return;
//     setIsLoading(true);
//     try {
//       await api.post('/onboarding/step10/', { sleep_hours: selected });
//       dispatch(saveSleep({ hours: selected }));
//       router.push('/(onboarding)/step11');
//     } catch (error: any) {
//       Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

  const handleNext = () => {
    router.push('/(onboarding)/step11');
  };

  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={10}
      eyebrow="Lifestyle Details"
      title="How much sleep do you usually get?"
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

export default OnboardingStep10Screen;
