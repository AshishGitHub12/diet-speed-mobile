import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { saveFamilyHistory } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import { markOnboardingStepSubmitted, setCurrentOnboardingStep } from '@/src/utils/onboardingStore';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import OptionCard from '@/src/components/ui/OptionCard';

const TOTAL_STEPS = 12; // matches the merged flow: conditions+report merged (5), activity+exercise merged (7)

const OPTIONS = [
  { value: 'diabetes_pcod_thyroid_hypertension', label: 'Diabetes/PCOD/Thyroid/Hypertension' },
  { value: 'fatty_liver_constipation_ibs', label: 'Fatty Liver/Constipation/IBS' },
  { value: 'arthritis_osteoporosis', label: 'Arthritis/Osteoporosis' },
  { value: 'migraine', label: 'Migraine' },
  { value: 'others', label: 'Others' },
  { value: 'none', label: 'None' },
];

const OnboardingStep6Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Restore previous selection so "Previous" from Step 7 isn't a blank screen.
  const familyHistoryState = useAppSelector((state: any) => state.onboarding.familyHistory);
  const [selected, setSelected] = useState<string[]>(familyHistoryState?.conditions ?? []);
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
      // Field name is `family_health_conditions`, matching the model —
      // not `family_health_history`.
      const payload = { family_health_conditions: selected };
      console.log('📤 Step 6 (Family History) payload:', payload);

      const { data, status } = await api.post('/onboarding/step6/', payload);
      console.log('📥 Step 6 response status:', status);
      console.log('📥 Step 6 response data:', JSON.stringify(data, null, 2));

      dispatch(saveFamilyHistory({ conditions: selected }));
      await markOnboardingStepSubmitted(6);
      await setCurrentOnboardingStep(7);

      router.push('/(onboarding)/step7');
    } catch (error: any) {
      console.log('❌ Step 6 error status:', error?.response?.status);
      console.log('❌ Step 6 error data:', JSON.stringify(error?.response?.data));
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={6}
      eyebrow="Profile Details"
      title={"Do you have any of the following health\nconditions in family history?"}
      primaryLabel="Next"
      onPrimaryPress={handleNext}
      primaryDisabled={selected.length === 0}
      primaryLoading={isLoading}
      onPrevious={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(onboarding)/step5');
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

export default OnboardingStep6Screen;