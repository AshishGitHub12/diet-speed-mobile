import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH  = SCREEN_WIDTH - 32 - Spacing.md * 2;
const CHART_HEIGHT = 160;

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeightEntry {
  id: number;
  date: string;
  weight: number;
  note?: string;
}

type ChartRange = '1W' | '1M' | '3M' | 'All';

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_ENTRIES: WeightEntry[] = [
  { id: 1,  date: '2026-02-01', weight: 68.5, note: 'Started diet plan' },
  { id: 2,  date: '2026-02-05', weight: 68.0 },
  { id: 3,  date: '2026-02-10', weight: 67.5, note: 'Feeling great' },
  { id: 4,  date: '2026-02-15', weight: 67.8 },
  { id: 5,  date: '2026-02-20', weight: 67.2 },
  { id: 6,  date: '2026-02-25', weight: 66.9, note: 'Skipped gym' },
  { id: 7,  date: '2026-03-01', weight: 66.5 },
  { id: 8,  date: '2026-03-05', weight: 66.2, note: 'Consistent workouts' },
  { id: 9,  date: '2026-03-10', weight: 65.9 },
  { id: 10, date: '2026-03-15', weight: 65.5 },
  { id: 11, date: '2026-03-20', weight: 65.2, note: 'New low!' },
  { id: 12, date: '2026-03-24', weight: 65.0 },
];

const TARGET_WEIGHT  = 62.0;
const START_WEIGHT   = 68.5;
const HEIGHT_CM      = 165;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcBMI = (weight: number, heightCm: number) =>
  parseFloat((weight / Math.pow(heightCm / 100, 2)).toFixed(1));

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { label: 'Underweight', color: '#2196F3' };
  if (bmi < 25)   return { label: 'Normal',       color: '#4CAF50' };
  if (bmi < 30)   return { label: 'Overweight',   color: '#FF9800' };
  return               { label: 'Obese',          color: '#E05C5C' };
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

const formatFullDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
};

const filterByRange = (entries: WeightEntry[], range: ChartRange): WeightEntry[] => {
  const now  = new Date('2026-03-24');
  const copy = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (range === 'All') return copy;
  const days = range === '1W' ? 7 : range === '1M' ? 30 : 90;
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return copy.filter(e => new Date(e.date) >= cutoff);
};

// ─── Mini Line Chart (SVG-free, pure View) ───────────────────────────────────

const LineChart = ({ entries }: { entries: WeightEntry[] }) => {
  if (entries.length < 2) return (
    <View style={chart.empty}>
      <Ionicons name="bar-chart-outline" size={32} color={Colors.border} />
      <Text style={chart.emptyText}>Not enough data</Text>
    </View>
  );

  const weights = entries.map(e => e.weight);
  const minW    = Math.min(...weights) - 0.5;
  const maxW    = Math.max(...weights) + 0.5;
  const range   = maxW - minW || 1;

  const pts = entries.map((e, i) => ({
    x: (i / (entries.length - 1)) * CHART_WIDTH,
    y: CHART_HEIGHT - ((e.weight - minW) / range) * CHART_HEIGHT,
    entry: e,
  }));

  return (
    <View style={[chart.container, { width: CHART_WIDTH, height: CHART_HEIGHT + 40 }]}>
      {/* Y-axis labels */}
      {[0, 0.5, 1].map(t => (
        <View key={t} style={[chart.gridLine, { top: t * CHART_HEIGHT }]}>
          <Text style={chart.yLabel}>{(maxW - t * range).toFixed(1)}</Text>
        </View>
      ))}

      {/* Connecting lines */}
      {pts.slice(0, -1).map((pt, i) => {
        const next   = pts[i + 1];
        const dx     = next.x - pt.x;
        const dy     = next.y - pt.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle  = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View key={i} style={[chart.line, {
            width:  length,
            left:   pt.x,
            top:    pt.y,
            transform: [{ rotate: `${angle}deg` }],
            transformOrigin: '0 0',
          }]} />
        );
      })}

      {/* Dots */}
      {pts.map((pt, i) => (
        <View key={i} style={[chart.dot, { left: pt.x - 5, top: pt.y - 5 }]} />
      ))}

      {/* First & Last labels */}
      <Text style={[chart.xLabel, { left: 0 }]}>{formatDate(entries[0].date)}</Text>
      <Text style={[chart.xLabel, { right: 0 }]}>{formatDate(entries[entries.length - 1].date)}</Text>
    </View>
  );
};

// ─── Log Weight Modal ─────────────────────────────────────────────────────────

const LogWeightModal = ({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (weight: number, note: string) => void;
}) => {
  const [weight, setWeight] = useState('');
  const [note, setNote]     = useState('');

  const handleSave = () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w < 20 || w > 300) {
      Alert.alert('Invalid', 'Please enter a valid weight (20–300 kg).');
      return;
    }
    onSave(w, note);
    setWeight('');
    setNote('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <View style={m.titleRow}>
            <View style={m.titleLeft}>
              <Ionicons name="scale-outline" size={20} color={Colors.primary} />
              <Text style={m.title}>Log Weight</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={m.label}>Today's Weight (kg)</Text>
          <View style={m.weightInputRow}>
            <TextInput
              style={m.weightInput} value={weight} onChangeText={setWeight}
              keyboardType="numeric" placeholder="65.0"
              placeholderTextColor={Colors.textMuted} autoFocus
            />
            <Text style={m.weightUnit}>kg</Text>
          </View>

          <Text style={m.label}>Note (optional)</Text>
          <TextInput
            style={m.noteInput} value={note} onChangeText={setNote}
            placeholder="e.g. After workout, morning weight..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />

          <View style={m.actions}>
            <TouchableOpacity style={m.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={m.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.saveBtn} onPress={handleSave} activeOpacity={0.85}>
              <Ionicons name="checkmark-outline" size={18} color={Colors.white} />
              <Text style={m.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function WeightTrackerScreen() {
  const router = useRouter();
  const [entries, setEntries]       = useState<WeightEntry[]>(DUMMY_ENTRIES);
  const [chartRange, setChartRange] = useState<ChartRange>('1M');
  const [showLogModal, setShowLogModal] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const sorted       = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const currentWeight = sorted[0]?.weight ?? 0;
  const prevWeight    = sorted[1]?.weight ?? currentWeight;
  const weekChange    = currentWeight - (sorted.find(e => {
    const diff = (new Date(sorted[0].date).getTime() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 6;
  })?.weight ?? currentWeight);
  const monthChange   = currentWeight - (sorted.find(e => {
    const diff = (new Date(sorted[0].date).getTime() - new Date(e.date).getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 28;
  })?.weight ?? currentWeight);

  const bmi         = calcBMI(currentWeight, HEIGHT_CM);
  const bmiCategory = getBMICategory(bmi);
  const totalLost   = START_WEIGHT - currentWeight;
  const remaining   = currentWeight - TARGET_WEIGHT;
  const progressPct = Math.min(((START_WEIGHT - currentWeight) / (START_WEIGHT - TARGET_WEIGHT)) * 100, 100);

  const chartEntries = filterByRange(entries, chartRange);

  const handleLogWeight = (weight: number, note: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newEntry: WeightEntry = {
      id: Date.now(), date: today, weight,
      note: note || undefined,
    };
    setEntries(prev => [...prev, newEntry]);
    setShowLogModal(false);
  };

  const handleDeleteEntry = (id: number) => {
    Alert.alert('Delete Entry', 'Remove this weight entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () =>
        setEntries(prev => prev.filter(e => e.id !== id))
      },
    ]);
  };

  const historyToShow = showAllHistory ? sorted : sorted.slice(0, 5);

  const changeColor = (val: number) => val < 0 ? '#4CAF50' : val > 0 ? '#E05C5C' : Colors.textMuted;
  const changeIcon  = (val: number): keyof typeof Ionicons.glyphMap =>
    val < 0 ? 'trending-down-outline' : val > 0 ? 'trending-up-outline' : 'remove-outline';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weight Tracker</Text>
        <TouchableOpacity style={styles.logBtn} onPress={() => setShowLogModal(true)} activeOpacity={0.85}>
          <Ionicons name="add-outline" size={18} color={Colors.white} />
          <Text style={styles.logBtnText}>Log</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Current Weight Hero ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>Current Weight</Text>
            <View style={styles.heroWeightRow}>
              <Text style={styles.heroWeight}>{currentWeight}</Text>
              <Text style={styles.heroUnit}>kg</Text>
            </View>
            <View style={styles.heroChangeRow}>
              <Ionicons name={changeIcon(currentWeight - prevWeight)} size={14} color={changeColor(currentWeight - prevWeight)} />
              <Text style={[styles.heroChange, { color: changeColor(currentWeight - prevWeight) }]}>
                {currentWeight - prevWeight === 0
                  ? 'No change'
                  : `${Math.abs(currentWeight - prevWeight).toFixed(1)} kg from last entry`}
              </Text>
            </View>
            <Text style={styles.heroDate}>Last logged: {formatFullDate(sorted[0]?.date ?? '')}</Text>
          </View>
          <View style={styles.heroRight}>
            <View style={styles.heroIconBox}>
              <Ionicons name="scale-outline" size={36} color={Colors.primary} />
            </View>
          </View>
        </View>

        {/* ── Quick Stats ── */}
        <View style={styles.statsRow}>
          {[
            { label: 'Start',    val: `${START_WEIGHT} kg`,  icon: 'flag-outline'         as const, color: Colors.primary },
            { label: 'Lost',     val: `${totalLost.toFixed(1)} kg`, icon: 'trending-down-outline' as const, color: '#4CAF50' },
            { label: 'Target',   val: `${TARGET_WEIGHT} kg`, icon: 'trophy-outline'       as const, color: '#FF9800' },
            { label: 'To Go',    val: `${remaining > 0 ? remaining.toFixed(1) : '0'} kg`, icon: 'navigate-outline' as const, color: Colors.primary },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: s.color + '18' }]}>
                <Ionicons name={s.icon} size={16} color={s.color} />
              </View>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Progress to Target ── */}
        <Text style={styles.sectionTitle}>Progress to Target</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <View style={styles.progressLabelCol}>
              <View style={styles.progressLabelRow}>
                <Ionicons name="barbell-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.progressLabelText}>Start: {START_WEIGHT} kg</Text>
              </View>
              <View style={styles.progressLabelRow}>
                <Ionicons name="trophy-outline" size={14} color="#FF9800" />
                <Text style={styles.progressLabelText}>Target: {TARGET_WEIGHT} kg</Text>
              </View>
            </View>
            <View style={styles.progressPctBadge}>
              <Text style={styles.progressPctText}>{Math.round(progressPct)}%</Text>
              <Text style={styles.progressPctSub}>complete</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
            <View style={[styles.progressBarThumb, { left: `${Math.min(progressPct, 97)}%` as any }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressFooterText}>
              {remaining > 0
                ? `${remaining.toFixed(1)} kg left to reach your goal`
                : 'Goal reached! Set a new target.'}
            </Text>
            {remaining <= 0 && <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />}
          </View>
        </View>

        {/* ── BMI Card ── */}
        <Text style={styles.sectionTitle}>BMI Indicator</Text>
        <View style={styles.bmiCard}>
          <View style={styles.bmiLeft}>
            <View style={styles.bmiValueRow}>
              <Text style={styles.bmiValue}>{bmi}</Text>
              <View style={[styles.bmiCategoryBadge, { backgroundColor: bmiCategory.color + '22' }]}>
                <Text style={[styles.bmiCategoryText, { color: bmiCategory.color }]}>{bmiCategory.label}</Text>
              </View>
            </View>
            <Text style={styles.bmiSub}>Based on {currentWeight} kg / {HEIGHT_CM} cm</Text>
          </View>
          <View style={styles.bmiScale}>
            {[
              { label: '<18.5', cat: 'Under',  color: '#2196F3' },
              { label: '18.5–24.9', cat: 'Normal', color: '#4CAF50' },
              { label: '25–29.9', cat: 'Over', color: '#FF9800' },
              { label: '30+', cat: 'Obese',   color: '#E05C5C' },
            ].map((b, i) => (
              <View key={i} style={styles.bmiScaleItem}>
                <View style={[styles.bmiScaleDot, {
                  backgroundColor: b.color,
                  transform: [{ scale: b.color === bmiCategory.color ? 1.3 : 1 }],
                }]} />
                <Text style={[styles.bmiScaleLabel, { color: b.color === bmiCategory.color ? b.color : Colors.textMuted }]}>
                  {b.cat}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Weekly / Monthly Change ── */}
        <Text style={styles.sectionTitle}>Weight Changes</Text>
        <View style={styles.changeRow}>
          <View style={styles.changeCard}>
            <View style={styles.changeIconRow}>
              <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.changeCardLabel}>This Week</Text>
            </View>
            <View style={styles.changeValRow}>
              <Ionicons name={changeIcon(weekChange)} size={18} color={changeColor(weekChange)} />
              <Text style={[styles.changeVal, { color: changeColor(weekChange) }]}>
                {weekChange === 0 ? '0.0' : Math.abs(weekChange).toFixed(1)} kg
              </Text>
            </View>
            <Text style={styles.changeSub}>{weekChange < 0 ? 'Lost' : weekChange > 0 ? 'Gained' : 'No change'}</Text>
          </View>
          <View style={styles.changeCard}>
            <View style={styles.changeIconRow}>
              <Ionicons name="calendar-clear-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.changeCardLabel}>This Month</Text>
            </View>
            <View style={styles.changeValRow}>
              <Ionicons name={changeIcon(monthChange)} size={18} color={changeColor(monthChange)} />
              <Text style={[styles.changeVal, { color: changeColor(monthChange) }]}>
                {monthChange === 0 ? '0.0' : Math.abs(monthChange).toFixed(1)} kg
              </Text>
            </View>
            <Text style={styles.changeSub}>{monthChange < 0 ? 'Lost' : monthChange > 0 ? 'Gained' : 'No change'}</Text>
          </View>
          <View style={styles.changeCard}>
            <View style={styles.changeIconRow}>
              <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.changeCardLabel}>Total</Text>
            </View>
            <View style={styles.changeValRow}>
              <Ionicons name={changeIcon(currentWeight - START_WEIGHT)} size={18} color={changeColor(currentWeight - START_WEIGHT)} />
              <Text style={[styles.changeVal, { color: changeColor(currentWeight - START_WEIGHT) }]}>
                {Math.abs(currentWeight - START_WEIGHT).toFixed(1)} kg
              </Text>
            </View>
            <Text style={styles.changeSub}>{currentWeight < START_WEIGHT ? 'Lost total' : 'Gained total'}</Text>
          </View>
        </View>

        {/* ── Weight Chart ── */}
        <Text style={styles.sectionTitle}>Weight History Chart</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartRangeTabs}>
            {(['1W','1M','3M','All'] as ChartRange[]).map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.rangeTab, chartRange === r && styles.rangeTabActive]}
                onPress={() => setChartRange(r)} activeOpacity={0.7}
              >
                <Text style={[styles.rangeTabText, chartRange === r && styles.rangeTabTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <LineChart entries={chartEntries} />
        </View>

        {/* ── Weight History Log ── */}
        <Text style={styles.sectionTitle}>Log History</Text>
        <View style={styles.historyCard}>
          {historyToShow.map((entry, i) => {
            const prev   = sorted[i + 1];
            const change = prev ? entry.weight - prev.weight : 0;
            return (
              <TouchableOpacity
                key={entry.id}
                style={[styles.historyRow, i < historyToShow.length - 1 && styles.historyRowBorder]}
                onLongPress={() => handleDeleteEntry(entry.id)}
                activeOpacity={0.7}
              >
                <View style={styles.historyIconBox}>
                  <Ionicons name="scale-outline" size={16} color={Colors.primary} />
                </View>
                <View style={styles.historyCenter}>
                  <Text style={styles.historyDate}>{formatFullDate(entry.date)}</Text>
                  {entry.note && (
                    <View style={styles.historyNoteRow}>
                      <Ionicons name="chatbubble-outline" size={11} color={Colors.textMuted} />
                      <Text style={styles.historyNote}>{entry.note}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyWeight}>{entry.weight} kg</Text>
                  {prev && (
                    <View style={styles.historyChangeRow}>
                      <Ionicons name={changeIcon(change)} size={11} color={changeColor(change)} />
                      <Text style={[styles.historyChange, { color: changeColor(change) }]}>
                        {Math.abs(change).toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {sorted.length > 5 && (
            <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllHistory(!showAllHistory)} activeOpacity={0.7}>
              <Ionicons name={showAllHistory ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={Colors.primary} />
              <Text style={styles.showMoreText}>{showAllHistory ? 'Show Less' : `Show All (${sorted.length})`}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Tip Card ── */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconBox}>
            <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
          </View>
          <Text style={styles.tipText}>
            Weigh yourself at the same time each day — ideally morning, after using the bathroom — for the most consistent results.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <LogWeightModal visible={showLogModal} onClose={() => setShowLogModal(false)} onSave={handleLogWeight} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.primaryMuted },
  headerBtn:   { width: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.primary },
  logBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  logBtnText:  { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.white },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  sectionTitle:  { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark, marginBottom: Spacing.sm, marginTop: Spacing.md },

  // Hero
  heroCard:      { backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  heroLeft:      { flex: 1, gap: 4 },
  heroLabel:     { fontSize: Fonts.sizes.sm, color: Colors.textMuted, fontWeight: '600' },
  heroWeightRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  heroWeight:    { fontSize: 48, fontWeight: '900', color: Colors.primary, lineHeight: 52 },
  heroUnit:      { fontSize: Fonts.sizes.lg, color: Colors.primary, fontWeight: '600', marginBottom: 8 },
  heroChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroChange:    { fontSize: Fonts.sizes.sm, fontWeight: '600' },
  heroDate:      { fontSize: 11, color: Colors.textMuted },
  heroRight:     {},
  heroIconBox:   { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },

  // Stats
  statsRow:    { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  statCard:    { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.sm, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: Colors.border },
  statIconBox: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statVal:     { fontSize: Fonts.sizes.sm, fontWeight: '800', color: Colors.textDark },
  statLabel:   { fontSize: 10, color: Colors.textMuted },

  // Progress
  progressCard:    { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  progressTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabelCol:{ gap: 4 },
  progressLabelRow:{ flexDirection: 'row', alignItems: 'center', gap: 5 },
  progressLabelText:{ fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  progressPctBadge:{ alignItems: 'center', backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  progressPctText: { fontSize: Fonts.sizes.xl, fontWeight: '900', color: Colors.primary },
  progressPctSub:  { fontSize: 10, color: Colors.textMuted },
  progressBarBg:   { height: 14, backgroundColor: Colors.background, borderRadius: 7, overflow: 'visible', position: 'relative' },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 7 },
  progressBarThumb:{ position: 'absolute', top: -3, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white, borderWidth: 3, borderColor: Colors.primary },
  progressFooter:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressFooterText:{ fontSize: Fonts.sizes.sm, color: Colors.textMuted, flex: 1 },

  // BMI
  bmiCard:          { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  bmiLeft:          { gap: 4 },
  bmiValueRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  bmiValue:         { fontSize: 36, fontWeight: '900', color: Colors.textDark },
  bmiCategoryBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  bmiCategoryText:  { fontSize: Fonts.sizes.sm, fontWeight: '700' },
  bmiSub:           { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
  bmiScale:         { flexDirection: 'row', justifyContent: 'space-between' },
  bmiScaleItem:     { alignItems: 'center', gap: 4 },
  bmiScaleDot:      { width: 12, height: 12, borderRadius: 6 },
  bmiScaleLabel:    { fontSize: 10, fontWeight: '600' },

  // Changes
  changeRow:      { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  changeCard:     { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  changeIconRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeCardLabel:{ fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  changeValRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  changeVal:      { fontSize: Fonts.sizes.lg, fontWeight: '800' },
  changeSub:      { fontSize: 10, color: Colors.textMuted },

  // Chart
  chartCard:       { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  chartRangeTabs:  { flexDirection: 'row', gap: 8 },
  rangeTab:        { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  rangeTabActive:  { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  rangeTabText:    { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted },
  rangeTabTextActive:{ color: Colors.primary },

  // History
  historyCard:      { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  historyRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
  historyRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyIconBox:   { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  historyCenter:    { flex: 1, gap: 2 },
  historyDate:      { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textDark },
  historyNoteRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  historyNote:      { fontSize: 11, color: Colors.textMuted },
  historyRight:     { alignItems: 'flex-end', gap: 2 },
  historyWeight:    { fontSize: Fonts.sizes.md, fontWeight: '800', color: Colors.primary },
  historyChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  historyChange:    { fontSize: 11, fontWeight: '600' },
  showMoreBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },
  showMoreText:     { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.primary },

  // Tip
  tipCard:    { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm, marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.primary },
  tipIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
  tipText:    { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.textDark, lineHeight: 20 },
});

// ─── Chart Styles ─────────────────────────────────────────────────────────────

const chart = StyleSheet.create({
  container: { position: 'relative' },
  gridLine:  { position: 'absolute', left: 28, right: 0, height: 1, backgroundColor: Colors.border + '60' },
  yLabel:    { position: 'absolute', left: -28, top: -8, fontSize: 10, color: Colors.textMuted, width: 26, textAlign: 'right' },
  line:      { position: 'absolute', height: 2, backgroundColor: Colors.primary, borderRadius: 1 },
  dot:       { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.white },
  xLabel:    { position: 'absolute', bottom: 0, fontSize: 10, color: Colors.textMuted },
  empty:     { height: CHART_HEIGHT, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: Fonts.sizes.sm, color: Colors.textMuted },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg + 16, paddingTop: Spacing.sm },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md },
  titleRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  titleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title:     { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark },
  label:     { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted, marginBottom: 6 },
  weightInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  weightInput:    { flex: 1, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: 28, fontWeight: '800', color: Colors.primary, textAlign: 'center', backgroundColor: Colors.background },
  weightUnit:     { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textMuted },
  noteInput:      { borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: Fonts.sizes.md, color: Colors.textDark, minHeight: 70, marginBottom: Spacing.lg, backgroundColor: Colors.background },
  actions:    { flexDirection: 'row', gap: 12 },
  cancelBtn:  { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, height: 52, justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontSize: Fonts.sizes.md, color: Colors.textMuted, fontWeight: '600' },
  saveBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, height: 52 },
  saveText:   { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.white },
});