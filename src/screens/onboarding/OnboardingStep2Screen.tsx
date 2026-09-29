import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { saveStep1 } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
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

const OnboardingStep2Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const step1Draft = useAppSelector((state) => state.onboarding.step1Draft);

  const [dob, setDob] = useState(new Date(1996, 0, 1));
  const [gender, setGender] = useState('Male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [isLoading, setIsLoading] = useState(false);

  const [showGender, setShowGender] = useState(false);
  const [showHeightUnit, setShowHeightUnit] = useState(false);

  const isFormValid = !!weight && !!height;

  const handleNext = async () => {
    if (!isFormValid) return;
    if (!step1Draft) {
      router.replace('/(onboarding)/step3');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        name: step1Draft.name,
        dob: formatDobForApi(dob),
        gender: gender.toLowerCase(),
        height: parseFloat(height),
        height_unit: heightUnit,
        weight: parseFloat(weight),
        // Medical conditions are collected later (step 5), but the step1
        // endpoint still expects this key.
        medical_conditions: ['none'],
      };

      console.log('📤 Step 1+2 combined payload:', payload);
      await api.post('/onboarding/step1/', payload);

      dispatch(saveStep1({
        ...step1Draft,
        ...payload,
      }));

      router.push('/(onboarding)/step3');
    } catch (error: any) {
      console.log('❌ Step 2 error:', JSON.stringify(error?.response?.data));
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
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
      onPrevious={() => router.back()}
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