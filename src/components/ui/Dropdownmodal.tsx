import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, BorderRadius, Fonts, Spacing } from '../../constants/theme';

interface DropdownModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const DropdownModal: React.FC<DropdownModalProps> = ({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.option, opt === selected && styles.optionActive]}
            onPress={() => {
              onSelect(opt);
              onClose();
            }}
          >
            <Text style={[styles.optionText, opt === selected && styles.optionTextActive]}>
              {opt}
            </Text>
            {opt === selected && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        ))}
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    width: 280,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: Fonts.sizes.md,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  optionActive: {
    backgroundColor: Colors.primaryMuted,
  },
  optionText: {
    fontSize: Fonts.sizes.md,
    color: Colors.textDark,
  },
  optionTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  check: {
    fontSize: Fonts.sizes.md,
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default DropdownModal;