import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppDispatch } from '@/src/redux/hooks';
import { saveFamilyHistory } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import OptionCard from '@/src/components/ui/OptionCard';

const TOTAL_STEPS = 14;

const OPTIONS = [
  { value: 'diabetes_pcod_thyroid_hypertension', label: 'Diabetes/PCOD/Thyroid/Hypertension' },
  { value: 'fatty_liver_constipation_ibs', label: 'Fatty Liver/Constipation/IBS' },
  { value: 'arthritis_osteoporosis', label: 'Arthritis/Osteoporosis' },
  { value: 'migraine', label: 'Migraine' },
  { value: 'others', label: 'Others' },
  { value: 'none', label: 'None' },
];

const OnboardingStep7Screen: React.FC = () => {
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

//   const handleNext = async () => {
//     if (selected.length === 0) return;
//     setIsLoading(true);
//     try {
//       await api.post('/onboarding/step7/', { family_health_history: selected });
//       dispatch(saveFamilyHistory({ conditions: selected }));
//       router.push('/(onboarding)/step8');
//     } catch (error: any) {
//       Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

  const handleNext = () => {
    router.push('/(onboarding)/step8');
  };

  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={7}
      eyebrow="Profile Details"
      title={"Do you have any of the following health\nconditions in family history?"}
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

export default OnboardingStep7Screen;
