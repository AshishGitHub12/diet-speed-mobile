import React, { useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Colors, BorderRadius, Fonts, Spacing } from '../../constants/theme';

interface DropdownModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  /** Optional emoji/icon shown next to each option, keyed by option text */
  optionIcons?: Record<string, string>;
}

const OPTION_HEIGHT = 48;
const OPTION_GAP = 4;

const DropdownModal: React.FC<DropdownModalProps> = ({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  optionIcons,
}) => {
  const { height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  // Jump to the currently selected option (useful for long lists like years)
  const scrollToSelected = () => {
    const index = options.indexOf(selected);
    if (index > 2) {
      scrollRef.current?.scrollTo({
        y: (index - 2) * (OPTION_HEIGHT + OPTION_GAP),
        animated: false,
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.card, { maxHeight: height * 0.6 }]}
        >
          <Text style={styles.title}>{title}</Text>

          <ScrollView
            ref={scrollRef}
            onLayout={scrollToSelected}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.option, opt === selected && styles.optionActive]}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
              >
                {optionIcons?.[opt] && (
                  <Text style={styles.optionIcon}>{optionIcons[opt]}</Text>
                )}
                <Text
                  style={[
                    styles.optionText,
                    opt === selected && styles.optionTextActive,
                  ]}
                >
                  {opt}
                </Text>
                {opt === selected && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

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
    height: OPTION_HEIGHT,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: OPTION_GAP,
  },
  optionActive: {
    backgroundColor: Colors.primaryMuted,
  },
  optionIcon: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
    marginRight: Spacing.sm,
  },
  optionText: {
    flex: 1,
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