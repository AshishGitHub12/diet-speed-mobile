import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/src/services/api';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: number;
  name: string;
  dob: string;
  gender: string;
  height: number;
  height_unit: string;
  weight: number;
  bmi: number;
  target_weight: number;
  medical_conditions: string[];
  onboarding_completed: boolean;
  user: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = ['male', 'female', 'other'];
const HEIGHT_UNITS = ['cm', 'ft'];
const MEDICAL_OPTIONS = [
  'none',
  'diabetes',
  'hypertension',
  'thyroid',
  'pcod',
  'heart disease',
  'asthma',
];

// ─── Sub Components ───────────────────────────────────────────────────────────

const InfoRow = ({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.infoRow} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.infoLeft}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
    <Text style={styles.infoChevron}>›</Text>
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  visible: boolean;
  title: string;
  type: 'text' | 'number' | 'select' | 'multi' | 'date';
  value: string;
  options?: string[];
  onClose: () => void;
  onSave: (val: string) => void;
}

const EditModal = ({
  visible,
  title,
  type,
  value,
  options = [],
  onClose,
  onSave,
}: EditModalProps) => {
  const [localVal, setLocalVal] = useState(value);
  const [selected, setSelected] = useState<string[]>(
    type === 'multi' ? value.split(',').map(v => v.trim()).filter(Boolean) : []
  );

  useEffect(() => {
    setLocalVal(value);
    setSelected(type === 'multi' ? value.split(',').map(v => v.trim()).filter(Boolean) : []);
  }, [value, visible]);

  const handleSave = () => {
    if (type === 'multi') {
      onSave(selected.join(', '));
    } else {
      onSave(localVal);
    }
  };

  const toggleMulti = (opt: string) => {
    if (opt === 'none') {
      setSelected(['none']);
      return;
    }
    setSelected(prev => {
      const withoutNone = prev.filter(v => v !== 'none');
      if (withoutNone.includes(opt)) {
        const next = withoutNone.filter(v => v !== opt);
        return next.length === 0 ? ['none'] : next;
      }
      return [...withoutNone, opt];
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          {/* Handle */}
          <View style={modalStyles.handle} />

          <Text style={modalStyles.title}>Edit {title}</Text>

          {(type === 'text' || type === 'number' || type === 'date') && (
            <TextInput
              style={modalStyles.input}
              value={localVal}
              onChangeText={setLocalVal}
              keyboardType={type === 'number' ? 'numeric' : 'default'}
              placeholder={
                type === 'date' ? 'YYYY-MM-DD' : `Enter ${title.toLowerCase()}`
              }
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
          )}

          {type === 'select' && (
            <View style={modalStyles.optionsList}>
              {options.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    modalStyles.optionRow,
                    localVal === opt && modalStyles.optionRowActive,
                  ]}
                  onPress={() => setLocalVal(opt)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      modalStyles.optionText,
                      localVal === opt && modalStyles.optionTextActive,
                    ]}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                  {localVal === opt && (
                    <Text style={modalStyles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {type === 'multi' && (
            <View style={modalStyles.optionsList}>
              {options.map(opt => {
                const isActive = selected.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      modalStyles.optionRow,
                      isActive && modalStyles.optionRowActive,
                    ]}
                    onPress={() => toggleMulti(opt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        modalStyles.optionText,
                        isActive && modalStyles.optionTextActive,
                      ]}
                    >
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                    {isActive && <Text style={modalStyles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Actions */}
          <View style={modalStyles.actions}>
            <TouchableOpacity
              style={modalStyles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={modalStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={modalStyles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name[0]?.toUpperCase() ?? 'U';
};

const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '—';

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MyAccountScreen() {
  const router = useRouter();
  const [profile, setProfileLocal] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editField, setEditField] = useState<{
    key: keyof Profile;
    label: string;
    type: 'text' | 'number' | 'select' | 'multi' | 'date';
    options?: string[];
  } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile/');
      setProfileLocal(res.data);
    } catch (e) {
      console.log('❌ Profile fetch error:', e);
      Alert.alert('Error', 'Failed to load account details.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Open Edit Modal ────────────────────────────────────────────────────────

  const openEdit = (
    key: keyof Profile,
    label: string,
    type: 'text' | 'number' | 'select' | 'multi' | 'date',
    options?: string[]
  ) => {
    setEditField({ key, label, type, options });
    setModalVisible(true);
  };

  // ─── Save Field ─────────────────────────────────────────────────────────────

  const handleSave = async (rawVal: string) => {
    if (!profile || !editField) return;
    setModalVisible(false);

    // Parse value based on field type
    let parsedVal: any = rawVal;
    if (editField.type === 'number') {
      parsedVal = parseFloat(rawVal);
      if (isNaN(parsedVal)) {
        Alert.alert('Invalid', 'Please enter a valid number.');
        return;
      }
    }
    if (editField.key === 'medical_conditions') {
      parsedVal = rawVal.split(',').map(v => v.trim()).filter(Boolean);
    }

    // Optimistic update
    const updated = { ...profile, [editField.key]: parsedVal };
    setProfileLocal(updated);

    setIsSaving(true);
    try {
      await api.patch('/profile/', { [editField.key]: parsedVal });
    } catch (e) {
      console.log('❌ Update error:', e);
      Alert.alert('Error', 'Failed to update. Please try again.');
      // Rollback
      setProfileLocal(profile);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const currentEditValue = editField
    ? editField.key === 'medical_conditions'
      ? (profile?.medical_conditions ?? []).join(', ')
      : String(profile?.[editField.key] ?? '')
    : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Account</Text>
        <View style={styles.headerBtn}>
          {isSaving && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Avatar Section ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {getInitials(profile?.name ?? 'U')}
            </Text>
          </View>
          <Text style={styles.avatarName}>{profile?.name ?? '—'}</Text>
          <Text style={styles.avatarSub}>Tap any field below to edit</Text>
        </View>

        {/* ── Personal Info ── */}
        <SectionHeader title="Personal Info" />
        <View style={styles.group}>
          <InfoRow
            label="Full Name"
            value={profile?.name ?? ''}
            onPress={() => openEdit('name', 'Full Name', 'text')}
          />
          <InfoRow
            label="Date of Birth"
            value={profile?.dob ?? ''}
            onPress={() => openEdit('dob', 'Date of Birth', 'date')}
          />
          <InfoRow
            label="Gender"
            value={capitalize(profile?.gender ?? '')}
            onPress={() => openEdit('gender', 'Gender', 'select', GENDER_OPTIONS)}
          />
        </View>

        {/* ── Body Metrics ── */}
        <SectionHeader title="Body Metrics" />
        <View style={styles.group}>
          <InfoRow
            label="Height"
            value={
              profile?.height
                ? `${profile.height} ${profile.height_unit}`
                : ''
            }
            onPress={() => openEdit('height', 'Height', 'number')}
          />
          <InfoRow
            label="Height Unit"
            value={profile?.height_unit?.toUpperCase() ?? ''}
            onPress={() =>
              openEdit('height_unit', 'Height Unit', 'select', HEIGHT_UNITS)
            }
          />
          <InfoRow
            label="Current Weight (kg)"
            value={profile?.weight ? String(profile.weight) : ''}
            onPress={() => openEdit('weight', 'Current Weight', 'number')}
          />
          <InfoRow
            label="Target Weight (kg)"
            value={profile?.target_weight ? String(profile.target_weight) : ''}
            onPress={() =>
              openEdit('target_weight', 'Target Weight', 'number')
            }
          />
          <View style={styles.bmiRow}>
            <Text style={styles.bmiLabel}>BMI</Text>
            <View style={styles.bmiBadge}>
              <Text style={styles.bmiValue}>{profile?.bmi ?? '—'}</Text>
            </View>
          </View>
        </View>

        {/* ── Health ── */}
        <SectionHeader title="Health" />
        <View style={styles.group}>
          <InfoRow
            label="Medical Conditions"
            value={
              profile?.medical_conditions?.length
                ? profile.medical_conditions
                    .map(c => capitalize(c))
                    .join(', ')
                : 'None'
            }
            onPress={() =>
              openEdit(
                'medical_conditions',
                'Medical Conditions',
                'multi',
                MEDICAL_OPTIONS
              )
            }
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Edit Modal ── */}
      {editField && (
        <EditModal
          visible={modalVisible}
          title={editField.label}
          type={editField.type}
          value={currentEditValue}
          options={editField.options}
          onClose={() => setModalVisible(false)}
          onSave={handleSave}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.primaryMuted,
  },
  headerBtn: { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.lg,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: Colors.white },
  avatarName: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  avatarSub: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },

  // Section
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },

  // Group
  group: { gap: 8, marginBottom: Spacing.sm },

  // Info Row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoLeft: { flex: 1, gap: 2 },
  infoLabel: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  infoValue: { fontSize: Fonts.sizes.md, fontWeight: '600', color: Colors.textDark },
  infoChevron: { fontSize: 22, color: Colors.textMuted },

  // BMI (read-only)
  bmiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bmiLabel: { fontSize: Fonts.sizes.md, color: Colors.textMuted },
  bmiBadge: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  bmiValue: {
    fontSize: Fonts.sizes.md,
    fontWeight: '700',
    color: Colors.primary,
  },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg + 16,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Fonts.sizes.md,
    color: Colors.textDark,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  optionsList: { gap: 8, marginBottom: Spacing.md },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  optionRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  optionText: { fontSize: Fonts.sizes.md, color: Colors.textDark },
  optionTextActive: { color: Colors.primary, fontWeight: '600' },
  checkmark: { fontSize: 16, color: Colors.primary, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: { fontSize: Fonts.sizes.md, color: Colors.textMuted, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});