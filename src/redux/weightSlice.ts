import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Types — match API responses exactly ──────────────────────────────────────

export interface WeightEntry {
  date: string;    // "YYYY-MM-DD"
  weight: number;
}

export interface WeightTracking {
  current_weight: number;
  target_weight: number;
  data: WeightEntry[];
}

interface WeightState {
  current_weight: number | null;
  target_weight: number | null;
  data: WeightEntry[];
  isLoading: boolean;
  error: string | null;
}

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: WeightState = {
  current_weight: null,
  target_weight: null,
  data: [],
  isLoading: false,
  error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const weightSlice = createSlice({
  name: 'weight',
  initialState,
  reducers: {
    setTracking(state, action: PayloadAction<WeightTracking>) {
      state.current_weight = action.payload.current_weight;
      state.target_weight = action.payload.target_weight;
      state.data = action.payload.data;
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    resetWeight() {
      return initialState;
    },
  },
});

export const { setTracking, setLoading, setError, resetWeight } = weightSlice.actions;
export default weightSlice.reducer;