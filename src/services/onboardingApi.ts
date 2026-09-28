import api from '@/src/services/api';
import {
  isOnboardingStepSubmitted,
  markOnboardingStepSubmitted,
} from '@/src/utils/onboardingStore';

type SubmitOptions = {
  step: number;
  endpoint: string;
  payload: Record<string, unknown>;
  /** Skip the network call when this step was already submitted successfully. */
  skipIfSubmitted?: boolean;
};

/**
 * Submit an onboarding step once. Re-submitting the same step (e.g. after
 * going back and pressing Next again) is skipped to avoid duplicate POST errors.
 */
export const submitOnboardingStep = async ({
  step,
  endpoint,
  payload,
  skipIfSubmitted = true,
}: SubmitOptions): Promise<boolean> => {
  if (skipIfSubmitted && (await isOnboardingStepSubmitted(step))) {
    return false;
  }

  await api.post(endpoint, payload);
  await markOnboardingStepSubmitted(step);
  return true;
};
