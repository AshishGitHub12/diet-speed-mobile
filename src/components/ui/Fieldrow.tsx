import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

interface FieldRowProps {
  icon: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

const FieldRow: React.FC<FieldRowProps> = ({ icon, children, style }) => (
  <View style={[styles.row, leafRadius(BorderRadius.lg), style]}>
    <Text style={styles.icon}>{icon}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
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