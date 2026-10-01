import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { saveProfileDetails, setLoading, setError } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import { markOnboardingStepSubmitted, setCurrentOnboardingStep } from '@/src/utils/onboardingStore';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import FieldRow from '@/src/components/ui/Fieldrow';
import DropdownModal from '@/src/components/ui/Dropdownmodal';
import SimpleDateSelector from '@/src/components/ui/SimpleDateSelector';

const TOTAL_STEPS = 14;
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const GENDER_ICONS: Record<string, string> = {
  Male: '♂️',
  Female: '♀️',
  Other: '⚧️',
  'Prefer not to say': '🙈',
};
const HEIGHT_UNITS = ['cm', 'ft'];

const formatDobForApi = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// API stores gender lowercase ("male", "prefer not to say"); the UI displays
// it Title Case. Convert both directions so restoring from Redux matches
// what GENDERS/GENDER_ICONS expect.
const GENDER_API_TO_LABEL: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  'prefer not to say': 'Prefer not to say',
};

const parseDobFromApi = (dobStr?: string | null): Date => {
  if (!dobStr) return new Date(1996, 0, 1);
  const parsed = new Date(dobStr);
  return Number.isNaN(parsed.getTime()) ? new Date(1996, 0, 1) : parsed;
};

const OnboardingStep2Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Restore whatever was already entered/saved, so "Previous" from Step 3
  // doesn't come back to a blank/default form.
  const profileDetails = useAppSelector((state: any) => state.onboarding.profileDetails);

  const [dob, setDob] = useState(parseDobFromApi(profileDetails?.dob));
  const [gender, setGender] = useState(
    GENDER_API_TO_LABEL[profileDetails?.gender ?? ''] ?? 'Male',
  );
  const [weight, setWeight] = useState(
    profileDetails?.weight != null ? String(profileDetails.weight) : '',
  );
  const [height, setHeight] = useState(
    profileDetails?.height != null ? String(profileDetails.height) : '',
  );
  const [heightUnit, setHeightUnit] = useState(profileDetails?.height_unit ?? 'cm');
  const [isLoading, setIsLoading] = useState(false);

  const [showGender, setShowGender] = useState(false);
  const [showHeightUnit, setShowHeightUnit] = useState(false);

  const isFormValid = !!weight && !!height;

  const handleNext = async () => {
    if (!isFormValid || isLoading) return;

    setIsLoading(true);
    dispatch(setLoading(true));

    try {
      // Step 2 (Profile Details, 14%) — its own call now. name/email/phone
      // already went to /onboarding/step1/ on the previous screen, and
      // medical/health conditions belong to step 5, not here.
      const payload = {
        dob: formatDobForApi(dob),
        gender: gender.toLowerCase(),
        height: parseFloat(height),
        height_unit: heightUnit,
        weight: parseFloat(weight),
      };

      console.log('📤 Step 2 (Profile Details) payload:', payload);

      const { data, status } = await api.post('/onboarding/step2/', payload);

      console.log('📥 Step 2 response status:', status);
      console.log('📥 Step 2 response data:', JSON.stringify(data, null, 2));
      // Expect: { message: "Saved", data: { ...profile, bmi: <number> } }
      // If data.data.bmi is null here, height/weight/height_unit didn't all
      // reach the backend together — check the payload log above first.

      await markOnboardingStepSubmitted(2);
      await setCurrentOnboardingStep(3);

      dispatch(saveProfileDetails({ ...payload, bmi: data?.data?.bmi ?? null }));

      router.push('/(onboarding)/step3');
    } catch (error: any) {
      const message = error?.response?.data?.message
        || JSON.stringify(error?.response?.data)
        || 'Something went wrong. Please try again.';

      console.log('❌ Step 2 error status:', error?.response?.status);
      console.log('❌ Step 2 error data:', JSON.stringify(error?.response?.data));
      dispatch(setError(message));
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={2}
      eyebrow="Profile Details"
      title={"Let's get to know each other before\nwe dive into the details"}
      primaryLabel="Next"
      onPrimaryPress={handleNext}
      primaryDisabled={!isFormValid}
      primaryLoading={isLoading}
      onPrevious={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          // No screen behind this one in the stack (e.g. reached Step 2
          // directly via onboarding-resume, or a dev fast-refresh reset the
          // stack) — fall back to an explicit route instead of crashing.
          router.replace('/(onboarding)/step1');
        }
      }}
    >
      <SimpleDateSelector date={dob} onChange={setDob} />

      {/* Gender — icon changes with selection */}
      <TouchableOpacity style={styles.selectorRow} onPress={() => setShowGender(true)} activeOpacity={0.75}>
        <Text style={styles.selectorIcon}>{GENDER_ICONS[gender]}</Text>
        <Text style={styles.selectorValue}>{gender}</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <FieldRow icon="⚖️">
        <TextInput
          style={styles.editableInput}
          value={weight}
          onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ''))}
          placeholder="Weight"
          placeholderTextColor={Colors.textPlaceholder}
          keyboardType="decimal-pad"
          returnKeyType="done"
          maxLength={6}
        />
        <View style={styles.unitBadge}>
          <Text style={styles.unitBadgeText}>kg</Text>
        </View>
      </FieldRow>

      <FieldRow icon="↕">
        <TextInput
          style={styles.editableInput}
          value={height}
          onChangeText={(t) => setHeight(t.replace(/[^0-9.]/g, ''))}
          placeholder="Height"
          placeholderTextColor={Colors.textPlaceholder}
          keyboardType="decimal-pad"
          returnKeyType="done"
          maxLength={6}
        />
        <TouchableOpacity style={styles.unitDropdown} onPress={() => setShowHeightUnit(true)}>
          <Text style={styles.unitDropdownText}>{heightUnit}</Text>
          <Text style={styles.unitDropdownArrow}>▾</Text>
        </TouchableOpacity>
      </FieldRow>

      <DropdownModal
        visible={showGender}
        title="Select Gender"
        options={GENDERS}
        optionIcons={GENDER_ICONS}
        selected={gender}
        onSelect={setGender}
        onClose={() => setShowGender(false)}
      />
      <DropdownModal
        visible={showHeightUnit}
        title="Height Unit"
        options={HEIGHT_UNITS}
        selected={heightUnit}
        onSelect={setHeightUnit}
        onClose={() => setShowHeightUnit(false)}
      />
    </OnboardingScaffold>
  );
};

const styles = StyleSheet.create({
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    minHeight: 56,
    gap: Spacing.sm,
  },
  selectorIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  selectorValue: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.textDark },
  chevron: { fontSize: 22, color: Colors.textMuted },

  editableInput: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.textDark, paddingVertical: 4 },

  unitBadge: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  unitBadgeText: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },

  unitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  unitDropdownText: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
  unitDropdownArrow: { fontSize: 10, color: Colors.primary },
});

export default OnboardingStep2Screen;