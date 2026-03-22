import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, Spacing, Fonts, BorderRadius } from '../../constants/theme';
import { useAppDispatch } from '../../redux/hooks';
import { saveStep1 } from '../../redux/onboardingSlice';
import api from '../../services/api';
import OnboardingProgress from '../../components/ui/OnboardingProgress';
import PrimaryButton from '../../components/ui/PrimaryButton';
import InputField from '../../components/ui/InputField';
import FieldRow from '../../components/ui/FieldRow';
import DropdownModal from '../../components/ui/DropdownModal';
import CalendarPicker, { MONTHS } from '../../components/ui/CalendarPicker';
import MedicalConditionModal from '../../components/ui/MedicalConditionModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
const HEIGHT_UNITS = ['cm', 'ft'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDob = (d: Date) =>
  `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

// Format date to YYYY-MM-DD for API
const formatDobForApi = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const OnboardingStep1Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Form state
  const [name, setName] = useState('');
  const [dob, setDob] = useState(new Date(1996, 0, 1));
  const [gender, setGender] = useState('Male');
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('180');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal visibility
  const [showDob, setShowDob] = useState(false);
  const [showGender, setShowGender] = useState(false);
  const [showHeightUnit, setShowHeightUnit] = useState(false);
  const [showMedical, setShowMedical] = useState(false);

  const medicalLabel =
    medicalConditions.length > 0 ? medicalConditions.join(', ') : undefined;

  const isFormValid = name.trim().length > 0;

  // ─── API Call ────────────────────────────────────────────────────────────────

  const handleNext = async () => {
    if (!isFormValid) return;
    setIsLoading(true);

    try {
      const payload = {
        name: name.trim(),
        dob: formatDobForApi(dob),
        gender: gender.toLowerCase(),
        height: parseFloat(height),
        height_unit: heightUnit,
        weight: parseFloat(weight),
        medical_conditions: medicalConditions.length > 0
          ? medicalConditions.map(c => c.toLowerCase())
          : ['none'],
      };

      console.log('📤 Step 1 payload:', payload);
      await api.post('/auth/onboarding/step1/', payload);

      // Save to Redux for use in step 2
      dispatch(saveStep1({
        name: payload.name,
        dob: dob.toISOString(),
        gender: payload.gender,
        height: payload.height,
        height_unit: payload.height_unit,
        weight: payload.weight,
        medical_conditions: payload.medical_conditions,
      }));

      router.push('/(onboarding)/step2');
    } catch (error: any) {
      console.log('❌ Step 1 error:', JSON.stringify(error?.response?.data));
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* Progress bar */}
      <View style={styles.progressWrapper}>
        <OnboardingProgress totalSteps={3} currentStep={1} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Heading */}
          <Text style={styles.heading}>
            Let's get to know each other before{'\n'}we dive into the details
          </Text>

          {/* ── Form fields ── */}
          <View style={styles.formContainer}>

            {/* 1 · Name */}
            <InputField
              label="What's your name?"
              required
              value={name}
              onChangeText={setName}
              returnKeyType="done"
            />

            {/* 2 · Date of Birth */}
            <TouchableOpacity
              style={styles.selectorRow}
              onPress={() => setShowDob(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.selectorIcon}>🎂</Text>
              <Text style={styles.selectorValue}>{formatDob(dob)}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {/* 3 · Gender */}
            <TouchableOpacity
              style={styles.selectorRow}
              onPress={() => setShowGender(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.selectorIcon}>⚥</Text>
              <Text style={styles.selectorValue}>{gender}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            {/* 4 · Weight */}
            <FieldRow icon="⚖️">
              <TextInput
                style={styles.editableInput}
                value={weight}
                onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={6}
              />
              <View style={styles.unitBadge}>
                <Text style={styles.unitBadgeText}>kg</Text>
              </View>
            </FieldRow>

            {/* 5 · Height */}
            <FieldRow icon="↕">
              <TextInput
                style={styles.editableInput}
                value={height}
                onChangeText={(t) => setHeight(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={6}
              />
              <TouchableOpacity
                style={styles.unitDropdown}
                onPress={() => setShowHeightUnit(true)}
              >
                <Text style={styles.unitDropdownText}>{heightUnit}</Text>
                <Text style={styles.unitDropdownArrow}>▾</Text>
              </TouchableOpacity>
            </FieldRow>

            {/* 6 · Medical Condition */}
            <TouchableOpacity
              style={styles.selectorRow}
              onPress={() => setShowMedical(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.selectorIcon}>📋</Text>
              <Text
                style={[styles.selectorValue, !medicalLabel && styles.selectorPlaceholder]}
                numberOfLines={1}
              >
                {medicalLabel ?? 'Medical Condition'}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

          </View>

          <Text style={styles.footerNote}>Lorem ipsum dolor sit amet consectetur.</Text>

        </ScrollView>

        {/* Fixed bottom button */}
        <View style={styles.bottomBar}>
          <PrimaryButton
            title="Next"
            onPress={handleNext}
            disabled={!isFormValid}
            loading={isLoading}
          />
        </View>

      </KeyboardAvoidingView>

      {/* Modals */}
      <CalendarPicker
        visible={showDob}
        date={dob}
        onChange={setDob}
        onClose={() => setShowDob(false)}
      />
      <DropdownModal
        visible={showGender}
        title="Select Gender"
        options={GENDERS}
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
      <MedicalConditionModal
        visible={showMedical}
        initialSelected={medicalConditions}
        onConfirm={setMedicalConditions}
        onClose={() => setShowMedical(false)}
      />

    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  progressWrapper: {
    paddingTop: Platform.OS === 'android' ? Spacing.lg : Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },

  logoContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  logo: { width: 160, height: 60 },

  heading: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '600',
    color: Colors.textDark,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: Spacing.lg,
  },

  formContainer: { width: '100%', gap: 12, marginBottom: Spacing.lg },

  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    minHeight: 64,
    gap: Spacing.sm,
  },
  selectorIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  selectorValue: { flex: 1, fontSize: Fonts.sizes.md, color: Colors.textDark },
  selectorPlaceholder: { color: Colors.primary },
  chevron: { fontSize: 22, color: Colors.textMuted },

  editableInput: {
    flex: 1,
    fontSize: Fonts.sizes.md,
    color: Colors.textDark,
    paddingVertical: 4,
  },

  unitBadge: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  unitBadgeText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },

  unitDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  unitDropdownText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  unitDropdownArrow: { fontSize: 10, color: Colors.primary },

  footerNote: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? Spacing.md : Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

export default OnboardingStep1Screen;