import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppDispatch } from '@/src/redux/hooks';
import { saveExercise } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import ChipToggle from '@/src/components/ui/ChipToggle';

const TOTAL_STEPS = 14;
const OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const OnboardingStep9Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

//   const handleNext = async () => {
//     if (!selected) return;
//     setIsLoading(true);
//     try {
//       const exercisesRegularly = selected === 'yes';
//       await api.post('/onboarding/step9/', { exercises_regularly: exercisesRegularly });
//       dispatch(saveExercise({ exercisesRegularly }));
//       router.push('/(onboarding)/step10');
//     } catch (error: any) {
//       Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

  const handleNext = () => {
    router.push('/(onboarding)/step10');
  };
  
  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={9}
      eyebrow="Activity Level"
      title="Do you exercise regularly?"
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

export default OnboardingStep9Screen;
