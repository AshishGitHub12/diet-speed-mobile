import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  Image,
  KeyboardAvoidingView,
  TextInput,
  Alert,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useRouter } from 'expo-router';

import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import { useAppDispatch, useAppSelector } from '@/src/redux/hooks';
import { saveStep3 } from '@/src/redux/onboardingSlice';
import { setOnboarded } from '@/src/redux/authSlice';
import api from '@/src/services/api';
import OnboardingProgress from '@/src/components/ui/Onboardingprogress';
import PrimaryButton from '@/src/components/ui/PrimaryButton';

// ─── Gauge helpers ────────────────────────────────────────────────────────────

const GAUGE_SIZE = 240;
const CX = GAUGE_SIZE / 2;
const CY = GAUGE_SIZE / 2;
const RADIUS = 88;
const STROKE = 14;

// Convert angle (0 = right, 90 = bottom, 180 = left) to SVG x/y
function toXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Draw arc from startDeg to endDeg (standard SVG angles: 0=right, going clockwise)
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = toXY(cx, cy, r, startDeg);
  const end = toXY(cx, cy, r, endDeg);
  const diff = endDeg - startDeg;
  const large = diff > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

// Gauge spans from 180deg (left) to 0deg (right) — 5 equal segments of 36deg each
// Segments: 180→144 red, 144→108 orange, 108→72 yellow, 72→36 light green, 36→0 dark green
const SEGMENTS = [
  { start: 180, end: 144, color: '#E53935' }, // Underweight
  { start: 144, end: 108, color: '#FF9800' }, // Below normal
  { start: 108, end:  72, color: '#FDD835' }, // Normal low
  { start:  72, end:  36, color: '#66BB6A' }, // Normal
  { start:  36, end:   0, color: '#2E7D32' }, // Overweight+
];

// Map BMI → needle angle (180=left underweight, 0=right overweight)
const bmiToAngle = (bmi: number): number => {
  const clamped = Math.min(Math.max(bmi, 10), 40);
  // BMI 10 → 180deg (far left), BMI 40 → 0deg (far right)
  return 180 - ((clamped - 10) / 30) * 180;
};

// ─── BMI Category ─────────────────────────────────────────────────────────────

interface BmiInfo {
  heading: string;
  sublabel: string;
  message: string;
  color: string;
}

const getBmiInfo = (bmi: number): BmiInfo => {
  if (bmi < 18.5) return {
    heading: 'You are Underweight',
    sublabel: 'You need to gain some weight.',
    message: 'Diet Speed can help you gain weight in a healthy and sustainable way.',
    color: '#2196F3',
  };
  if (bmi < 25) return {
    heading: 'Your are in Ideal Weight Category!',
    sublabel: 'Congratulations, You Are Healthy !',
    message: 'Diet Speed can help you further improve your health and weight .',
    color: '#4CAF50',
  };
  if (bmi < 30) return {
    heading: 'You are Overweight',
    sublabel: 'You need to lose some weight.',
    message: 'Diet Speed can help you lose weight effectively and safely.',
    color: '#FF9800',
  };
  return {
    heading: 'You are Obese',
    sublabel: 'Please consult a doctor.',
    message: 'Diet Speed can support your health journey every step of the way.',
    color: '#F44336',
  };
};

// ─── Gauge Component ──────────────────────────────────────────────────────────

const BmiGauge: React.FC<{ bmi: number }> = ({ bmi }) => {
  const angleDeg = bmiToAngle(bmi);
  const angleRad = (angleDeg * Math.PI) / 180;
  const needleLen = RADIUS - 16;
  const nx = CX + needleLen * Math.cos(angleRad);
  const ny = CY + needleLen * Math.sin(angleRad);

  // viewBox height is just top half of circle + padding
  const VH = CY + STROKE + 8;

  return (
    <Svg
      width={GAUGE_SIZE}
      height={VH}
      viewBox={`0 0 ${GAUGE_SIZE} ${VH}`}
    >
      {/* Colour segments */}
      {SEGMENTS.map((seg, i) => (
        <Path
          key={i}
          d={arcPath(CX, CY, RADIUS, seg.start, seg.end)}
          stroke={seg.color}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
        />
      ))}

      {/* Dashed inner arc */}
      <Path
        d={arcPath(CX, CY, RADIUS - 28, 180, 0)}
        stroke="#ccc"
        strokeWidth={1}
        fill="none"
        strokeDasharray="3 5"
      />

      {/* Needle */}
      <Line
        x1={CX} y1={CY}
        x2={nx} y2={ny}
        stroke="#1a1a1a"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Center hub */}
      <Circle cx={CX} cy={CY} r={12} fill="#e0e0e0" />
      <Circle cx={CX} cy={CY} r={5}  fill="#444" />
    </Svg>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

const OnboardingStep3Screen: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Read BMI from Step 2 Redux state
  const step2 = useAppSelector((state) => state.onboarding.step2);
  const bmi = step2?.bmi ?? 22;
  const bmiInfo = getBmiInfo(bmi);

  const [targetWeight, setTargetWeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = !!targetWeight && parseFloat(targetWeight) > 0;

  // ─── API Call ───────────────────────────────────────────────────────────────

  const handleContinue = async () => {
    if (!isFormValid) return;
    setIsLoading(true);
    try {
      const payload = { target_weight: parseFloat(targetWeight) };
      console.log('📤 Step 3 payload:', payload);
      await api.post('/onboarding/step3/', payload);

      dispatch(saveStep3(payload));
      dispatch(setOnboarded(true));
      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.log('❌ Step 3 error:', JSON.stringify(error?.response?.data));
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

      {/* Progress — step 3 of 3 */}
      <View style={styles.progressWrapper}>
        <OnboardingProgress totalSteps={3} currentStep={3} />
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

          <Text style={styles.title}>BMI</Text>
          <Text style={styles.subtitle}>Calculate your BMI</Text>

          {/* Gauge */}
          <View style={styles.gaugeWrapper}>
            <BmiGauge bmi={bmi} />
          </View>

          {/* BMI number */}
          <Text style={[styles.bmiNumber, { color: bmiInfo.color }]}>{bmi}</Text>
          <Text style={styles.bmiLabel}>BMI</Text>

          {/* Category info */}
          <Text style={styles.categoryHeading}>{bmiInfo.heading}</Text>
          <Text style={styles.categorySublabel}>{bmiInfo.sublabel}</Text>
          <Text style={styles.categoryMessage}>{bmiInfo.message}</Text>

          {/* Target weight input */}
          <View style={styles.targetWrapper}>
            <TextInput
              style={styles.targetInput}
              value={targetWeight}
              onChangeText={(t) => setTargetWeight(t.replace(/[^0-9.]/g, ''))}
              placeholder="Set Target Weight in kgs"
              placeholderTextColor="#bbb"
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              maxLength={6}
            />
          </View>

        </ScrollView>

        {/* Fixed bottom button */}
        <View style={styles.bottomBar}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={!isFormValid || isLoading}
            loading={isLoading}
          />
        </View>

      </KeyboardAvoidingView>
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

  logoContainer: { marginTop: Spacing.md, marginBottom: Spacing.lg, alignItems: 'center' },
  logo: { width: 160, height: 60 },

  title: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Fonts.sizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  gaugeWrapper: {
    marginVertical: Spacing.sm,
    alignItems: 'center',
  },

  bmiNumber: {
    fontSize: 52,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  bmiLabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  categoryHeading: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  categorySublabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryMessage: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },

  targetWrapper: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    height: 56,
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  targetInput: {
    fontSize: Fonts.sizes.md,
    color: Colors.textDark,
    padding: 0,
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

export default OnboardingStep3Screen;