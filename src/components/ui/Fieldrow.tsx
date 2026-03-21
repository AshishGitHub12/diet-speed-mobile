import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

interface FieldRowProps {
  icon: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

const FieldRow: React.FC<FieldRowProps> = ({ icon, children, style }) => (
  <View style={[styles.row, style]}>
    <Text style={styles.icon}>{icon}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    minHeight: 64,
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
});

export default FieldRow;