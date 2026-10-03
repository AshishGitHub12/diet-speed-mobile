import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import api from '@/src/services/api';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Types — matches the full ProfileSerializer response ──────────────────────

interface Profile {
  id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
  dob: string;
  gender: string;
  height: number;
  height_unit: string;
  weight: number;
  bmi: number;
  target_weight: number | null;
  calorie_goal: number | null;
  dietary_preference: string;
  food_allergies: string[];
  health_conditions: string[];
  health_report: string | null; // URL string once uploaded
  family_health_conditions: string[];
  activity_level: string;
  exercises_regularly: string; // "yes" | "no"
  sleep_hours: string;
  smokes: string;
  consumes_alcohol: string;
  goal: string;
  looking_for: string;
  onboarding_completed: boolean;
  user: number;
}

type FieldType = 'text' | 'number' | 'select' | 'multi' | 'date';

// ─── Option lists — must match UserProfile choices on the backend exactly ─────

const GENDER_OPTIONS = ['male', 'female', 'other'];
const HEIGHT_UNITS = ['cm', 'ft'];
const DIETARY_OPTIONS = ['vegan', 'pure_vegetarian', 'ovo_vegetarian', 'non_vegetarian'];
const ALLERGY_OPTIONS = ['dairy', 'eggs', 'fish', 'gluten', 'peanuts', 'others', 'none'];
const HEALTH_CONDITION_OPTIONS = [
  'diabetes_pcod_thyroid_hypertension',
  'fatty_liver_constipation_ibs',
  'arthritis_osteoporosis',
  'migraine',
  'others',
  'none',
];
const ACTIVITY_OPTIONS = ['not_very_active', 'lightly_active', 'active', 'very_active'];
const YES_NO_OPTIONS = ['yes', 'no'];
const SLEEP_OPTIONS = ['less_than_4', '4_5', '6_7', '8_10'];
const SMOKING_OPTIONS = ['yes', 'no', 'occasionally'];
const ALCOHOL_OPTIONS = ['yes', 'no', 'socially'];
const GOAL_OPTIONS = [
  'weight_lose',
  'weight_gain',
  'lifestyle_management',
  'stamina_mobility',
  'strength_conditioning',
];
const LOOKING_FOR_OPTIONS = ['diet_and_training', 'personal_training_online', 'tailored_diet_plans', 'both'];

// Pretty labels for raw choice values — same wording used in the onboarding screens.
const LABELS: Record<string, string> = {
  diabetes_pcod_thyroid_hypertension: 'Diabetes/PCOD/Thyroid/Hypertension',
  fatty_liver_constipation_ibs: 'Fatty Liver/Constipation/IBS',
  arthritis_osteoporosis: 'Arthritis/Osteoporosis',
  migraine: 'Migraine',
  others: 'Others',
  none: 'None',
  not_very_active: 'Not Very Active',
  lightly_active: 'Lightly Active',
  active: 'Active',
  very_active: 'Very Active',
  less_than_4: 'Less than 4 hours',
  '4_5': '4-5 hours',
  '6_7': '6-7 hours',
  '8_10': '8-10 hours',
  occasionally: 'Occasionally',
  socially: 'Socially',
  weight_lose: 'Weight Lose',
  weight_gain: 'Weight Gain',
  lifestyle_management: 'Lifestyle Management',
  stamina_mobility: 'Stamina & Mobility',
  strength_conditioning: 'Strength & Conditioning',
  diet_and_training: 'Diet and Training Plans',
  personal_training_online: 'Personal Training',
  tailored_diet_plans: 'Diet and Tailored Plans',
  both: 'Both Nutrition & Training',
  vegan: 'Vegan',
  pure_vegetarian: 'Pure Vegetarian',
  ovo_vegetarian: 'Ovo Vegetarian',
  non_vegetarian: 'Non Vegetarian',
  dairy: 'Dairy',
  eggs: 'Eggs',
  fish: 'Fish',
  gluten: 'Gluten',
  peanuts: 'Peanuts',
  yes: 'Yes',
  no: 'No',
};

const prettyLabel = (value: string) => LABELS[value] ?? capitalize(value.replace(/_/g, ' '));
const prettyList = (values: string[] | undefined) =>
  values && values.length ? values.map(prettyLabel).join(', ') : 'None';

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name[0]?.toUpperCase() ?? 'U';
};
function capitalize(str: string) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '—';
}

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
  visible: boolean; title: string; type: FieldType;
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
                      {prettyLabel(opt)}
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
    key: keyof Profile; label: string; type: FieldType; options?: string[];
  } | null>(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try { const res = await api.get('/profile/'); setProfileLocal(res.data); }
    catch { Alert.alert('Error', 'Failed to load account details.'); }
    finally { setIsLoading(false); }
  };

  const openEdit = (key: keyof Profile, label: string, type: FieldType, options?: string[]) => {
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
    if (editField.type === 'multi') {
      parsedVal = rawVal.split(',').map(v => v.trim()).filter(Boolean);
    }

    const previous = profile;
    const updated = { ...profile, [editField.key]: parsedVal };
    setProfileLocal(updated);
    setIsSaving(true);
    try {
      const { data } = await api.patch('/profile/', { [editField.key]: parsedVal });
      // Trust the server's response (it recalculates bmi, etc.) over our
      // optimistic local guess.
      setProfileLocal(data);
    } catch (err: any) {
      console.log('❌ Profile update error:', JSON.stringify(err?.response?.data));
      Alert.alert('Error', 'Failed to update.');
      setProfileLocal(previous);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Health report upload/replace ───────────────────────────────────────────

  const handleReportPick = () => {
    Alert.alert('Health Report', 'Choose how you want to add your report', [
      { text: 'Take Photo', onPress: () => pickReport('camera') },
      { text: 'Choose from Gallery', onPress: () => pickReport('gallery') },
      { text: 'Upload PDF', onPress: () => pickReport('pdf') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickReport = async (source: 'camera' | 'gallery' | 'pdf') => {
    let uri: string | null = null;
    let name = `report_${Date.now()}`;
    let mimeType = 'application/octet-stream';

    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission needed', 'Camera access is required.'); return; }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (result.canceled || !result.assets?.[0]) return;
      uri = result.assets[0].uri;
      name = result.assets[0].fileName ?? `${name}.jpg`;
      mimeType = result.assets[0].mimeType ?? 'image/jpeg';
    } else if (source === 'gallery') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission needed', 'Photo library access is required.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
      if (result.canceled || !result.assets?.[0]) return;
      uri = result.assets[0].uri;
      name = result.assets[0].fileName ?? `${name}.jpg`;
      mimeType = result.assets[0].mimeType ?? 'image/jpeg';
    } else {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.canceled || !result.assets?.[0]) return;
      uri = result.assets[0].uri;
      name = result.assets[0].name;
      mimeType = result.assets[0].mimeType ?? 'application/pdf';
    }

    if (!profile) return;
    const formData = new FormData();
    formData.append('health_report', { uri, name, type: mimeType } as any);

    setIsSaving(true);
    try {
      const { data } = await api.patch('/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfileLocal(data);
    } catch (err: any) {
      console.log('❌ Report upload error:', JSON.stringify(err?.response?.data));
      Alert.alert('Error', 'Failed to upload report.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  const currentEditValue = editField
    ? Array.isArray(profile?.[editField.key])
      ? (profile?.[editField.key] as unknown as string[]).join(', ')
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
          <InfoRow icon="person-outline"      label="Full Name"     value={profile?.name ?? ''}                 onPress={() => openEdit('name',  'Full Name',  'text')} />
          <InfoRow icon="mail-outline"        label="Email"         value={profile?.email ?? ''}                onPress={() => openEdit('email', 'Email',     'text')} />
          <InfoRow icon="call-outline"        label="Phone Number"  value={profile?.phone_number ?? ''}         onPress={() => openEdit('phone_number', 'Phone Number', 'text')} />
          <InfoRow icon="calendar-outline"    label="Date of Birth" value={profile?.dob ?? ''}                  onPress={() => openEdit('dob',    'Date of Birth', 'date')} />
          <InfoRow icon="male-female-outline" label="Gender"        value={capitalize(profile?.gender ?? '')}   onPress={() => openEdit('gender', 'Gender', 'select', GENDER_OPTIONS)} />
        </View>

        <Text style={styles.sectionTitle}>Body Metrics</Text>
        <View style={styles.group}>
          <InfoRow icon="resize-outline"         label="Height"              value={profile?.height ? `${profile.height} ${profile.height_unit}` : ''} onPress={() => openEdit('height',        'Height',         'number')} />
          <InfoRow icon="swap-vertical-outline"  label="Height Unit"         value={profile?.height_unit?.toUpperCase() ?? ''}                         onPress={() => openEdit('height_unit',   'Height Unit',    'select', HEIGHT_UNITS)} />
          <InfoRow icon="scale-outline"          label="Current Weight (kg)" value={profile?.weight ? String(profile.weight) : ''}                     onPress={() => openEdit('weight',        'Current Weight', 'number')} />
          <InfoRow icon="flag-outline"           label="Target Weight (kg)"  value={profile?.target_weight ? String(profile.target_weight) : ''}       onPress={() => openEdit('target_weight', 'Target Weight',  'number')} />
          <InfoRow icon="flame-outline"          label="Daily Calorie Goal"  value={profile?.calorie_goal ? `${profile.calorie_goal} kcal` : ''}       onPress={() => openEdit('calorie_goal', 'Daily Calorie Goal', 'number')} />
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

        <Text style={styles.sectionTitle}>Dietary</Text>
        <View style={styles.group}>
          <InfoRow
            icon="restaurant-outline"
            label="Dietary Preference"
            value={profile?.dietary_preference ? prettyLabel(profile.dietary_preference) : ''}
            onPress={() => openEdit('dietary_preference', 'Dietary Preference', 'select', DIETARY_OPTIONS)}
          />
          <InfoRow
            icon="warning-outline"
            label="Food Allergies"
            value={prettyList(profile?.food_allergies)}
            onPress={() => openEdit('food_allergies', 'Food Allergies', 'multi', ALLERGY_OPTIONS)}
          />
        </View>

        <Text style={styles.sectionTitle}>Health</Text>
        <View style={styles.group}>
          <InfoRow
            icon="medkit-outline"
            label="Health Conditions"
            value={prettyList(profile?.health_conditions)}
            onPress={() => openEdit('health_conditions', 'Health Conditions', 'multi', HEALTH_CONDITION_OPTIONS)}
          />
          <InfoRow
            icon="people-outline"
            label="Family Health History"
            value={prettyList(profile?.family_health_conditions)}
            onPress={() => openEdit('family_health_conditions', 'Family Health History', 'multi', HEALTH_CONDITION_OPTIONS)}
          />
          <TouchableOpacity style={styles.infoRow} onPress={handleReportPick} activeOpacity={0.7}>
            <View style={styles.iconBox}>
              <Ionicons name="document-attach-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.infoCenter}>
              <Text style={styles.infoLabel}>Health Report</Text>
              <Text style={styles.infoValue}>{profile?.health_report ? 'Attached — tap to replace' : 'None — tap to upload'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Lifestyle</Text>
        <View style={styles.group}>
          <InfoRow
            icon="walk-outline"
            label="Activity Level"
            value={profile?.activity_level ? prettyLabel(profile.activity_level) : ''}
            onPress={() => openEdit('activity_level', 'Activity Level', 'select', ACTIVITY_OPTIONS)}
          />
          <InfoRow
            icon="barbell-outline"
            label="Exercises Regularly"
            value={profile?.exercises_regularly ? prettyLabel(profile.exercises_regularly) : ''}
            onPress={() => openEdit('exercises_regularly', 'Exercises Regularly', 'select', YES_NO_OPTIONS)}
          />
          <InfoRow
            icon="moon-outline"
            label="Sleep"
            value={profile?.sleep_hours ? prettyLabel(profile.sleep_hours) : ''}
            onPress={() => openEdit('sleep_hours', 'Sleep', 'select', SLEEP_OPTIONS)}
          />
          <InfoRow
            icon="flame-outline"
            label="Smoking"
            value={profile?.smokes ? prettyLabel(profile.smokes) : ''}
            onPress={() => openEdit('smokes', 'Smoking', 'select', SMOKING_OPTIONS)}
          />
          <InfoRow
            icon="wine-outline"
            label="Alcohol"
            value={profile?.consumes_alcohol ? prettyLabel(profile.consumes_alcohol) : ''}
            onPress={() => openEdit('consumes_alcohol', 'Alcohol', 'select', ALCOHOL_OPTIONS)}
          />
        </View>

        <Text style={styles.sectionTitle}>Goals</Text>
        <View style={styles.group}>
          <InfoRow
            icon="trophy-outline"
            label="Goal"
            value={profile?.goal ? prettyLabel(profile.goal) : ''}
            onPress={() => openEdit('goal', 'Goal', 'select', GOAL_OPTIONS)}
          />
          <InfoRow
            icon="compass-outline"
            label="Looking For"
            value={profile?.looking_for ? prettyLabel(profile.looking_for) : ''}
            onPress={() => openEdit('looking_for', 'Looking For', 'select', LOOKING_FOR_OPTIONS)}
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