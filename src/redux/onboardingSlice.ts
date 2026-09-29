import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Types — match API payloads exactly ───────────────────────────────────────

// Draft captured on screen 1 (name/email/phone) before the /onboarding/step1/ call
export interface Step1Draft {
  name: string;
  email: string;
  phoneNumber: string;
}

// Confirmed once POST /onboarding/step1/ succeeds — Basic Info only (7%)
export interface Step1Data {
  name: string;
  email: string;
  phoneNumber: string;
}

// Sent to POST /onboarding/step2/ — Profile Details (14%)
export interface ProfileDetailsData {
  dob: string;            // "YYYY-MM-DD"
  gender: string;         // "male" | "female" | "other"
  height: number;
  height_unit: string;    // "cm" | "ft"
  weight: number;
  bmi?: number | null;    // returned by the API, not sent
}

export interface DietaryPreferenceData {
  preference: string; // 'vegan' | 'pure_vegetarian' | 'ovo_vegetarian' | 'non_vegetarian'
}

export interface AllergiesData {
  allergies: string[]; // 'dairy' | 'eggs' | 'fish' | 'gluten' | 'peanuts' | 'others' | 'none'
}

export interface HealthConditionsData {
  conditions: string[]; // 'diabetes_pcod_thyroid_hypertension' | 'fatty_liver_constipation_ibs' | 'arthritis_osteoporosis' | 'migraine' | 'others' | 'none'
  reportFileName?: string | null;
}

export interface FamilyHistoryData {
  conditions: string[]; // same choices as HealthConditionsData
}

export interface ActivityLevelData {
  level: string; // 'not_very_active' | 'lightly_active' | 'active' | 'very_active'
}

export interface ExerciseData {
  exercisesRegularly: boolean; // send as "yes" | "no" in the API payload
}

export interface SleepData {
  hours: string; // 'less_than_4' | '4_5' | '6_7' | '8_10'
}

export interface SmokingData {
  status: string; // 'yes' | 'no' | 'occasionally'
}

export interface AlcoholData {
  status: string; // 'yes' | 'no' | 'socially'
}

export interface GoalData {
  goal: string; // 'weight_lose' | 'weight_gain' | 'lifestyle_management' | 'stamina_mobility' | 'strength_conditioning'
  targetWeight?: number | null;
}

export interface LookingForData {
  option: string; // see note on backend LOOKING_FOR_CHOICES — confirm final values when we reach this screen
}

interface OnboardingState {
  step1Draft: Step1Draft | null;
  step1: Step1Data | null;
  profileDetails: ProfileDetailsData | null;
  dietaryPreference: DietaryPreferenceData | null;
  allergies: AllergiesData | null;
  healthConditions: HealthConditionsData | null;
  familyHistory: FamilyHistoryData | null;
  activityLevel: ActivityLevelData | null;
  exercise: ExerciseData | null;
  sleep: SleepData | null;
  smoking: SmokingData | null;
  alcohol: AlcoholData | null;
  goal: GoalData | null;
  lookingFor: LookingForData | null;
  isLoading: boolean;
  error: string | null;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: OnboardingState = {
  step1Draft: null,
  step1: null,
  profileDetails: null,
  dietaryPreference: null,
  allergies: null,
  healthConditions: null,
  familyHistory: null,
  activityLevel: null,
  exercise: null,
  sleep: null,
  smoking: null,
  alcohol: null,
  goal: null,
  lookingFor: null,
  isLoading: false,
  error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    saveStep1Draft(state, action: PayloadAction<Step1Draft>) {
      state.step1Draft = action.payload;
      state.error = null;
    },
    saveStep1(state, action: PayloadAction<Step1Data>) {
      state.step1 = action.payload;
      state.error = null;
    },
    saveProfileDetails(state, action: PayloadAction<ProfileDetailsData>) {
      state.profileDetails = action.payload;
      state.error = null;
    },
    saveDietaryPreference(state, action: PayloadAction<DietaryPreferenceData>) {
      state.dietaryPreference = action.payload;
    },
    saveAllergies(state, action: PayloadAction<AllergiesData>) {
      state.allergies = action.payload;
    },
    saveHealthConditions(state, action: PayloadAction<HealthConditionsData>) {
      state.healthConditions = action.payload;
    },
    saveFamilyHistory(state, action: PayloadAction<FamilyHistoryData>) {
      state.familyHistory = action.payload;
    },
    saveActivityLevel(state, action: PayloadAction<ActivityLevelData>) {
      state.activityLevel = action.payload;
    },
    saveExercise(state, action: PayloadAction<ExerciseData>) {
      state.exercise = action.payload;
    },
    saveSleep(state, action: PayloadAction<SleepData>) {
      state.sleep = action.payload;
    },
    saveSmoking(state, action: PayloadAction<SmokingData>) {
      state.smoking = action.payload;
    },
    saveAlcohol(state, action: PayloadAction<AlcoholData>) {
      state.alcohol = action.payload;
    },
    saveGoal(state, action: PayloadAction<GoalData>) {
      state.goal = action.payload;
    },
    saveLookingFor(state, action: PayloadAction<LookingForData>) {
      state.lookingFor = action.payload;
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
  saveStep1Draft,
  saveStep1,
  saveProfileDetails,
  saveDietaryPreference,
  saveAllergies,
  saveHealthConditions,
  saveFamilyHistory,
  saveActivityLevel,
  saveExercise,
  saveSleep,
  saveSmoking,
  saveAlcohol,
  saveGoal,
  saveLookingFor,
  setLoading,
  setError,
  resetOnboarding,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;