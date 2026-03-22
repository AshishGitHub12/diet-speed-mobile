import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../src/constants/theme';
export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
      <Text style={styles.sub}>Coming Soon</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  text: { fontSize: Fonts.sizes.xxl, fontWeight: '700', color: Colors.primary },
  sub: { fontSize: Fonts.sizes.md, color: Colors.textMuted, marginTop: 8 },
});