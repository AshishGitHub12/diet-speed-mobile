import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

const Tint = {
  mint: '#E1EEDD',
};

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

interface OptionCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  mode?: 'radio' | 'checkbox';
}

const OptionCard: React.FC<OptionCardProps> = ({
  label,
  description,
  selected,
  onPress,
  mode = 'radio',
}) => (
  <TouchableOpacity
    style={[styles.card, leafRadius(BorderRadius.lg), selected && styles.cardSelected]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={styles.textWrap}>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>

    {mode === 'radio' ? (
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    ) : (
      <View style={[styles.checkboxOuter, selected && styles.checkboxOuterSelected]}>
        {selected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    gap: Spacing.sm,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Tint.mint,
  },

  textWrap: { flex: 1 },
  label: {
    fontSize: Fonts.sizes.md,
    color: Colors.textDark,
    fontWeight: '600',
  },
  labelSelected: { color: Colors.primary },
  description: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  radioOuterSelected: { borderColor: Colors.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },

  checkboxOuter: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxOuterSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
});

export default OptionCard;