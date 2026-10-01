import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { saveHealthConditions } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import { markOnboardingStepSubmitted, setCurrentOnboardingStep } from '@/src/utils/onboardingStore';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import OptionCard from '@/src/components/ui/OptionCard';
import UploadBox from '@/src/components/ui/UploadBox';

const TOTAL_STEPS = 13; // was 14 — report upload is no longer its own screen

const OPTIONS = [
  { value: 'diabetes_pcod_thyroid_hypertension', label: 'Diabetes/PCOD/Thyroid/Hypertension' },
  { value: 'fatty_liver_constipation_ibs', label: 'Fatty Liver/Constipation/IBS' },
  { value: 'arthritis_osteoporosis', label: 'Arthritis/Osteoporosis' },
  { value: 'migraine', label: 'Migraine' },
  { value: 'others', label: 'Others' },
  { value: 'none', label: 'None' },
];

type PickedFile = { uri: string; name: string; mimeType: string };

const OnboardingStep5Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Restore previous state so "Previous" from Step 6 isn't a blank screen.
  const healthConditionsState = useAppSelector((state: any) => state.onboarding.healthConditions);
  const [selected, setSelected] = useState<string[]>(healthConditionsState?.conditions ?? []);
  const [file, setFile] = useState<PickedFile | null>(null);
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

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Camera access is required to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.fileName ?? `report_${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setFile({
        uri: asset.uri,
        name: asset.fileName ?? `report_${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (asset) {
      setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/pdf' });
    }
  };

  const handlePickFile = () => {
    Alert.alert('Upload Report (optional)', 'Choose how you want to add your report', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickFromGallery },
      { text: 'Upload PDF', onPress: pickDocument },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleNext = async () => {
    if (selected.length === 0 || isLoading) return;
    setIsLoading(true);
    try {
      // One call for the whole screen: health_conditions is always sent;
      // health_report is attached only if the user picked a file. Since the
      // request has a file, it must go as multipart/form-data — DRF's
      // ListField reads repeated `health_conditions` form fields as a list
      // automatically in that mode.
      const formData = new FormData();
      selected.forEach((condition) => formData.append('health_conditions', condition));
      if (file) {
        formData.append('health_report', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        } as any);
      }

      console.log('📤 Step 5 (Health Conditions + Report) conditions:', selected, 'file:', file?.name ?? 'none');

      const { data, status } = await api.post('/onboarding/step5/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('📥 Step 5 response status:', status);
      console.log('📥 Step 5 response data:', JSON.stringify(data, null, 2));

      dispatch(saveHealthConditions({ conditions: selected, reportFileName: file?.name ?? null }));
      await markOnboardingStepSubmitted(5);
      await setCurrentOnboardingStep(6);

      router.push('/(onboarding)/step6');
    } catch (error: any) {
      console.log('❌ Step 5 error status:', error?.response?.status);
      console.log('❌ Step 5 error data:', JSON.stringify(error?.response?.data));
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={5}
      eyebrow="Profile Details"
      title="Do you have any of the following health conditions?"
      subtitle="You can also attach a report — optional."
      primaryLabel="Next"
      onPrimaryPress={handleNext}
      primaryDisabled={selected.length === 0}
      primaryLoading={isLoading}
      onPrevious={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(onboarding)/step4');
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
      <UploadBox fileName={file?.name ?? null} onPress={handlePickFile} />
    </OnboardingScaffold>
  );
};

export default OnboardingStep5Screen;