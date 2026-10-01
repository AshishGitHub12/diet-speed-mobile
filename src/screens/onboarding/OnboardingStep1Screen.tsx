import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, Fonts } from '@/src/constants/theme';
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { saveStep1Draft, setLoading, setError } from '@/src/redux/onboardingSlice';
import api from '@/src/services/api';
import { markOnboardingStepSubmitted, setCurrentOnboardingStep } from '@/src/utils/onboardingStore';
import OnboardingScaffold from '@/src/components/ui/OnboardingScaffold';
import InputField from '@/src/components/ui/InputField';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 14;
const NAME_MAX_LENGTH = 30;
const PHONE_LENGTH = 10;
const FOOTER_NOTE = "We'll use these details to personalise your diet plan.";

// ─── Screen ───────────────────────────────────────────────────────────────────

const OnboardingStep1Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const registeredEmail: string = useAppSelector(
    (state: any) => state.auth?.user?.email ?? '',
  );
  const isEmailPrefilled = registeredEmail.trim().length > 0;

  // Restore whatever was already entered, so tapping "Previous" from Step 2
  // doesn't come back to a blank form.
  const step1Draft = useAppSelector((state: any) => state.onboarding.step1Draft);

  const [name, setName] = useState(step1Draft?.name ?? '');
  const [email, setEmail] = useState(
    step1Draft?.email || registeredEmail.trim().toLowerCase(),
  );
  const [phoneNumber, setPhoneNumber] = useState(step1Draft?.phoneNumber ?? '');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ─── Validation ─────────────────────────────────────────────────────────────

  const isNameValid = name.trim().length > 0;
  const isEmailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const isPhoneValid = phoneNumber.length === PHONE_LENGTH;
  const showPhoneError = phoneTouched && phoneNumber.length > 0 && !isPhoneValid;

  const isFormValid = isNameValid && isEmailValid && isPhoneValid;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text.replace(/[^0-9]/g, '').slice(0, PHONE_LENGTH));
  };

  const handleNext = async () => {
    if (!isFormValid || submitting) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    dispatch(saveStep1Draft({ name: trimmedName, email: trimmedEmail, phoneNumber }));

    setSubmitting(true);
    dispatch(setLoading(true));

    try {
      // Basic Info is its own endpoint now (7%). Profile Details (dob/gender/
      // height/weight) is a SEPARATE call to /onboarding/step2/ from the next
      // screen — it is no longer bundled into this request.
      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        phone_number: phoneNumber,
      };

      console.log('📤 Step 1 (Basic Info) payload:', payload);

      // Sent directly with api.post — NOT the submitOnboardingStep "skip if
      // already submitted" helper. That helper is meant for one-time actions;
      // here the user can go back and edit name/email/phone, so every Next
      // press must actually reach the backend with the latest values.
      const { data, status } = await api.post('/onboarding/step1/', payload);

      console.log('📥 Step 1 response status:', status);
      console.log('📥 Step 1 response data:', JSON.stringify(data, null, 2));

      await markOnboardingStepSubmitted(1);
      await setCurrentOnboardingStep(2);
      router.push('/(onboarding)/step2');
    } catch (err: any) {
      console.log('❌ Step 1 error status:', err?.response?.status);
      console.log('❌ Step 1 error data:', JSON.stringify(err?.response?.data));
      dispatch(setError(err?.response?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <OnboardingScaffold
      totalSteps={TOTAL_STEPS}
      currentStep={1}
      title={"Let's get to know each other before\nwe dive into the details"}
      footerNote={FOOTER_NOTE}
      primaryLabel="Next"
      onPrimaryPress={handleNext}
      primaryDisabled={!isFormValid || submitting}
    >
      {/* Name */}
      <InputField
        placeholder="What's your name*"
        required
        value={name}
        onChangeText={setName}
        maxLength={NAME_MAX_LENGTH}
        autoCapitalize="words"
        returnKeyType="next"
      />

      {/* Email — prefilled from registration, always lowercase */}
      <InputField
        placeholder="What's your email*"
        required
        value={email}
        onChangeText={(t) => setEmail(t.toLowerCase())}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isEmailPrefilled}
        returnKeyType="next"
      />

      {/* Phone — digits only, exactly 10 */}
      <InputField
        placeholder="Phone Number*"
        required
        value={phoneNumber}
        onChangeText={handlePhoneChange}
        onBlur={() => setPhoneTouched(true)}
        keyboardType="number-pad"
        maxLength={PHONE_LENGTH}
        returnKeyType="done"
      />
      {showPhoneError && (
        <Text style={styles.errorText}>
          Enter a valid {PHONE_LENGTH}-digit phone number
        </Text>
      )}
    </OnboardingScaffold>
  );
};

const styles = StyleSheet.create({
  errorText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.error,
    marginTop: -6,
    marginLeft: 4,
  },
});

export default OnboardingStep1Screen;