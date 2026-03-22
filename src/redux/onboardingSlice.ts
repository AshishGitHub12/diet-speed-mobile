import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Types — match API payloads exactly ───────────────────────────────────────

export interface Step1Data {
  name: string;
  dob: string;           // "YYYY-MM-DD"
  gender: string;        // "male" | "female" | "other"
  height: number;
  height_unit: string;   // "cm" | "ft"
  weight: number;
  medical_conditions: string[];
}

export interface Step2Data {
  height: number;
  height_unit: string;
  weight: number;
  bmi: number | null;    // returned by API
}

export interface Step3Data {
  target_weight: number;
}

interface OnboardingState {
  step1: Step1Data | null;
  step2: Step2Data | null;
  step3: Step3Data | null;
  isLoading: boolean;
  error: string | null;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: OnboardingState = {
  step1: null,
  step2: null,
  step3: null,
  isLoading: false,
  error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    saveStep1(state, action: PayloadAction<Step1Data>) {
      state.step1 = action.payload;
      state.error = null;
    },
    saveStep2(state, action: PayloadAction<Step2Data>) {
      state.step2 = action.payload;
      state.error = null;
    },
    saveStep3(state, action: PayloadAction<Step3Data>) {
      state.step3 = action.payload;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    resetOnboarding() {
      return initialState;
    },
  },
});

export const {
  saveStep1, saveStep2, saveStep3,
  setLoading, setError, resetOnboarding,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;