import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/services/api';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

interface Profile {
  id: number; name: string; dob: string; gender: string;
  height: number; height_unit: string; weight: number; bmi: number;
  target_weight: number; medical_conditions: string[];
  onboarding_completed: boolean; user: number;
}

const GENDER_OPTIONS  = ['male', 'female', 'other'];
const HEIGHT_UNITS    = ['cm', 'ft'];
const MEDICAL_OPTIONS = ['none','diabetes','hypertension','thyroid','pcod','heart disease','asthma'];

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name[0]?.toUpperCase() ?? 'U';
};
const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '—';

// ─── Info Row ─────────────────────────────────────────────────────────────────

const InfoRow = ({ icon, label, value, onPress }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onPress: () => void;
}) => (
  <TouchableOpacity style={styles.infoRow} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.iconBox}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
    </View>
    <View style={styles.infoCenter}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
  </TouchableOpacity>
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────

const EditModal = ({ visible, title, type, value, options = [], onClose, onSave }: {
  visible: boolean; title: string; type: 'text'|'number'|'select'|'multi'|'date';
  value: string; options?: string[]; onClose: () => void; onSave: (v: string) => void;
}) => {
  const [localVal, setLocalVal] = useState(value);
  const [selected, setSelected] = useState<string[]>(
    type === 'multi' ? value.split(',').map(v => v.trim()).filter(Boolean) : []
  );

  useEffect(() => {
    setLocalVal(value);
    setSelected(type === 'multi' ? value.split(',').map(v => v.trim()).filter(Boolean) : []);
  }, [value, visible]);

  const toggleMulti = (opt: string) => {
    if (opt === 'none') { setSelected(['none']); return; }
    setSelected(prev => {
      const without = prev.filter(v => v !== 'none');
      if (without.includes(opt)) { const n = without.filter(v => v !== opt); return n.length === 0 ? ['none'] : n; }
      return [...without, opt];
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <View style={m.titleRow}>
            <Text style={m.title}>Edit {title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {(type === 'text' || type === 'number' || type === 'date') && (
            <TextInput
              style={m.input} value={localVal} onChangeText={setLocalVal} autoFocus
              keyboardType={type === 'number' ? 'numeric' : 'default'}
              placeholder={type === 'date' ? 'YYYY-MM-DD' : `Enter ${title.toLowerCase()}`}
              placeholderTextColor={Colors.textMuted}
            />
          )}

          {(type === 'select' || type === 'multi') && (
            <View style={m.optionsList}>
              {options.map(opt => {
                const isActive = type === 'select' ? localVal === opt : selected.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[m.optionRow, isActive && m.optionRowActive]}
                    onPress={() => type === 'select' ? setLocalVal(opt) : toggleMulti(opt)}
                    activeOpacity={0.7}
                  >
                    <Text style={[m.optionText, isActive && m.optionTextActive]}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                    <Ionicons
                      name={type === 'multi'
                        ? (isActive ? 'checkbox' : 'square-outline')
                        : (isActive ? 'checkmark-circle' : 'ellipse-outline')}
                      size={20}
                      color={isActive ? Colors.primary : Colors.border}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={m.actions}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={m.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={m.saveBtn}
              onPress={() => type === 'multi' ? onSave(selected.join(', ')) : onSave(localVal)}
              activeOpacity={0.85}
            >
              <Text style={m.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MyAccountScreen() {
  const router = useRouter();
  const [profile, setProfileLocal] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editField, setEditField] = useState<{
    key: keyof Profile; label: string;
    type: 'text'|'number'|'select'|'multi'|'date'; options?: string[];
  } | null>(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try { const res = await api.get('/profile/'); setProfileLocal(res.data); }
    catch { Alert.alert('Error', 'Failed to load account details.'); }
    finally { setIsLoading(false); }
  };

  const openEdit = (key: keyof Profile, label: string, type: 'text'|'number'|'select'|'multi'|'date', options?: string[]) => {
    setEditField({ key, label, type, options });
    setModalVisible(true);
  };

  const handleSave = async (rawVal: string) => {
    if (!profile || !editField) return;
    setModalVisible(false);
    let parsedVal: any = rawVal;
    if (editField.type === 'number') {
      parsedVal = parseFloat(rawVal);
      if (isNaN(parsedVal)) { Alert.alert('Invalid', 'Please enter a valid number.'); return; }
    }
    if (editField.key === 'medical_conditions') parsedVal = rawVal.split(',').map(v => v.trim()).filter(Boolean);
    const updated = { ...profile, [editField.key]: parsedVal };
    setProfileLocal(updated);
    setIsSaving(true);
    try { await api.patch('/profile/', { [editField.key]: parsedVal }); }
    catch { Alert.alert('Error', 'Failed to update.'); setProfileLocal(profile); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  const currentEditValue = editField
    ? editField.key === 'medical_conditions'
      ? (profile?.medical_conditions ?? []).join(', ')
      : String(profile?.[editField.key] ?? '')
    : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Account</Text>
        <View style={styles.headerBtn}>
          {isSaving && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{getInitials(profile?.name ?? 'U')}</Text>
          </View>
          <Text style={styles.avatarName}>{profile?.name ?? '—'}</Text>
          <Text style={styles.avatarSub}>Tap any field below to edit</Text>
        </View>

        <Text style={styles.sectionTitle}>Personal Info</Text>
        <View style={styles.group}>
          <InfoRow icon="person-outline"      label="Full Name"     value={profile?.name ?? ''}                    onPress={() => openEdit('name',   'Full Name',     'text')} />
          <InfoRow icon="calendar-outline"    label="Date of Birth" value={profile?.dob ?? ''}                     onPress={() => openEdit('dob',    'Date of Birth', 'date')} />
          <InfoRow icon="male-female-outline" label="Gender"        value={capitalize(profile?.gender ?? '')}      onPress={() => openEdit('gender', 'Gender',        'select', GENDER_OPTIONS)} />
        </View>

        <Text style={styles.sectionTitle}>Body Metrics</Text>
        <View style={styles.group}>
          <InfoRow icon="resize-outline"         label="Height"              value={profile?.height ? `${profile.height} ${profile.height_unit}` : ''} onPress={() => openEdit('height',        'Height',         'number')} />
          <InfoRow icon="swap-vertical-outline"  label="Height Unit"         value={profile?.height_unit?.toUpperCase() ?? ''}                         onPress={() => openEdit('height_unit',   'Height Unit',    'select', HEIGHT_UNITS)} />
          <InfoRow icon="scale-outline"          label="Current Weight (kg)" value={profile?.weight ? String(profile.weight) : ''}                     onPress={() => openEdit('weight',        'Current Weight', 'number')} />
          <InfoRow icon="flag-outline"           label="Target Weight (kg)"  value={profile?.target_weight ? String(profile.target_weight) : ''}       onPress={() => openEdit('target_weight', 'Target Weight',  'number')} />
          <View style={styles.bmiRow}>
            <View style={styles.iconBox}>
              <Ionicons name="analytics-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoCenter}>
              <Text style={styles.infoLabel}>BMI (auto-calculated)</Text>
              <Text style={styles.infoValue}>{profile?.bmi ?? '—'}</Text>
            </View>
            <View style={styles.bmiBadge}>
              <Text style={styles.bmiVal}>{profile?.bmi ?? '—'}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Health</Text>
        <View style={styles.group}>
          <InfoRow
            icon="medkit-outline"
            label="Medical Conditions"
            value={profile?.medical_conditions?.length ? profile.medical_conditions.map(c => capitalize(c)).join(', ') : 'None'}
            onPress={() => openEdit('medical_conditions', 'Medical Conditions', 'multi', MEDICAL_OPTIONS)}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {editField && (
        <EditModal
          visible={modalVisible} title={editField.label} type={editField.type}
          value={currentEditValue} options={editField.options}
          onClose={() => setModalVisible(false)} onSave={handleSave}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.primaryMuted },
  headerBtn:   { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  avatarText: { fontSize: 26, fontWeight: '700', color: Colors.white },
  avatarName: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  avatarSub:  { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark, marginBottom: Spacing.sm, marginTop: Spacing.md },
  group: { gap: 8, marginBottom: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  iconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  infoCenter: { flex: 1, gap: 2 },
  infoLabel:  { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  infoValue:  { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textDark },
  bmiRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  bmiBadge: { backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  bmiVal: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.primary },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg + 16, paddingTop: Spacing.sm },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  title:    { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark },
  input:    { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: Fonts.sizes.md, color: Colors.textDark, marginBottom: Spacing.md, backgroundColor: Colors.background },
  optionsList:     { gap: 8, marginBottom: Spacing.md },
  optionRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  optionRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  optionText:      { fontSize: Fonts.sizes.md, color: Colors.textDark },
  optionTextActive:{ color: Colors.primary, fontWeight: '600' },
  actions:    { flexDirection: 'row', gap: 12 },
  cancelBtn:  { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, height: 52, justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontSize: Fonts.sizes.md, color: Colors.textMuted, fontWeight: '600' },
  saveBtn:    { flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 52, justifyContent: 'center', alignItems: 'center' },
  saveText:   { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});