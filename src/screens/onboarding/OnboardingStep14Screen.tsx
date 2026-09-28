import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppDispatch } from '@/src/redux/hooks';
import { saveLookingFor } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import OptionCard from '@/src/components/ui/OptionCard';

const TOTAL_STEPS = 14;

// NOTE: the source text for this screen was garbled in the design export.
// Best-effort read of the options below — please double check the labels
// and descriptions against the Figma file and adjust if needed.
const OPTIONS = [
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

const OnboardingStep14Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

//   const handleSave = async () => {
//     if (!selected) return;
//     setIsLoading(true);
//     try {
//       await api.post('/onboarding/step14/', { looking_for: selected });
//       dispatch(saveLookingFor({ option: selected }));
//       router.push('/(onboarding)/premium');
//     } catch (error: any) {
//       Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

const handleSave = () => {
    router.push('/(tabs)/home')
}

  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={14}
      eyebrow="Lifestyle Details"
      title="What are you looking for?"
      primaryLabel="Save"
      onPrimaryPress={handleSave}
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

export default OnboardingStep14Screen;
