import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

interface ChipOption {
  value: string;
  label: string;
}

interface ChipToggleProps {
  options: ChipOption[];
  selected: string | null;
  onSelect: (value: string) => void;
  columns?: number; // wrap into a grid instead of a single row when > options.length
}

const ChipToggle: React.FC<ChipToggleProps> = ({ options, selected, onSelect }) => (
  <View style={styles.row}>
    {options.map((opt) => {
      const isSelected = opt.value === selected;
      return (
        <TouchableOpacity
          key={opt.value}
          style={[styles.chip, isSelected && styles.chipSelected]}
          onPress={() => onSelect(opt.value)}
          activeOpacity={0.75}
        >
          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexGrow: 1,
    minWidth: '30%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textDark,
    fontWeight: '600',
  },
  chipTextSelected: { color: Colors.white },
});

export default ChipToggle;
