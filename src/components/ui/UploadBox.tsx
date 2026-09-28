import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

interface UploadBoxProps {
  fileName?: string | null;
  onPress: () => void;
}

// NOTE: this is a UI placeholder only. Wire it up to an actual file/document
// picker (e.g. expo-document-picker) in onPress and pass the resulting file
// name back in here.
const UploadBox: React.FC<UploadBoxProps> = ({ fileName, onPress }) => (
  <TouchableOpacity style={styles.box} onPress={onPress} activeOpacity={0.75}>
    <Text style={styles.icon}>📎</Text>
    <View style={styles.textWrap}>
      <Text style={styles.title}>{fileName ? fileName : 'Upload Reports'}</Text>
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
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  icon: { fontSize: 20 },
  textWrap: { flex: 1 },
  title: { fontSize: Fonts.sizes.md, color: Colors.primary, fontWeight: '600' },
  subtitle: { fontSize: Fonts.sizes.xs, color: Colors.textMuted, marginTop: 2 },
});

export default UploadBox;
