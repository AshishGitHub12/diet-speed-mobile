import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Types — match API responses exactly ──────────────────────────────────────

export interface UserProfile {
  id: number;
  name: string;
  dob: string;
  gender: string;
  height: number;
  height_unit: string;
  weight: number;
  bmi: number;
  target_weight: number;
  medical_conditions: string[];
  onboarding_completed: boolean;
  user: number;
}

export interface HomeUser {
  name: string;
  current_weight: number;
  target_weight: number;
  bmi: number;
  bmi_category: string;
}

export interface HomeDate {
  today_date: string;
  day_name: string;
}

export interface SuccessStory {
  id: number;
  name: string;
  result: string;
  image: string;
}

export interface Recipe {
  id: number;
  name: string;
  image: string;
  calories: number;
}

export interface Workout {
  id: number;
  title: string;
  thumbnail: string;
  video_url: string;
  duration: string;
}

export interface HomeData {
  user: HomeUser;
  date: HomeDate;
  success_stories: SuccessStory[];
  recipes: Recipe[];
  workouts: Workout[];
}

interface UserState {
  profile: UserProfile | null;
  homeData: HomeData | null;
  isLoading: boolean;
  error: string | null;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: UserState = {
  profile: null,
  homeData: null,
  isLoading: false,
  error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<UserProfile>) {
      state.profile = action.payload;
      state.error = null;
    },
    setHomeData(state, action: PayloadAction<HomeData>) {
      state.homeData = action.payload;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    resetUser() {
      return initialState;
    },
  },
});

export const { setProfile, setHomeData, setLoading, setError, resetUser } = userSlice.actions;
export default userSlice.reducer;