import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

const Tint = { sky: '#DCEAF2' };
const Accent = { teal: '#3E7CA6' };

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

interface UploadBoxProps {
  fileName?: string | null;
  onPress: () => void;
}

// NOTE: this is a UI placeholder only. Wire it up to an actual file/document
// picker (e.g. expo-document-picker) in onPress and pass the resulting file
// name back in here.
const UploadBox: React.FC<UploadBoxProps> = ({ fileName, onPress }) => (
  <TouchableOpacity
    style={[styles.box, leafRadius(BorderRadius.lg), fileName && styles.boxFilled]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[styles.iconChip, { backgroundColor: fileName ? Accent.teal : Tint.sky }]}>
      <Ionicons
        name={fileName ? 'document-text' : 'attach'}
        size={16}
        color={fileName ? Colors.white : Accent.teal}
      />
    </View>
    <View style={styles.textWrap}>
      <Text style={styles.title} numberOfLines={1}>{fileName ? fileName : 'Upload Reports'}</Text>
      {!fileName && <Text style={styles.subtitle}>Tap to attach a file (PDF, JPG, PNG)</Text>}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  boxFilled: {
    borderStyle: 'solid',
    borderColor: Accent.teal,
  },
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { fontSize: Fonts.sizes.md, color: Colors.primary, fontWeight: '600' },
  subtitle: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, marginTop: 2 },
});

export default UploadBox;