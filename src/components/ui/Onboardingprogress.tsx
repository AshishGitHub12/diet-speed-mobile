import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';

interface OnboardingProgressProps {
  totalSteps: number;
  currentStep: number; // 1-indexed
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  totalSteps,
  currentStep,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            index < currentStep ? styles.barActive : styles.barInactive,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    paddingHorizontal: 16,
  },
  bar: {
    flex: 1,
    height: 5,
    borderRadius: BorderRadius.full,
  },
  barActive: {
    backgroundColor: Colors.progressActive,
  },
  barInactive: {
    backgroundColor: Colors.progressInactive,
  },
});

export default OnboardingProgress;