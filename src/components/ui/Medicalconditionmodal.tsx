import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Fonts } from '../../constants/theme';
import PrimaryButton from '../ui/PrimaryButton';

const CONDITIONS = [
  'Pre Diabetes',
  'Migraine',
  'Thyroid',
  'PCOD',
  'Type 2 Diabetes',
  'Back Pain',
  'Knee Pain',
  'Hypertension',
  'Liver Disease',
  'Kidney Disease',
  'Elevated Cholesterol',
  'IBS',
  'Acidity',
  'Cancer',
  'Depression',
  'Arthritis',
  'Menopause',
  'None',
];

interface MedicalConditionModalProps {
  visible: boolean;
  initialSelected?: string[];
  onConfirm: (selected: string[]) => void;
  onClose: () => void;
}

const MedicalConditionModal: React.FC<MedicalConditionModalProps> = ({
  visible,
  initialSelected = [],
  onConfirm,
  onClose,
}) => {
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const toggleCondition = (condition: string) => {
    if (condition === 'None') {
      // Selecting None clears everything else
      setSelected(selected.includes('None') ? [] : ['None']);
      return;
    }
    // Selecting any other condition removes "None"
    setSelected((prev) => {
      const withoutNone = prev.filter((c) => c !== 'None');
      if (withoutNone.includes(condition)) {
        return withoutNone.filter((c) => c !== condition);
      }
      return [...withoutNone, condition];
    });
  };

  const isSelected = (condition: string) => selected.includes(condition);
  const hasSelection = selected.length > 0;

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  // Build rows of 3
  const rows: string[][] = [];
  for (let i = 0; i < CONDITIONS.length; i += 3) {
    rows.push(CONDITIONS.slice(i, i + 3));
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((condition) => {
                  const active = isSelected(condition);
                  const isNone = condition === 'None';
                  return (
                    <TouchableOpacity
                      key={condition}
                      style={[
                        styles.chip,
                        active && (isNone ? styles.chipNoneSelected : styles.chipSelected),
                      ]}
                      onPress={() => toggleCondition(condition)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && (isNone ? styles.chipNoneText : styles.chipTextSelected),
                        ]}
                        numberOfLines={2}
                        textBreakStrategy="balanced"
                      >
                        {condition}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton
              title="Next"
              onPress={handleConfirm}
              disabled={!hasSelection}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(30, 45, 28, 0.55)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    maxHeight: '85%',
  },
  scrollContent: {
    gap: 10,
    paddingBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-start',
  },
  chip: {
    flex: 1,
    minHeight: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipNoneSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primaryMuted,
  },
  chipText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textDark,
    textAlign: 'center',
    fontWeight: '400',
  },
  chipTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  chipNoneText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    marginTop: Spacing.md,
  },
});

export default MedicalConditionModal;