import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getAccessToken } from '@/src/utils/secureStore';
import {
  clearOnboardingProgress,
  getOnboardingResumeRoute,
  isOnboardingInProgress,
  setCurrentOnboardingStep,
} from '@/src/utils/onboardingStore';
import { setTokens, setOnboarded } from '@/src/redux/authSlice';
import { setProfile } from '@/src/redux/userSlice';
import { useAppDispatch } from '@/src/redux/hooks';
import api from '@/src/services/api';
import { Colors } from '@/src/constants/theme';

export default function Index() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        // No token — go to login
        router.replace('/(auth)/login');
        return;
      }

      // Token exists — restore to Redux and verify with profile call
      dispatch(setTokens({ access: accessToken, refresh: '' }));

      const response = await api.get('/profile/');
      const profile = response.data;

      dispatch(setProfile(profile));
      dispatch(setOnboarded(profile.onboarding_completed));

      const inProgress = await isOnboardingInProgress();

      if (profile.onboarding_completed && !inProgress) {
        await clearOnboardingProgress();
        router.replace('/(tabs)/home');
      } else {
        const resumeRoute = await getOnboardingResumeRoute();
        const stepMatch = resumeRoute.match(/step(\d+)/);
        if (stepMatch) {
          await setCurrentOnboardingStep(parseInt(stepMatch[1], 10));
        }
        router.replace(resumeRoute as '/(onboarding)/step1');
      }
    } catch {
      // Token invalid or expired and refresh failed — go to login
      router.replace('/(auth)/login');
    }
  };

  // Show spinner while checking
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}