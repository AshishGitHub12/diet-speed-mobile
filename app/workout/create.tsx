import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import api from '@/src/services/api';

const WORKOUTS_BASE = '/workouts/';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LibraryExercise {
  id: number; name: string; muscle_group: string; icon: string;
}

interface DraftExercise {
  key: string;
  exercise_id: number | null; // set when picked from the library
  name: string;
  muscle_group: string;
  target_sets: string;
  target_reps: string;
  target_weight_kg: string;
  rest_seconds: string;
}

const DIFFICULTIES: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced'];

const emptyDraft = (): DraftExercise => ({
  key: `${Date.now()}-${Math.random()}`,
  exercise_id: null, name: '', muscle_group: '', target_sets: '3', target_reps: '12', target_weight_kg: '0', rest_seconds: '60',
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateWorkoutScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [exercises, setExercises] = useState<DraftExercise[]>([emptyDraft()]);
  const [query, setQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState<string | null>(null); // which draft's search is open
  const [results, setResults] = useState<LibraryExercise[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSingleExercise = exercises.length === 1;

  const updateExercise = (key: string, patch: Partial<DraftExercise>) => {
    setExercises((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  };

  const addExercise = () => setExercises((prev) => [...prev, emptyDraft()]);

  const removeExercise = (key: string) => {
    setExercises((prev) => (prev.length === 1 ? prev : prev.filter((e) => e.key !== key)));
  };

  const openSearch = (key: string) => {
    setSearchTarget(key);
    setQuery('');
    setResults([]);
  };

  const runSearch = (text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.trim().length < 2) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get<LibraryExercise[]>(`${WORKOUTS_BASE}exercises/`, { params: { q: text.trim() } });
        setResults(data);
      } catch (error) {
        console.log('❌ Exercise search error:', error);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const pickFromLibrary = (key: string, item: LibraryExercise) => {
    updateExercise(key, { exercise_id: item.id, name: item.name, muscle_group: item.muscle_group });
    setSearchTarget(null);
  };

  const useTypedAsNew = (key: string) => {
    if (!query.trim()) return;
    updateExercise(key, { exercise_id: null, name: query.trim(), muscle_group: '' });
    setSearchTarget(key); // keep open so they can set muscle group below instead of in modal
  };

  const canSave = name.trim().length > 0 && exercises.every((e) => e.name.trim() && (e.exercise_id || e.muscle_group.trim()));

  const handleSave = async () => {
    if (!canSave || saving) {
      if (!name.trim()) Alert.alert('Name required', 'Give your workout a name.');
      else Alert.alert('Missing details', 'Every exercise needs a name and muscle group (or pick one from the library).');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type: isSingleExercise ? 'Single Exercise' : 'Custom',
        difficulty,
        exercises: exercises.map((e) => ({
          ...(e.exercise_id ? { exercise_id: e.exercise_id } : { name: e.name.trim(), muscle_group: e.muscle_group.trim() }),
          target_sets: parseInt(e.target_sets, 10) || 1,
          target_reps: parseInt(e.target_reps, 10) || 1,
          target_weight_kg: parseFloat(e.target_weight_kg) || 0,
          rest_seconds: parseInt(e.rest_seconds, 10) || 0,
        })),
      };
      console.log('📤 Creating custom workout:', JSON.stringify(payload));
      await api.post(`${WORKOUTS_BASE}templates/create/`, payload);
      Alert.alert('Saved', 'Your workout plan is ready — find it in the workout picker.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.log('❌ Create workout error:', error?.response?.status, JSON.stringify(error?.response?.data));
      Alert.alert('Error', 'Could not save this workout. Check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Workout</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <Text style={styles.label}>Workout Name</Text>
          <TextInput
            style={styles.input}
            placeholder={isSingleExercise ? 'e.g. Chest Day' : 'e.g. My Push Day'}
            placeholderTextColor={Colors.textPlaceholder}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.diffRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.diffPill, difficulty === d && styles.diffPillActive]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={[styles.diffPillText, difficulty === d && styles.diffPillTextActive]}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              {isSingleExercise ? 'Exercise' : `Exercises (${exercises.length})`}
            </Text>
            {isSingleExercise && <Text style={styles.hintText}>Just one exercise today — that's fine</Text>}
          </View>

          {exercises.map((ex, idx) => (
            <View key={ex.key} style={styles.exerciseCard}>
              <View style={styles.exerciseCardTop}>
                <Text style={styles.exerciseIndex}>#{idx + 1}</Text>
                {exercises.length > 1 && (
                  <TouchableOpacity onPress={() => removeExercise(ex.key)}>
                    <Ionicons name="trash-outline" size={18} color="#E05C5C" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={styles.exercisePicker} onPress={() => openSearch(ex.key)} activeOpacity={0.7}>
                <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
                <Text style={[styles.exercisePickerText, !ex.name && styles.exercisePickerPlaceholder]}>
                  {ex.name || 'Search or type an exercise name'}
                </Text>
              </TouchableOpacity>

              {searchTarget === ex.key && (
                <View style={styles.searchBox}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Type to search the library..."
                    placeholderTextColor={Colors.textPlaceholder}
                    value={query}
                    onChangeText={(t) => runSearch(t)}
                    autoFocus
                  />
                  {searching && <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 6 }} />}
                  {results.map((r) => (
                    <TouchableOpacity key={r.id} style={styles.searchResultRow} onPress={() => pickFromLibrary(ex.key, r)}>
                      <Text style={styles.searchResultName}>{r.name}</Text>
                      <Text style={styles.searchResultMuscle}>{r.muscle_group}</Text>
                    </TouchableOpacity>
                  ))}
                  {query.trim().length >= 2 && (
                    <TouchableOpacity style={styles.useNewRow} onPress={() => useTypedAsNew(ex.key)}>
                      <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
                      <Text style={styles.useNewText}>Use "{query.trim()}" as a new exercise</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.closeSearchBtn} onPress={() => setSearchTarget(null)}>
                    <Text style={styles.closeSearchText}>Close</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!ex.exercise_id && ex.name !== '' && (
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Muscle Group</Text>
                  <TextInput
                    style={styles.smallInput}
                    placeholder="e.g. Chest"
                    placeholderTextColor={Colors.textPlaceholder}
                    value={ex.muscle_group}
                    onChangeText={(t) => updateExercise(ex.key, { muscle_group: t })}
                  />
                </View>
              )}

              <View style={styles.targetGrid}>
                <View style={styles.targetField}>
                  <Text style={styles.fieldLabel}>Sets</Text>
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="number-pad"
                    value={ex.target_sets}
                    onChangeText={(t) => updateExercise(ex.key, { target_sets: t })}
                  />
                </View>
                <View style={styles.targetField}>
                  <Text style={styles.fieldLabel}>Reps</Text>
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="number-pad"
                    value={ex.target_reps}
                    onChangeText={(t) => updateExercise(ex.key, { target_reps: t })}
                  />
                </View>
                <View style={styles.targetField}>
                  <Text style={styles.fieldLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="decimal-pad"
                    value={ex.target_weight_kg}
                    onChangeText={(t) => updateExercise(ex.key, { target_weight_kg: t })}
                  />
                </View>
                <View style={styles.targetField}>
                  <Text style={styles.fieldLabel}>Rest (s)</Text>
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="number-pad"
                    value={ex.rest_seconds}
                    onChangeText={(t) => updateExercise(ex.key, { rest_seconds: t })}
                  />
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addExerciseBtn} onPress={addExercise} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.addExerciseText}>Add Another Exercise</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, (!canSave || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                <Text style={styles.saveBtnText}>Save Workout</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.primaryMuted,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerBack: { fontSize: 30, color: Colors.primary, fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },

  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  label: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.textDark, marginBottom: 6, marginTop: Spacing.sm },
  input: {
    height: 46, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.white, paddingHorizontal: Spacing.sm, fontSize: Fonts.sizes.sm, color: Colors.textDark,
  },
  diffRow: { flexDirection: 'row', gap: 8 },
  diffPill: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center' },
  diffPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  diffPillText: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted },
  diffPillTextActive: { color: Colors.white },

  sectionHeaderRow: { marginTop: Spacing.md, marginBottom: Spacing.sm },
  sectionTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  hintText: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  exerciseCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm },
  exerciseCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseIndex: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },

  exercisePicker: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.sm, backgroundColor: Colors.background },
  exercisePickerText: { fontSize: Fonts.sizes.sm, color: Colors.textDark, flex: 1 },
  exercisePickerPlaceholder: { color: Colors.textPlaceholder },

  searchBox: { borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.md, padding: Spacing.sm, gap: 6 },
  searchInput: { height: 40, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.sm, fontSize: Fonts.sizes.sm, color: Colors.textDark, backgroundColor: Colors.white },
  searchResultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchResultName: { fontSize: Fonts.sizes.sm, color: Colors.textDark, fontWeight: '600' },
  searchResultMuscle: { fontSize: 11, color: Colors.textMuted },
  useNewRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  useNewText: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
  closeSearchBtn: { alignSelf: 'flex-end', paddingVertical: 4 },
  closeSearchText: { fontSize: 12, color: Colors.textMuted },

  fieldRow: { gap: 4 },
  fieldLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  smallInput: { height: 38, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.sm, fontSize: Fonts.sizes.sm, color: Colors.textDark, backgroundColor: Colors.background },

  targetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  targetField: { flexBasis: '47%', gap: 4 },

  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', marginTop: Spacing.sm },
  addExerciseText: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.primary },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 52, marginTop: Spacing.lg },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});