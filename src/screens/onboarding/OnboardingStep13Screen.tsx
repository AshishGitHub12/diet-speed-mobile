import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppDispatch } from '@/src/redux/hooks';
import { saveGoal } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import OptionCard from '@/src/components/ui/OptionCard';

const TOTAL_STEPS = 14;

const OPTIONS = [
  { value: 'weight_lose', label: 'Weight Lose' },
  { value: 'weight_gain', label: 'Weight Gain' },
  { value: 'lifestyle_management', label: 'Lifestyle Management' },
  { value: 'stamina_mobility', label: 'Stamina & Mobility' },
  { value: 'strength_conditioning', label: 'Strength & Conditioning' },
];

const OnboardingStep13Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

//   const handleNext = async () => {
//     if (!selected) return;
//     setIsLoading(true);
//     try {
//       await api.post('/onboarding/step13/', { goal: selected });
//       dispatch(saveGoal({ goal: selected }));
//       router.push('/(onboarding)/step14');
//     } catch (error: any) {
//       Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

  const handleNext = () => {
    router.push('/(onboarding)/step14');
  };

  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={13}
      eyebrow="Lifestyle Details"
      title="What is your goal?"
      primaryLabel="Next"
      onPrimaryPress={handleNext}
      primaryDisabled={!selected}
      primaryLoading={isLoading}
      onPrevious={() => router.back()}
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

export default OnboardingStep13Screen;
