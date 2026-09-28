import * as SecureStore from 'expo-secure-store';

const CURRENT_STEP_KEY = 'onboarding_current_step';
const SUBMITTED_STEPS_KEY = 'onboarding_submitted_steps';
const IN_PROGRESS_KEY = 'onboarding_in_progress';

const parseSubmittedSteps = (raw: string | null): number[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
};

export const getCurrentOnboardingStep = async (): Promise<number | null> => {
  const raw = await SecureStore.getItemAsync(CURRENT_STEP_KEY);
  if (!raw) return null;
  const step = parseInt(raw, 10);
  return Number.isNaN(step) ? null : step;
};

export const setCurrentOnboardingStep = async (step: number): Promise<void> => {
  await SecureStore.setItemAsync(CURRENT_STEP_KEY, String(step));
  await SecureStore.setItemAsync(IN_PROGRESS_KEY, 'true');
};

export const isOnboardingInProgress = async (): Promise<boolean> => {
  return (await SecureStore.getItemAsync(IN_PROGRESS_KEY)) === 'true';
};

export const getSubmittedOnboardingSteps = async (): Promise<number[]> => {
  return parseSubmittedSteps(await SecureStore.getItemAsync(SUBMITTED_STEPS_KEY));
};

export const isOnboardingStepSubmitted = async (step: number): Promise<boolean> => {
  const submitted = await getSubmittedOnboardingSteps();
  return submitted.includes(step);
};

export const markOnboardingStepSubmitted = async (step: number): Promise<void> => {
  const submitted = await getSubmittedOnboardingSteps();
  if (submitted.includes(step)) return;
  await SecureStore.setItemAsync(
    SUBMITTED_STEPS_KEY,
    JSON.stringify([...submitted, step]),
  );
};

export const clearOnboardingProgress = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(CURRENT_STEP_KEY);
  await SecureStore.deleteItemAsync(SUBMITTED_STEPS_KEY);
  await SecureStore.deleteItemAsync(IN_PROGRESS_KEY);
};

export const getOnboardingResumeRoute = async (): Promise<string> => {
  const step = (await getCurrentOnboardingStep()) ?? 1;
  return `/(onboarding)/step${step}`;
};
