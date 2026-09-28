import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppDispatch } from '@/src/redux/hooks';
import { saveActivityLevel } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import OptionCard from '@/src/components/ui/OptionCard';

const TOTAL_STEPS = 14;

const OPTIONS = [
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

const OnboardingStep8Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

//   const handleNext = async () => {
//     if (!selected) return;
//     setIsLoading(true);
//     try {
//       await api.post('/onboarding/step8/', { activity_level: selected });
//       dispatch(saveActivityLevel({ level: selected }));
//       router.push('/(onboarding)/step9');
//     } catch (error: any) {
//       Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

  const handleNext = () => {
    router.push('/(onboarding)/step9');
  };
  
  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={8}
      eyebrow="Activity Level"
      title="What is your baseline activity level?"
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
          description={opt.description}
          selected={selected === opt.value}
          onPress={() => setSelected(opt.value)}
          mode="radio"
        />
      ))}
    </OnboardingScaffold>
  );
};

export default OnboardingStep8Screen;
