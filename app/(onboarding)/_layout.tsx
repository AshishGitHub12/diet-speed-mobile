import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';

import { Colors } from '@/src/constants/theme';
import { getAccessToken } from '@/src/utils/secureStore';
import { setCurrentOnboardingStep } from '@/src/utils/onboardingStore';

export default function OnboardingLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = await getAccessToken();
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }
      setReady(true);
    };

    verifyAuth();
  }, [router]);

  useEffect(() => {
    if (!ready) return;

    const stepSegment = segments.find((segment) => /^step\d+$/.test(segment));
    if (!stepSegment) return;

    const step = parseInt(stepSegment.replace('step', ''), 10);
    if (!Number.isNaN(step)) {
      setCurrentOnboardingStep(step);
    }
  }, [ready, segments]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
