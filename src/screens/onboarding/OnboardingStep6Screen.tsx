import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { saveHealthConditions } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import UploadBox from '@/src/components/ui/UploadBox';

const TOTAL_STEPS = 14;

const OnboardingStep6Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const healthConditions = useAppSelector((state) => state.onboarding.healthConditions);

  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePickFile = () => {
    // TODO: wire up expo-document-picker (or similar) here and setFileName
    // to the picked file's name.
    setFileName('report.pdf');
  };

  const submit = async (skip: boolean) => {
    setIsLoading(true);
    try {
      if (!skip && fileName) {
        await api.post('/onboarding/step6/', { report_file_name: fileName });
      }
      dispatch(saveHealthConditions({
        conditions: healthConditions?.conditions ?? [],
        reportFileName: skip ? null : fileName,
      }));
      router.push('/(onboarding)/step7');
    } catch (error: any) {
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
      title="Upload any relevant medical reports"
      subtitle="Optional — this helps us personalize your plan."
      primaryLabel={fileName ? 'Next' : 'Skip'}
      onPrimaryPress={() => submit(!fileName)}
      primaryLoading={isLoading}
      onPrevious={() => router.back()}
    >
      <UploadBox fileName={fileName} onPress={handlePickFile} />
    </OnboardingScaffold>
  );
};

export default OnboardingStep6Screen;
