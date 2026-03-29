import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

const DEVICES = [
  { id: '1', name: 'Apple Health', icon: '🍎', connected: true, lastSync: '2 mins ago', type: 'Health App' },
  { id: '2', name: 'Fitbit Charge 5', icon: '⌚', connected: true, lastSync: '1 hour ago', type: 'Fitness Tracker' },
  { id: '3', name: 'Google Fit', icon: '🏃', connected: false, lastSync: 'Never', type: 'Health App' },
  { id: '4', name: 'Mi Band 7', icon: '💪', connected: false, lastSync: 'Never', type: 'Fitness Tracker' },
  { id: '5', name: 'Withings Scale', icon: '⚖️', connected: false, lastSync: 'Never', type: 'Smart Scale' },
];

export default function ConnectedDevicesScreen() {
  const router = useRouter();
  const [devices, setDevices] = useState(DEVICES);

  const toggleDevice = (id: string) => {
    setDevices(prev => prev.map(d =>
      d.id === id
        ? { ...d, connected: !d.connected, lastSync: !d.connected ? 'Just now' : d.lastSync }
        : d
    ));
  };

  const connected = devices.filter(d => d.connected);
  const available = devices.filter(d => !d.connected);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connected Devices</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Connected */}
        {connected.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connected ({connected.length})</Text>
            <View style={styles.deviceList}>
              {connected.map((device, i) => (
                <View key={device.id} style={[styles.deviceRow, i > 0 && styles.deviceBorder]}>
                  <View style={styles.deviceIconWrapper}>
                    <Text style={styles.deviceIcon}>{device.icon}</Text>
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceMeta}>{device.type}  •  Last sync: {device.lastSync}</Text>
                  </View>
                  <Switch
                    value={device.connected}
                    onValueChange={() => toggleDevice(device.id)}
                    trackColor={{ false: Colors.border, true: Colors.primaryMuted }}
                    thumbColor={device.connected ? Colors.primary : '#f4f3f4'}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Available */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Devices</Text>
          <View style={styles.deviceList}>
            {available.map((device, i) => (
              <View key={device.id} style={[styles.deviceRow, i > 0 && styles.deviceBorder]}>
                <View style={[styles.deviceIconWrapper, styles.deviceIconDisabled]}>
                  <Text style={styles.deviceIcon}>{device.icon}</Text>
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceMeta}>{device.type}</Text>
                </View>
                <TouchableOpacity
                  style={styles.connectBtn}
                  onPress={() => toggleDevice(device.id)}
                >
                  <Text style={styles.connectBtnText}>Connect</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Info note */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Connected devices automatically sync your steps, heart rate, sleep, and weight data to Diet Speed.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryMuted,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark, marginBottom: Spacing.sm,
  },
  deviceList: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.lg, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  deviceRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 14, gap: 12,
  },
  deviceBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  deviceIconWrapper: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center',
  },
  deviceIconDisabled: { backgroundColor: Colors.border },
  deviceIcon: { fontSize: 22 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textDark },
  deviceMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  connectBtn: {
    backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  connectBtnText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  infoCard: {
    flexDirection: 'row', gap: 10, backgroundColor: '#E3F2FD',
    borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 18 },
  infoText: { flex: 1, fontSize: Fonts.sizes.sm, color: '#1565C0', lineHeight: 20 },
});