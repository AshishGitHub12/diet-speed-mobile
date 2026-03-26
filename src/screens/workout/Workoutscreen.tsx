import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExerciseSet {
  id: number; reps: number; weight_kg: number; completed: boolean;
}
interface Exercise {
  id: number; name: string; muscle_group: string;
  icon: keyof typeof Ionicons.glyphMap;
  sets: ExerciseSet[]; rest_seconds: number; instructions: string;
}
interface MuscleGroup {
  id: string; label: string; icon: keyof typeof Ionicons.glyphMap; exercises: Exercise[];
}
interface WorkoutData {
  id: number; name: string; type: string; duration_minutes: number;
  difficulty: 'beginner'|'intermediate'|'advanced'; calories_burn: number;
  muscle_groups: MuscleGroup[];
}
interface WeekDay {
  day: string; date: number; done: boolean; isToday: boolean; isRest: boolean;
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const WEEKLY_DATA: WeekDay[] = [
  { day: 'Mon', date: 18, done: true,  isToday: false, isRest: false },
  { day: 'Tue', date: 19, done: true,  isToday: false, isRest: false },
  { day: 'Wed', date: 20, done: false, isToday: false, isRest: true  },
  { day: 'Thu', date: 21, done: true,  isToday: false, isRest: false },
  { day: 'Fri', date: 22, done: true,  isToday: false, isRest: false },
  { day: 'Sat', date: 23, done: false, isToday: false, isRest: false },
  { day: 'Sun', date: 24, done: false, isToday: true,  isRest: false },
];

const WORKOUT_DATA: WorkoutData = {
  id: 1, name: 'Full Body Strength', type: 'Strength Training',
  duration_minutes: 50, difficulty: 'intermediate', calories_burn: 380,
  muscle_groups: [
    {
      id: 'chest', label: 'Chest', icon: 'body-outline',
      exercises: [
        { id: 1, name: 'Push Ups', muscle_group: 'Chest', icon: 'fitness-outline', rest_seconds: 60,
          instructions: 'Keep body straight. Lower chest to floor, push back up.',
          sets: [{ id:1, reps:15, weight_kg:0, completed:false },{ id:2, reps:15, weight_kg:0, completed:false },{ id:3, reps:12, weight_kg:0, completed:false }] },
        { id: 2, name: 'Dumbbell Press', muscle_group: 'Chest', icon: 'barbell-outline', rest_seconds: 90,
          instructions: 'Lie flat. Press dumbbells up until arms extended, lower slowly.',
          sets: [{ id:1, reps:12, weight_kg:10, completed:false },{ id:2, reps:12, weight_kg:10, completed:false },{ id:3, reps:10, weight_kg:12, completed:false }] },
      ],
    },
    {
      id: 'back', label: 'Back', icon: 'arrow-up-outline',
      exercises: [
        { id: 3, name: 'Pull Ups', muscle_group: 'Back', icon: 'git-pull-request-outline', rest_seconds: 90,
          instructions: 'Hang from bar. Pull up until chin is above the bar.',
          sets: [{ id:1, reps:8, weight_kg:0, completed:false },{ id:2, reps:8, weight_kg:0, completed:false },{ id:3, reps:6, weight_kg:0, completed:false }] },
        { id: 4, name: 'Dumbbell Row', muscle_group: 'Back', icon: 'barbell-outline', rest_seconds: 60,
          instructions: 'Bend forward, pull dumbbell to hip. Keep back straight.',
          sets: [{ id:1, reps:12, weight_kg:8, completed:false },{ id:2, reps:12, weight_kg:8, completed:false },{ id:3, reps:10, weight_kg:10, completed:false }] },
      ],
    },
    {
      id: 'legs', label: 'Legs', icon: 'walk-outline',
      exercises: [
        { id: 5, name: 'Squats', muscle_group: 'Legs', icon: 'accessibility-outline', rest_seconds: 90,
          instructions: 'Feet shoulder-width. Lower until thighs parallel, drive up.',
          sets: [{ id:1, reps:15, weight_kg:0, completed:false },{ id:2, reps:15, weight_kg:0, completed:false },{ id:3, reps:12, weight_kg:0, completed:false }] },
        { id: 6, name: 'Lunges', muscle_group: 'Legs', icon: 'footsteps-outline', rest_seconds: 60,
          instructions: 'Step forward, lower back knee toward ground, return to standing.',
          sets: [{ id:1, reps:12, weight_kg:0, completed:false },{ id:2, reps:12, weight_kg:0, completed:false },{ id:3, reps:10, weight_kg:0, completed:false }] },
      ],
    },
    {
      id: 'shoulders', label: 'Shoulders', icon: 'people-outline',
      exercises: [
        { id: 7, name: 'Shoulder Press', muscle_group: 'Shoulders', icon: 'barbell-outline', rest_seconds: 90,
          instructions: 'Press dumbbells overhead until arms fully extended, lower slowly.',
          sets: [{ id:1, reps:12, weight_kg:8, completed:false },{ id:2, reps:12, weight_kg:8, completed:false },{ id:3, reps:10, weight_kg:10, completed:false }] },
      ],
    },
    {
      id: 'core', label: 'Core', icon: 'locate-outline',
      exercises: [
        { id: 8, name: 'Plank', muscle_group: 'Core', icon: 'remove-outline', rest_seconds: 45,
          instructions: 'Hold body in straight line. Engage core throughout.',
          sets: [{ id:1, reps:30, weight_kg:0, completed:false },{ id:2, reps:30, weight_kg:0, completed:false },{ id:3, reps:30, weight_kg:0, completed:false }] },
        { id: 9, name: 'Crunches', muscle_group: 'Core', icon: 'sync-outline', rest_seconds: 45,
          instructions: 'Lie on back, curl upper body toward knees, lower slowly.',
          sets: [{ id:1, reps:20, weight_kg:0, completed:false },{ id:2, reps:20, weight_kg:0, completed:false },{ id:3, reps:15, weight_kg:0, completed:false }] },
      ],
    },
  ],
};

const REST_TIPS = [
  'Do light stretching for 10–15 minutes',
  'Go for a slow 20-minute walk',
  'Stay hydrated — drink at least 8 glasses today',
  'Aim for 7–8 hours of sleep tonight',
  'Try a short meditation or breathing exercise',
];

const REST_TIPS_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  'body-outline', 'walk-outline', 'water-outline', 'moon-outline', 'heart-outline',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDifficultyColor = (d: string) =>
  d === 'beginner' ? '#4CAF50' : d === 'intermediate' ? '#FF9800' : '#E05C5C';

const getTotalCompletedSets = (groups: MuscleGroup[]) =>
  groups.reduce((t, g) => t + g.exercises.reduce((tt, e) => tt + e.sets.filter(s => s.completed).length, 0), 0);

const getTotalSets = (groups: MuscleGroup[]) =>
  groups.reduce((t, g) => t + g.exercises.reduce((tt, e) => tt + e.sets.length, 0), 0);

const getTotalVolume = (groups: MuscleGroup[]) =>
  groups.reduce((t, g) => t + g.exercises.reduce((tt, e) =>
    tt + e.sets.filter(s => s.completed).reduce((v, s) => v + s.weight_kg * s.reps, 0), 0), 0);

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
      Animated.timing(scaleAnim, { toValue: 1,    duration: 500, useNativeDriver: true }),
    ]).start();
  }, [timeLeft]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={timerStyles.overlay}>
        <View style={timerStyles.card}>
          <View style={timerStyles.iconRow}>
            <Ionicons name="timer-outline" size={24} color={Colors.primary} />
            <Text style={timerStyles.title}>Rest Time</Text>
          </View>
          <Animated.View style={[timerStyles.ring, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={timerStyles.timerText}>{timeLeft}</Text>
            <Text style={timerStyles.timerSub}>seconds</Text>
          </Animated.View>
          <Text style={timerStyles.hint}>Next set coming up...</Text>
          <TouchableOpacity style={timerStyles.skipBtn} onPress={onClose} activeOpacity={0.85}>
            <Ionicons name="play-forward-outline" size={16} color={Colors.textMuted} />
            <Text style={timerStyles.skipText}>Skip Rest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Summary Modal ────────────────────────────────────────────────────────────

const SummaryModal = ({ visible, workout, duration, onClose }: {
  visible: boolean; workout: WorkoutData; duration: number; onClose: () => void;
}) => {
  const completedSets = getTotalCompletedSets(workout.muscle_groups);
  const totalSets     = getTotalSets(workout.muscle_groups);
  const totalVolume   = getTotalVolume(workout.muscle_groups);
  const mins          = Math.floor(duration / 60);

  const stats = [
    { val: `${mins}`,              label: 'Minutes',    icon: 'timer-outline'           as const },
    { val: `${completedSets}/${totalSets}`, label: 'Sets Done', icon: 'checkmark-circle-outline' as const },
    { val: `${totalVolume}kg`,     label: 'Volume',     icon: 'barbell-outline'         as const },
    { val: `${workout.calories_burn}`, label: 'Kcal',   icon: 'flame-outline'           as const },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={summaryStyles.overlay}>
        <View style={summaryStyles.sheet}>
          <View style={summaryStyles.trophyRow}>
            <Ionicons name="trophy" size={56} color="#FFD700" />
          </View>
          <Text style={summaryStyles.title}>Workout Complete!</Text>
          <Text style={summaryStyles.sub}>Great job! Here's your summary</Text>
          <View style={summaryStyles.statsGrid}>
            {stats.map((s, i) => (
              <View key={i} style={summaryStyles.statCard}>
                <Ionicons name={s.icon} size={22} color={Colors.primary} />
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
  const [workout, setWorkout]               = useState<WorkoutData>(WORKOUT_DATA);
  const [selectedGroup, setSelectedGroup]   = useState<string>('chest');
  const [expandedExercise, setExpandedExercise] = useState<number|null>(null);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutDone, setWorkoutDone]       = useState(false);
  const [showSummary, setShowSummary]       = useState(false);
  const [restTimer, setRestTimer]           = useState({ visible: false, seconds: 60 });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const isRestDay = false;

  useEffect(() => {
    if (workoutStarted && !workoutDone) {
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [workoutStarted, workoutDone]);

  const formatElapsed = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const completeSet = (groupId: string, exerciseId: number, setId: number, restSecs: number) => {
    setWorkout(prev => ({
      ...prev,
      muscle_groups: prev.muscle_groups.map(g =>
        g.id !== groupId ? g : {
          ...g,
          exercises: g.exercises.map(e =>
            e.id !== exerciseId ? e : {
              ...e,
              sets: e.sets.map(s => s.id !== setId ? s : { ...s, completed: true }),
            }
          ),
        }
      ),
    }));
    setRestTimer({ visible: true, seconds: restSecs });
  };

  const finishWorkout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setWorkoutDone(true);
    setShowSummary(true);
  };

  const completedSets = getTotalCompletedSets(workout.muscle_groups);
  const totalSets     = getTotalSets(workout.muscle_groups);
  const progress      = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  const activeGroup   = workout.muscle_groups.find(g => g.id === selectedGroup);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Workout</Text>
          {workoutStarted && !workoutDone && (
            <View style={styles.timerRow}>
              <Ionicons name="timer-outline" size={14} color={Colors.primary} />
              <Text style={styles.headerTimer}>{formatElapsed(elapsedSeconds)}</Text>
            </View>
          )}
        </View>
        {workoutStarted && !workoutDone && (
          <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout} activeOpacity={0.85}>
            <Ionicons name="flag-outline" size={16} color={Colors.white} />
            <Text style={styles.finishBtnText}>Finish</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Weekly Strip */}
        <View style={styles.weeklyCard}>
          <View style={styles.weeklyTop}>
            <Text style={styles.weeklyTitle}>This Week</Text>
            <View style={styles.streakBadge}>
              <Ionicons name="flame-outline" size={14} color="#FF9800" />
              <Text style={styles.streakText}>4 day streak</Text>
            </View>
          </View>
          <View style={styles.weeklyStrip}>
            {WEEKLY_DATA.map(d => (
              <View key={d.day} style={styles.weeklyDayCol}>
                <Text style={styles.weeklyDayLabel}>{d.day}</Text>
                <View style={[
                  styles.weeklyDot,
                  d.isToday && styles.weeklyDotToday,
                  d.done    && styles.weeklyDotDone,
                  d.isRest  && styles.weeklyDotRest,
                ]}>
                  {d.isRest
                    ? <Ionicons name="moon-outline"      size={14} color="#90CAF9" />
                    : d.done
                    ? <Ionicons name="checkmark-outline" size={14} color={Colors.white} />
                    : d.isToday
                    ? <Ionicons name="ellipse"           size={8}  color={Colors.primary} />
                    : null
                  }
                </View>
                <Text style={styles.weeklyDate}>{d.date}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Rest Day */}
        {isRestDay ? (
          <View style={styles.restDayCard}>
            <Ionicons name="bed-outline" size={48} color={Colors.primary} />
            <Text style={styles.restDayTitle}>Rest Day</Text>
            <Text style={styles.restDaySub}>Your muscles are recovering. Here's what you can do:</Text>
            <View style={styles.restTipsList}>
              {REST_TIPS.map((tip, i) => (
                <View key={i} style={styles.restTipRow}>
                  <View style={styles.restTipIcon}>
                    <Ionicons name={REST_TIPS_ICONS[i]} size={16} color={Colors.primary} />
                  </View>
                  <Text style={styles.restTipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <>
            {/* Today's Workout Card */}
            <Text style={styles.sectionTitle}>Today's Workout</Text>
            <View style={styles.workoutCard}>
              <View style={styles.workoutCardTop}>
                <View style={styles.workoutCardLeft}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutType}>{workout.type}</Text>
                </View>
                <View style={[styles.diffBadge, { backgroundColor: getDifficultyColor(workout.difficulty) + '22' }]}>
                  <Text style={[styles.diffText, { color: getDifficultyColor(workout.difficulty) }]}>
                    {workout.difficulty.charAt(0).toUpperCase() + workout.difficulty.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.workoutStats}>
                <View style={styles.workoutStat}>
                  <View style={styles.statIconRow}>
                    <Ionicons name="timer-outline" size={18} color={Colors.primary} />
                    <Text style={styles.workoutStatVal}>{workout.duration_minutes}</Text>
                  </View>
                  <Text style={styles.workoutStatLabel}>minutes</Text>
                </View>
                <View style={styles.workoutStat}>
                  <View style={styles.statIconRow}>
                    <Ionicons name="flame-outline" size={18} color="#FF9800" />
                    <Text style={styles.workoutStatVal}>{workout.calories_burn}</Text>
                  </View>
                  <Text style={styles.workoutStatLabel}>kcal</Text>
                </View>
                <View style={styles.workoutStat}>
                  <View style={styles.statIconRow}>
                    <Ionicons name="barbell-outline" size={18} color={Colors.primary} />
                    <Text style={styles.workoutStatVal}>{totalSets}</Text>
                  </View>
                  <Text style={styles.workoutStatLabel}>total sets</Text>
                </View>
              </View>

              {workoutStarted && (
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
              )}

              {!workoutStarted && !workoutDone && (
                <TouchableOpacity style={styles.startBtn} onPress={() => setWorkoutStarted(true)} activeOpacity={0.85}>
                  <Ionicons name="play-circle-outline" size={22} color={Colors.white} />
                  <Text style={styles.startBtnText}>Start Workout</Text>
                </TouchableOpacity>
              )}

              {workoutDone && (
                <View style={styles.doneBanner}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.doneBannerText}>Workout Completed!</Text>
                </View>
              )}
            </View>

            {/* Muscle Group Tabs */}
            <Text style={styles.sectionTitle}>Exercises by Muscle Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupTabsScroll} contentContainerStyle={styles.groupTabsContent}>
              {workout.muscle_groups.map(g => {
                const groupDone = g.exercises.every(e => e.sets.every(s => s.completed));
                const isActive  = selectedGroup === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.groupTab, isActive && styles.groupTabActive]}
                    onPress={() => setSelectedGroup(g.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={g.icon} size={16} color={isActive ? Colors.primary : Colors.textMuted} />
                    <Text style={[styles.groupTabText, isActive && styles.groupTabTextActive]}>{g.label}</Text>
                    {groupDone && <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Exercise List */}
            {activeGroup && (
              <View style={styles.exerciseList}>
                {activeGroup.exercises.map(exercise => {
                  const isExpanded = expandedExercise === exercise.id;
                  const doneSets   = exercise.sets.filter(s => s.completed).length;
                  const allDone    = doneSets === exercise.sets.length;

                  return (
                    <View key={exercise.id} style={[styles.exerciseCard, allDone && styles.exerciseCardDone]}>
                      <TouchableOpacity style={styles.exerciseHeader} onPress={() => setExpandedExercise(isExpanded ? null : exercise.id)} activeOpacity={0.7}>
                        <View style={styles.exerciseIconBox}>
                          <Ionicons name={exercise.icon} size={20} color={Colors.primary} />
                        </View>
                        <View style={styles.exerciseHeaderCenter}>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                          <Text style={styles.exerciseMuscle}>{exercise.muscle_group}</Text>
                        </View>
                        <View style={styles.exerciseHeaderRight}>
                          <View style={styles.setsCountRow}>
                            <Ionicons name="layers-outline" size={12} color={Colors.primary} />
                            <Text style={styles.exerciseSetsText}>{doneSets}/{exercise.sets.length}</Text>
                          </View>
                          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
                        </View>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.exerciseBody}>
                          <View style={styles.instructionBox}>
                            <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                            <Text style={styles.instructionText}>{exercise.instructions}</Text>
                          </View>

                          <View style={styles.setsTable}>
                            <View style={styles.setsTableHeader}>
                              <Text style={[styles.setsHeaderCell, { flex: 0.5 }]}>Set</Text>
                              <Text style={styles.setsHeaderCell}>Reps</Text>
                              <Text style={styles.setsHeaderCell}>Weight</Text>
                              <Text style={[styles.setsHeaderCell, { flex: 1.2 }]}>Action</Text>
                            </View>

                            {exercise.sets.map((set, idx) => (
                              <View key={set.id} style={[styles.setRow, set.completed && styles.setRowDone]}>
                                <Text style={[styles.setCell, { flex: 0.5 }]}>{idx + 1}</Text>
                                <Text style={styles.setCell}>{set.reps}</Text>
                                <Text style={styles.setCell}>{set.weight_kg > 0 ? `${set.weight_kg}kg` : 'BW'}</Text>
                                <TouchableOpacity
                                  style={[
                                    styles.setDoneBtn,
                                    set.completed && styles.setDoneBtnActive,
                                    (!workoutStarted || set.completed) && styles.setDoneBtnDisabled,
                                  ]}
                                  onPress={() => {
                                    if (!workoutStarted) { Alert.alert('Start Workout', 'Please start the workout first!'); return; }
                                    if (!set.completed) completeSet(activeGroup.id, exercise.id, set.id, exercise.rest_seconds);
                                  }}
                                  activeOpacity={0.7}
                                  disabled={set.completed}
                                >
                                  <Ionicons
                                    name={set.completed ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={14}
                                    color={set.completed ? Colors.white : Colors.primary}
                                  />
                                  <Text style={[styles.setDoneBtnText, set.completed && styles.setDoneBtnTextActive]}>
                                    {set.completed ? 'Done' : 'Done'}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            ))}
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

      <RestTimerModal visible={restTimer.visible} seconds={restTimer.seconds} onClose={() => setRestTimer(p => ({ ...p, visible: false }))} />
      <SummaryModal visible={showSummary} workout={workout} duration={elapsedSeconds} onClose={() => setShowSummary(false)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.primaryMuted },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  timerRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  headerTimer: { fontSize: Fonts.sizes.sm, color: Colors.primary, fontWeight: '600' },
  finishBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E05C5C', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  finishBtnText: { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.white },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  sectionTitle:  { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark, marginBottom: Spacing.sm, marginTop: Spacing.md },

  weeklyCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  weeklyTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weeklyTitle:{ fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  streakBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF3E0', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  streakText: { fontSize: Fonts.sizes.sm, fontWeight: '600', color: '#FF9800' },
  weeklyStrip:{ flexDirection: 'row', justifyContent: 'space-between' },
  weeklyDayCol:{ alignItems: 'center', gap: 4 },
  weeklyDayLabel:{ fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  weeklyDate:    { fontSize: 10, color: Colors.textMuted },
  weeklyDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  weeklyDotDone:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  weeklyDotToday: { borderColor: Colors.primary, borderWidth: 2 },
  weeklyDotRest:  { backgroundColor: '#E3F2FD', borderColor: '#90CAF9' },

  restDayCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.md, gap: Spacing.sm },
  restDayTitle:{ fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.textDark },
  restDaySub:  { fontSize: Fonts.sizes.sm, color: Colors.textMuted, textAlign: 'center' },
  restTipsList:{ width: '100%', gap: 8, marginTop: Spacing.sm },
  restTipRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, padding: Spacing.sm + 2, gap: Spacing.sm },
  restTipIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
  restTipText: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.textDark },

  workoutCard:    { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  workoutCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  workoutCardLeft:{ flex: 1 },
  workoutName:    { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.textDark },
  workoutType:    { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  diffBadge:      { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  diffText:       { fontSize: Fonts.sizes.sm, fontWeight: '700' },

  workoutStats:   { flexDirection: 'row', justifyContent: 'space-around' },
  workoutStat:    { alignItems: 'center', gap: 4 },
  statIconRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  workoutStatVal: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  workoutStatLabel:{ fontSize: 11, color: Colors.textMuted },

  progressSection: { gap: 6 },
  progressRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel:   { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  progressValRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressVal:     { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.primary },
  progressTrack:   { height: 8, backgroundColor: Colors.background, borderRadius: 4, overflow: 'hidden' },
  progressFill:    { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },

  startBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 52 },
  startBtnText: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
  doneBanner:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, padding: Spacing.sm },
  doneBannerText:{ fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.primary },

  groupTabsScroll:  { marginBottom: Spacing.sm },
  groupTabsContent: { gap: 8, paddingVertical: 4 },
  groupTab:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  groupTabActive:   { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  groupTabText:     { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted },
  groupTabTextActive:{ color: Colors.primary },

  exerciseList: { gap: 10 },
  exerciseCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  exerciseCardDone: { borderColor: Colors.primary, opacity: 0.9 },
  exerciseHeader:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
  exerciseIconBox:  { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  exerciseHeaderCenter: { flex: 1 },
  exerciseName:   { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.textDark },
  exerciseMuscle: { fontSize: Fonts.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  exerciseHeaderRight: { alignItems: 'flex-end', gap: 4 },
  setsCountRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  exerciseSetsText:{ fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.primary },

  exerciseBody:   { borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.md, gap: Spacing.sm, backgroundColor: Colors.background },
  instructionBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, padding: Spacing.sm },
  instructionText:{ flex: 1, fontSize: Fonts.sizes.sm, color: Colors.textDark, lineHeight: 18 },

  setsTable:      { gap: 6 },
  setsTableHeader:{ flexDirection: 'row', paddingHorizontal: Spacing.sm, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: Colors.border },
  setsHeaderCell: { flex: 1, fontSize: 11, fontWeight: '700', color: Colors.textMuted, textAlign: 'center' },
  setRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.lg, backgroundColor: Colors.white },
  setRowDone: { backgroundColor: Colors.primaryMuted },
  setCell:    { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.textDark, textAlign: 'center', fontWeight: '600' },
  setDoneBtn: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 32, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.primary },
  setDoneBtnActive:   { backgroundColor: Colors.primary },
  setDoneBtnDisabled: { borderColor: Colors.border },
  setDoneBtnText:     { fontSize: 11, fontWeight: '700', color: Colors.primary },
  setDoneBtnTextActive:{ color: Colors.white },
  restHintRow: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center' },
  restHint:    { fontSize: 11, color: Colors.textMuted },
});

const timerStyles = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  card:      { backgroundColor: Colors.white, borderRadius: 24, padding: Spacing.lg, width: 280, alignItems: 'center', gap: Spacing.md },
  iconRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:     { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark },
  ring:      { width: 140, height: 140, borderRadius: 70, borderWidth: 10, borderColor: Colors.primary, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  timerText: { fontSize: 40, fontWeight: '800', color: Colors.primary },
  timerSub:  { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  hint:      { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  skipBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  skipText:  { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted },
});

const summaryStyles = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: Spacing.lg + 20, alignItems: 'center', gap: Spacing.md },
  trophyRow: { alignItems: 'center' },
  title:     { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.textDark },
  sub:       { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  statCard:  { width: '45%', backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', gap: 4 },
  statVal:   { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  doneBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 56, width: '100%', justifyContent: 'center', marginTop: Spacing.sm },
  doneBtnText:{ fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});