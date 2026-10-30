import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, Animated, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import api from '@/src/services/api';

const WORKOUTS_BASE = '/workouts/';

// ─── Shared design system (matches Home, Weight Tracker, Meal Log & Diet) ──────

const Accent = { gold: '#B9892E', plum: '#6E5A8C', teal: '#3E7CA6', berry: '#8B3A42' };
const Tint   = { mint: '#E1EEDD', peach: '#F5E6D3', lilac: '#E7E2F0', sky: '#DCEAF2' };
const LIME   = '#B9F24C';

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

// Muscle groups cycle through the same accent family as meal types elsewhere,
// so every group gets a consistent color across its tab and its exercises.
const GROUP_ACCENTS = [Colors.primary, Accent.gold, Accent.plum, Accent.teal, Accent.berry];
const GROUP_TINTS   = [Tint.mint, Tint.peach, Tint.lilac, Tint.sky, '#F3E3E5'];
const getGroupAccent = (i: number) => GROUP_ACCENTS[i % GROUP_ACCENTS.length];
const getGroupTint   = (i: number) => GROUP_TINTS[i % GROUP_TINTS.length];

// ─── Types — match WorkoutTemplateSerializer / WorkoutSessionSerializer ────────

interface LoggedSet {
  id: number; workout_exercise: number; set_number: number; reps: number; weight_kg: number;
}
interface WorkoutExerciseData {
  id: number; name: string; muscle_group: string;
  icon: keyof typeof Ionicons.glyphMap; instructions: string;
  order: number; target_sets: number; target_reps: number; target_weight_kg: number;
  rest_seconds: number; logged_sets: LoggedSet[] | null;
}
interface MuscleGroupData {
  id: string; label: string; exercises: WorkoutExerciseData[];
}
interface WorkoutTemplateData {
  id: number; name: string; type: string; duration_minutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced'; calories_burn: number;
  total_sets: number; muscle_groups: MuscleGroupData[];
  is_custom: boolean; is_owner: boolean;
}
interface WorkoutSessionData {
  id: number; template: WorkoutTemplateData; date: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string; finished_at: string | null; duration_seconds: number;
  calories_burned: number; completed_sets_count: number; total_sets_target: number;
  total_volume_kg: number;
}
interface WeekDay {
  date: string; day: string; day_number: number; is_today: boolean; done: boolean; workout_name: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Beginner/intermediate/advanced mapped onto the app's own palette instead of
// generic traffic-light hex, so difficulty badges match everything else.
const getDifficultyColor = (d: string) =>
  d === 'beginner' ? Colors.primary : d === 'intermediate' ? Accent.gold : Colors.error;

const formatElapsed = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const getLoggedCount = (session: WorkoutSessionData | null) =>
  session?.template.muscle_groups.reduce(
    (t, g) => t + g.exercises.reduce((tt, e) => tt + (e.logged_sets?.length ?? 0), 0), 0
  ) ?? 0;

// ─── Rest Timer Modal ─────────────────────────────────────────────────────────

const RestTimerModal = ({ visible, seconds, onClose }: {
  visible: boolean; seconds: number; onClose: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    setTimeLeft(seconds);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); onClose(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [timeLeft]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={timerStyles.overlay}>
        <View style={[timerStyles.card, leafRadius(BorderRadius.xl)]}>
          <View style={timerStyles.blob} pointerEvents="none" />
          <View style={timerStyles.iconRow}>
            <Ionicons name="timer-outline" size={20} color={LIME} />
            <Text style={timerStyles.title}>Rest Time</Text>
          </View>
          <Animated.View style={[timerStyles.ring, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={timerStyles.timerText}>{timeLeft}</Text>
            <Text style={timerStyles.timerSub}>seconds</Text>
          </Animated.View>
          <Text style={timerStyles.hint}>Next set coming up...</Text>
          <TouchableOpacity style={timerStyles.skipBtn} onPress={onClose} activeOpacity={0.85}>
            <Ionicons name="play-forward-outline" size={16} color="#fff" />
            <Text style={timerStyles.skipText}>Skip Rest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Summary Modal ────────────────────────────────────────────────────────────

const SummaryModal = ({ visible, session, onClose }: {
  visible: boolean; session: WorkoutSessionData | null; onClose: () => void;
}) => {
  if (!session) return null;
  const mins = Math.floor(session.duration_seconds / 60);

  const stats = [
    { val: `${mins}`, label: 'Minutes', icon: 'timer-outline' as const, tint: Tint.mint, accent: Colors.primary },
    { val: `${session.completed_sets_count}/${session.total_sets_target}`, label: 'Sets Done', icon: 'checkmark-circle-outline' as const, tint: Tint.sky, accent: Accent.teal },
    { val: `${Math.round(session.total_volume_kg)}kg`, label: 'Volume', icon: 'barbell-outline' as const, tint: Tint.lilac, accent: Accent.plum },
    { val: `${session.calories_burned}`, label: 'Kcal', icon: 'flame-outline' as const, tint: Tint.peach, accent: Accent.gold },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={summaryStyles.overlay}>
        <View style={summaryStyles.sheet}>
          <View style={summaryStyles.trophyRow}>
            <Ionicons name="trophy" size={52} color="#FFD700" />
          </View>
          <Text style={summaryStyles.title}>Workout Complete!</Text>
          <Text style={summaryStyles.sub}>Great job! Here's your summary</Text>
          <View style={summaryStyles.statsGrid}>
            {stats.map((s, i) => (
              <View key={i} style={[summaryStyles.statCard, leafRadius(BorderRadius.md), { backgroundColor: s.tint }]}>
                <Ionicons name={s.icon} size={20} color={s.accent} />
                <Text style={summaryStyles.statVal}>{s.val}</Text>
                <Text style={summaryStyles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={summaryStyles.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
            <Text style={summaryStyles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Set Row (editable reps/weight before confirming) ──────────────────────────

const SetRow = ({ index, target, logged, disabled, onConfirm, accent }: {
  index: number;
  target: { reps: number; weight_kg: number };
  logged: LoggedSet | undefined;
  disabled: boolean;
  onConfirm: (reps: number, weight: number) => void;
  accent: string;
}) => {
  const [reps, setReps] = useState(String(logged?.reps ?? target.reps));
  const [weight, setWeight] = useState(String(logged?.weight_kg ?? target.weight_kg));
  const isDone = !!logged;

  return (
    <View style={[styles.setRow, isDone && { backgroundColor: accent + '18' }]}>
      <Text style={[styles.setCell, { flex: 0.5 }]}>{index + 1}</Text>
      <TextInput
        style={[styles.setInput, isDone && styles.setInputDone]}
        value={reps}
        onChangeText={setReps}
        keyboardType="number-pad"
        editable={!isDone && !disabled}
        selectTextOnFocus
      />
      <TextInput
        style={[styles.setInput, isDone && styles.setInputDone]}
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        editable={!isDone && !disabled}
        selectTextOnFocus
      />
      <TouchableOpacity
        style={[styles.setDoneBtn, { borderColor: accent }, isDone && { backgroundColor: accent }, disabled && !isDone && styles.setDoneBtnDisabled]}
        onPress={() => {
          const repsNum = parseInt(reps, 10);
          const weightNum = parseFloat(weight) || 0;
          if (!repsNum || repsNum <= 0) { Alert.alert('Enter reps', 'Please enter how many reps you did.'); return; }
          onConfirm(repsNum, weightNum);
        }}
        activeOpacity={0.7}
        disabled={isDone || disabled}
      >
        <Ionicons name={isDone ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={isDone ? Colors.white : accent} />
        <Text style={[styles.setDoneBtnText, { color: accent }, isDone && styles.setDoneBtnTextActive]}>{isDone ? 'Done' : 'Log'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Workout Picker (library) ───────────────────────────────────────────────────

const WorkoutPicker = ({ templates, onPick, onCreate, onDelete, starting }: {
  templates: WorkoutTemplateData[]; onPick: (t: WorkoutTemplateData) => void;
  onCreate: () => void; onDelete: (t: WorkoutTemplateData) => void; starting: boolean;
}) => (
  <View>
    <View style={styles.pickerHeaderRow}>
      <Text style={styles.sectionTitle}>Choose a Workout</Text>
      <TouchableOpacity style={styles.createBtn} onPress={onCreate} activeOpacity={0.8}>
        <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
        <Text style={styles.createBtnText}>Create Your Own</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.pickerList}>
      {templates.map((t) => (
        <TouchableOpacity
          key={t.id}
          style={[styles.pickerCard, leafRadius(BorderRadius.lg)]}
          onPress={() => onPick(t)}
          activeOpacity={0.85}
          disabled={starting}
        >
          <View style={styles.pickerCardTop}>
            <View style={styles.pickerCardLeft}>
              <View style={styles.pickerNameRow}>
                <Text style={styles.workoutName}>{t.name}</Text>
                {t.is_custom && (
                  <View style={styles.customBadge}>
                    <Text style={styles.customBadgeText}>Custom</Text>
                  </View>
                )}
              </View>
              <Text style={styles.workoutType}>{t.type}</Text>
            </View>
            <View style={styles.pickerCardTopRight}>
              <View style={[styles.diffBadge, { backgroundColor: getDifficultyColor(t.difficulty) + '22' }]}>
                <Text style={[styles.diffText, { color: getDifficultyColor(t.difficulty) }]}>
                  {t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1)}
                </Text>
              </View>
              {t.is_owner && (
                <TouchableOpacity
                  style={styles.deleteIconBtn}
                  onPress={(e) => { e.stopPropagation(); onDelete(t); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.workoutStats}>
            <View style={styles.workoutStat}>
              <View style={styles.statIconRow}>
                <Ionicons name="timer-outline" size={16} color={Colors.primary} />
                <Text style={styles.workoutStatVal}>{t.duration_minutes}</Text>
              </View>
              <Text style={styles.workoutStatLabel}>minutes</Text>
            </View>
            <View style={styles.workoutStat}>
              <View style={styles.statIconRow}>
                <Ionicons name="flame-outline" size={16} color={Accent.gold} />
                <Text style={styles.workoutStatVal}>{t.calories_burn}</Text>
              </View>
              <Text style={styles.workoutStatLabel}>kcal</Text>
            </View>
            <View style={styles.workoutStat}>
              <View style={styles.statIconRow}>
                <Ionicons name="barbell-outline" size={16} color={Accent.teal} />
                <Text style={styles.workoutStatVal}>{t.total_sets}</Text>
              </View>
              <Text style={styles.workoutStatLabel}>total sets</Text>
            </View>
          </View>
          <View style={styles.pickerStartRow}>
            <Ionicons name="play-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.pickerStartText}>Start this workout</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplateData[]>([]);
  const [week, setWeek] = useState<WeekDay[]>([]);
  const [streak, setStreak] = useState(0);
  const [session, setSession] = useState<WorkoutSessionData | null>(null);
  const [starting, setStarting] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [restTimer, setRestTimer] = useState({ visible: false, seconds: 60 });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [templatesRes, weekRes, todayRes] = await Promise.all([
        api.get<WorkoutTemplateData[]>(`${WORKOUTS_BASE}templates/`),
        api.get<{ days: WeekDay[]; streak: number }>(`${WORKOUTS_BASE}week/`),
        api.get<WorkoutSessionData | null>(`${WORKOUTS_BASE}today/`),
      ]);
      setTemplates(templatesRes.data);
      setWeek(weekRes.data.days);
      setStreak(weekRes.data.streak);

      const activeSession = todayRes.data && todayRes.data.status === 'in_progress' ? todayRes.data : null;
      setSession(activeSession);
      if (activeSession && !selectedGroup) {
        setSelectedGroup(activeSession.template.muscle_groups[0]?.id ?? null);
      }
    } catch (error: any) {
      console.log('❌ Workout fetch error:', error?.response?.status, JSON.stringify(error?.response?.data));
      Alert.alert('Error', 'Failed to load workouts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedGroup]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  // Live elapsed timer while a session is in progress.
  useEffect(() => {
    if (session && session.status === 'in_progress') {
      const startedMs = new Date(session.started_at).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedMs) / 1000)));
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [session?.id, session?.status]);

  const goToCreateWorkout = () => {
    router.push('/workout/create' as any);
  };

  const deleteTemplate = (template: WorkoutTemplateData) => {
    Alert.alert('Delete Workout', `Remove "${template.name}" from your workouts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const previous = templates;
          setTemplates((prev) => prev.filter((t) => t.id !== template.id)); // optimistic
          try {
            await api.post(`${WORKOUTS_BASE}templates/${template.id}/delete/`);
          } catch (error: any) {
            console.log('❌ Delete workout error:', error?.response?.status, JSON.stringify(error?.response?.data));
            Alert.alert('Error', 'Could not delete this workout.');
            setTemplates(previous); // revert
          }
        },
      },
    ]);
  };

  const startWorkout = async (template: WorkoutTemplateData) => {
    if (starting) return;
    setStarting(true);
    try {
      const { data } = await api.post<WorkoutSessionData>(`${WORKOUTS_BASE}sessions/start/`, { template_id: template.id });
      setSession(data);
      setSelectedGroup(data.template.muscle_groups[0]?.id ?? null);
    } catch (error: any) {
      console.log('❌ Start workout error:', error?.response?.status, JSON.stringify(error?.response?.data));
      Alert.alert('Error', 'Could not start this workout.');
    } finally {
      setStarting(false);
    }
  };

  const logSet = async (exercise: WorkoutExerciseData, setNumber: number, reps: number, weight: number, restSecs: number) => {
    if (!session) return;
    try {
      const { data } = await api.post<WorkoutSessionData>(`${WORKOUTS_BASE}sessions/${session.id}/log-set/`, {
        workout_exercise_id: exercise.id, set_number: setNumber, reps, weight_kg: weight,
      });
      setSession(data);
      setRestTimer({ visible: true, seconds: restSecs });
    } catch (error: any) {
      console.log('❌ Log set error:', error?.response?.status, JSON.stringify(error?.response?.data));
      Alert.alert('Error', 'Could not log this set.');
    }
  };

  const finishWorkout = async () => {
    if (!session) return;
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const { data } = await api.post<WorkoutSessionData>(`${WORKOUTS_BASE}sessions/${session.id}/finish/`, {
        duration_seconds: elapsedSeconds,
      });
      setSession(data);
      setShowSummary(true);
    } catch (error: any) {
      console.log('❌ Finish workout error:', error?.response?.status, JSON.stringify(error?.response?.data));
      Alert.alert('Error', 'Could not finish the workout.');
    }
  };

  const closeSummary = () => {
    setShowSummary(false);
    setSession(null); // back to picker
    fetchAll(true);
  };

  const abandonWorkout = () => {
    if (!session) return;
    Alert.alert('Exit Workout', 'Your progress will be saved, but this session will end. Continue?', [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Exit',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`${WORKOUTS_BASE}sessions/${session.id}/abandon/`);
          } catch {}
          setSession(null);
          fetchAll(true);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  const activeTemplate = session?.template ?? null;
  const activeGroupIndex = activeTemplate?.muscle_groups.findIndex((g) => g.id === selectedGroup) ?? -1;
  const activeGroup = activeGroupIndex >= 0 ? activeTemplate!.muscle_groups[activeGroupIndex] : null;
  const activeGroupAccent = activeGroupIndex >= 0 ? getGroupAccent(activeGroupIndex) : Colors.primary;
  const completedSets = session?.completed_sets_count ?? 0;
  const totalSets = session?.total_sets_target ?? 0;
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Workout</Text>
          {session && (
            <View style={styles.timerRow}>
              <Ionicons name="timer-outline" size={14} color={Colors.primary} />
              <Text style={styles.headerTimer}>{formatElapsed(elapsedSeconds)}</Text>
            </View>
          )}
        </View>
        {session && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.exitBtn} onPress={abandonWorkout} activeOpacity={0.85}>
              <Ionicons name="close-outline" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout} activeOpacity={0.85}>
              <Ionicons name="flag-outline" size={16} color={Colors.white} />
              <Text style={styles.finishBtnText}>Finish</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor={Colors.primary} />}
      >

        {/* Weekly Strip — same dark hero language as the other screens */}
        <View style={[styles.weeklyCard, leafRadius(BorderRadius.xl)]}>
          <View style={styles.weeklyBlob} pointerEvents="none" />
          <View style={styles.weeklyTop}>
            <Text style={styles.weeklyTitle}>This Week</Text>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={13} color={Colors.textDark} />
                <Text style={styles.streakText}>{streak} day streak</Text>
              </View>
            )}
          </View>
          <View style={styles.weeklyStrip}>
            {week.map((d) => (
              <View key={d.date} style={styles.weeklyDayCol}>
                <Text style={styles.weeklyDayLabel}>{d.day}</Text>
                <View style={[styles.weeklyDot, d.is_today && styles.weeklyDotToday, d.done && styles.weeklyDotDone]}>
                  {d.done
                    ? <Ionicons name="checkmark-outline" size={14} color={Colors.textDark} />
                    : d.is_today
                    ? <Ionicons name="ellipse" size={8} color={LIME} />
                    : null}
                </View>
                <Text style={styles.weeklyDate}>{d.day_number}</Text>
              </View>
            ))}
          </View>
        </View>

        {!session ? (
          <WorkoutPicker
            templates={templates}
            onPick={startWorkout}
            onCreate={goToCreateWorkout}
            onDelete={deleteTemplate}
            starting={starting}
          />
        ) : (
          <>
            {/* Today's Workout Card */}
            <Text style={styles.sectionTitle}>Today's Workout</Text>
            <View style={[styles.workoutCard, leafRadius(BorderRadius.lg)]}>
              <View style={styles.workoutCardTop}>
                <View style={styles.workoutCardLeft}>
                  <Text style={styles.workoutName}>{activeTemplate!.name}</Text>
                  <Text style={styles.workoutType}>{activeTemplate!.type}</Text>
                </View>
                <View style={[styles.diffBadge, { backgroundColor: getDifficultyColor(activeTemplate!.difficulty) + '22' }]}>
                  <Text style={[styles.diffText, { color: getDifficultyColor(activeTemplate!.difficulty) }]}>
                    {activeTemplate!.difficulty.charAt(0).toUpperCase() + activeTemplate!.difficulty.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.workoutStats}>
                <View style={styles.workoutStat}>
                  <View style={styles.statIconRow}>
                    <Ionicons name="timer-outline" size={18} color={Colors.primary} />
                    <Text style={styles.workoutStatVal}>{activeTemplate!.duration_minutes}</Text>
                  </View>
                  <Text style={styles.workoutStatLabel}>minutes</Text>
                </View>
                <View style={styles.workoutStat}>
                  <View style={styles.statIconRow}>
                    <Ionicons name="flame-outline" size={18} color={Accent.gold} />
                    <Text style={styles.workoutStatVal}>{activeTemplate!.calories_burn}</Text>
                  </View>
                  <Text style={styles.workoutStatLabel}>kcal</Text>
                </View>
                <View style={styles.workoutStat}>
                  <View style={styles.statIconRow}>
                    <Ionicons name="barbell-outline" size={18} color={Accent.teal} />
                    <Text style={styles.workoutStatVal}>{totalSets}</Text>
                  </View>
                  <Text style={styles.workoutStatLabel}>total sets</Text>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Progress</Text>
                  <View style={styles.progressValRow}>
                    <Ionicons name="checkmark-circle-outline" size={14} color={Colors.primary} />
                    <Text style={styles.progressVal}>{completedSets}/{totalSets} sets</Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
              </View>
            </View>

            {/* Muscle Group Tabs */}
            <Text style={styles.sectionTitle}>Exercises by Muscle Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupTabsScroll} contentContainerStyle={styles.groupTabsContent}>
              {activeTemplate!.muscle_groups.map((g, i) => {
                const groupDone = g.exercises.every((e) => (e.logged_sets?.length ?? 0) >= e.target_sets);
                const isActive = selectedGroup === g.id;
                const accent = getGroupAccent(i);
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.groupTab, isActive && { borderColor: accent, backgroundColor: accent + '18' }]}
                    onPress={() => setSelectedGroup(g.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.groupTabText, isActive && { color: accent, fontWeight: '800' }]}>{g.label}</Text>
                    {groupDone && <Ionicons name="checkmark-circle" size={14} color={accent} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Exercise List */}
            {activeGroup && (
              <View style={styles.exerciseList}>
                {activeGroup.exercises.map((exercise) => {
                  const isExpanded = expandedExercise === exercise.id;
                  const doneSets = exercise.logged_sets?.length ?? 0;
                  const allDone = doneSets >= exercise.target_sets;

                  return (
                    <View
                      key={exercise.id}
                      style={[styles.exerciseCard, leafRadius(BorderRadius.lg), allDone && { backgroundColor: getGroupTint(activeGroupIndex) }]}
                    >
                      <TouchableOpacity style={styles.exerciseHeader} onPress={() => setExpandedExercise(isExpanded ? null : exercise.id)} activeOpacity={0.7}>
                        <View style={[styles.exerciseIconBox, { backgroundColor: activeGroupAccent }]}>
                          <Ionicons name={exercise.icon} size={18} color="#fff" />
                        </View>
                        <View style={styles.exerciseHeaderCenter}>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                          <Text style={styles.exerciseMuscle}>{exercise.muscle_group}</Text>
                        </View>
                        <View style={styles.exerciseHeaderRight}>
                          <View style={styles.setsCountRow}>
                            {allDone && <Ionicons name="checkmark-circle" size={13} color={activeGroupAccent} />}
                            <Text style={[styles.exerciseSetsText, { color: activeGroupAccent }]}>{doneSets}/{exercise.target_sets}</Text>
                          </View>
                          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
                        </View>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.exerciseBody}>
                          <View style={[styles.instructionBox, { backgroundColor: getGroupTint(activeGroupIndex) }]}>
                            <Ionicons name="information-circle-outline" size={16} color={activeGroupAccent} />
                            <Text style={styles.instructionText}>{exercise.instructions}</Text>
                          </View>

                          <View style={styles.setsTable}>
                            <View style={styles.setsTableHeader}>
                              <Text style={[styles.setsHeaderCell, { flex: 0.5 }]}>Set</Text>
                              <Text style={styles.setsHeaderCell}>Reps</Text>
                              <Text style={styles.setsHeaderCell}>Kg</Text>
                              <Text style={[styles.setsHeaderCell, { flex: 1.2 }]}>Action</Text>
                            </View>

                            {Array.from({ length: exercise.target_sets }).map((_, idx) => {
                              const logged = exercise.logged_sets?.find((s) => s.set_number === idx + 1);
                              return (
                                <SetRow
                                  key={idx}
                                  index={idx}
                                  target={{ reps: exercise.target_reps, weight_kg: exercise.target_weight_kg }}
                                  logged={logged}
                                  disabled={false}
                                  accent={activeGroupAccent}
                                  onConfirm={(reps, weight) => logSet(exercise, idx + 1, reps, weight, exercise.rest_seconds)}
                                />
                              );
                            })}
                          </View>

                          <View style={styles.restHintRow}>
                            <Ionicons name="timer-outline" size={13} color={Colors.textMuted} />
                            <Text style={styles.restHint}>Rest {exercise.rest_seconds}s between sets</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <RestTimerModal visible={restTimer.visible} seconds={restTimer.seconds} onClose={() => setRestTimer((p) => ({ ...p, visible: false }))} />
      <SummaryModal visible={showSummary} session={session} onClose={closeSummary} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.textDark, letterSpacing: -0.2 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  headerTimer: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exitBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  finishBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.error, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  finishBtnText: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.white },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textDark, marginBottom: Spacing.sm, marginTop: Spacing.md, letterSpacing: -0.2 },

  // Weekly hero — dark card, consistent with Home/Diet/Meal/Weight
  weeklyCard: {
    backgroundColor: Colors.textDark, padding: Spacing.md, gap: Spacing.sm, overflow: 'hidden',
    shadowColor: Colors.textDark, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  weeklyBlob: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -50 },
  weeklyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weeklyTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: LIME, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  streakText: { fontSize: 11.5, fontWeight: '800', color: Colors.textDark },
  weeklyStrip: { flexDirection: 'row', justifyContent: 'space-between' },
  weeklyDayCol: { alignItems: 'center', gap: 4 },
  weeklyDayLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  weeklyDate: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  weeklyDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.14)', justifyContent: 'center', alignItems: 'center' },
  weeklyDotDone: { backgroundColor: LIME, borderColor: LIME },
  weeklyDotToday: { borderColor: LIME, borderWidth: 2 },

  pickerHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  createBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  pickerList: { gap: 12 },
  pickerCard: { backgroundColor: Colors.white, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  pickerCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pickerCardLeft: { flex: 1 },
  pickerCardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  customBadge: { backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  customBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  deleteIconBtn: { padding: 2 },
  pickerStartRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.full, paddingVertical: Spacing.sm },
  pickerStartText: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.primary },

  workoutCard: { backgroundColor: Colors.white, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  workoutCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  workoutCardLeft: { flex: 1 },
  workoutName: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.textDark },
  workoutType: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
  diffBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  diffText: { fontSize: Fonts.sizes.sm, fontWeight: '700' },

  workoutStats: { flexDirection: 'row', justifyContent: 'space-around' },
  workoutStat: { alignItems: 'center', gap: 4 },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  workoutStatVal: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.textDark },
  workoutStatLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },

  progressSection: { gap: 6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '600' },
  progressValRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressVal: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.primary },
  progressTrack: { height: 8, backgroundColor: Colors.background, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },

  groupTabsScroll: { marginBottom: Spacing.sm },
  groupTabsContent: { gap: 8, paddingVertical: 4 },
  groupTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  groupTabText: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted },

  exerciseList: { gap: 10 },
  exerciseCard: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
  exerciseIconBox: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  exerciseHeaderCenter: { flex: 1 },
  exerciseName: { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.textDark },
  exerciseMuscle: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
  exerciseHeaderRight: { alignItems: 'flex-end', gap: 4 },
  setsCountRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  exerciseSetsText: { fontSize: Fonts.sizes.sm, fontWeight: '800' },

  exerciseBody: { borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.md, gap: Spacing.sm, backgroundColor: Colors.background },
  instructionBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, borderRadius: BorderRadius.lg, padding: Spacing.sm },
  instructionText: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.textDark, lineHeight: 18 },

  setsTable: { gap: 6 },
  setsTableHeader: { flexDirection: 'row', paddingHorizontal: Spacing.sm, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: Colors.border },
  setsHeaderCell: { flex: 1, fontSize: 11, fontWeight: '700', color: Colors.textMuted, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.lg, backgroundColor: Colors.white },
  setCell: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.textDark, textAlign: 'center', fontWeight: '600' },
  setInput: {
    flex: 1, height: 32, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.white, textAlign: 'center', fontSize: Fonts.sizes.sm, color: Colors.textDark,
  },
  setInputDone: { backgroundColor: Colors.white, borderColor: 'transparent', color: Colors.textDark, fontWeight: '700' },
  setDoneBtn: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 32, borderRadius: BorderRadius.full, borderWidth: 1.5 },
  setDoneBtnDisabled: { borderColor: Colors.border },
  setDoneBtnText: { fontSize: 11, fontWeight: '700' },
  setDoneBtnTextActive: { color: Colors.white },
  restHintRow: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center' },
  restHint: { fontSize: 11, color: Colors.textMuted },
});

const timerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: Colors.textDark, padding: Spacing.lg, width: 280, alignItems: 'center', gap: Spacing.md, overflow: 'hidden' },
  blob: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.04)', top: -70, right: -60 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: Fonts.sizes.lg, fontWeight: '800', color: '#fff' },
  ring: { width: 136, height: 136, borderRadius: 68, borderWidth: 8, borderColor: LIME, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  timerText: { fontSize: 38, fontWeight: '800', color: '#fff' },
  timerSub: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.6)' },
  hint: { fontSize: Fonts.sizes.sm, color: 'rgba(255,255,255,0.6)' },
  skipBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  skipText: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: '#fff' },
});

const summaryStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: Spacing.lg + 20, alignItems: 'center', gap: Spacing.md },
  trophyRow: { alignItems: 'center' },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.textDark },
  sub: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  statCard: { width: '45%', padding: Spacing.md, alignItems: 'center', gap: 4 },
  statVal: { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.textDark },
  statLabel: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '600' },
  doneBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 56, width: '100%', justifyContent: 'center', marginTop: Spacing.sm },
  doneBtnText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});