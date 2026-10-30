import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Dimensions, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/services/api';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// CONFIRM THIS against your root urls.py — guessed from `from weights.utils
// import get_latest_weight`. If your mount prefix is different, change only
// this one constant.
const WEIGHT_BASE = '/weight/';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH  = SCREEN_WIDTH - 32 - Spacing.md * 2;
const CHART_HEIGHT = 160;

// ─── Shared design system (matches HomeScreen) ─────────────────────────────────
// Same leaf-corner card shape and pastel tint family used across Home, so this
// screen reads as part of the same app instead of a different template.

const Accent = { gold: '#B9892E', plum: '#6E5A8C', teal: '#3E7CA6', berry: '#8B3A42' };
const Tint   = { mint: '#E1EEDD', peach: '#F5E6D3', lilac: '#E7E2F0', sky: '#DCEAF2' };
const LIME   = '#B9F24C'; // the one bright accent, used only on the dark hero

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

// ─── Types — match WeightLogSerializer + WeightHistoryView response ───────────

interface WeightEntry {
  id: number;
  date: string;
  weight: number;
  note?: string | null;
  bmi?: number | null;
}

interface HistoryResponse {
  current_weight: number | null;
  target_weight: number | null;
  height: number | null;
  height_unit: string | null;
  entries: WeightEntry[];
}

type ChartRange = '1W' | '1M' | '3M' | 'All';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calcBMI = (weight: number, heightCm: number) =>
  parseFloat((weight / Math.pow(heightCm / 100, 2)).toFixed(1));

const toHeightCm = (height: number | null, unit: string | null): number | null => {
  if (!height || !unit) return null;
  return unit === 'ft' ? height * 30.48 : height;
};

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { label: 'Underweight', color: '#2196F3' };
  if (bmi < 25)   return { label: 'Normal',       color: Colors.primary };
  if (bmi < 30)   return { label: 'Overweight',   color: Accent.gold };
  return               { label: 'Obese',          color: Colors.error };
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
  const now  = new Date();
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
      <Text style={chart.emptyText}>Not enough data yet</Text>
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
      {[0, 0.5, 1].map(t => (
        <View key={t} style={[chart.gridLine, { top: t * CHART_HEIGHT }]}>
          <Text style={chart.yLabel}>{(maxW - t * range).toFixed(1)}</Text>
        </View>
      ))}

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

      {pts.map((pt, i) => (
        <View key={i} style={[chart.dot, { left: pt.x - 5, top: pt.y - 5 }]} />
      ))}

      <Text style={[chart.xLabel, { left: 0 }]}>{formatDate(entries[0].date)}</Text>
      <Text style={[chart.xLabel, { right: 0 }]}>{formatDate(entries[entries.length - 1].date)}</Text>
    </View>
  );
};

// ─── Log Weight Modal ─────────────────────────────────────────────────────────

const LogWeightModal = ({ visible, onClose, onSave, isSaving }: {
  visible: boolean;
  onClose: () => void;
  onSave: (weight: number, note: string) => void;
  isSaving: boolean;
}) => {
  const [weight, setWeight] = useState('');
  const [note, setNote]     = useState('');

  useEffect(() => {
    if (visible) { setWeight(''); setNote(''); }
  }, [visible]);

  const handleSave = () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w < 20 || w > 300) {
      Alert.alert('Invalid', 'Please enter a valid weight (20–300 kg).');
      return;
    }
    onSave(w, note);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={m.overlay}>
        <View style={m.sheet}>
          <View style={m.handle} />
          <View style={m.titleRow}>
            <View style={m.titleLeft}>
              <View style={m.titleIconChip}>
                <Ionicons name="scale-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={m.title}>Log Weight</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={m.closeBtn}>
              <Ionicons name="close-outline" size={20} color={Colors.textMuted} />
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
            <TouchableOpacity style={m.cancelBtn} onPress={onClose} activeOpacity={0.7} disabled={isSaving}>
              <Text style={m.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={m.saveBtn} onPress={handleSave} activeOpacity={0.85} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-outline" size={18} color={Colors.white} />
                  <Text style={m.saveText}>Save</Text>
                </>
              )}
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

  const [entries, setEntries]           = useState<WeightEntry[]>([]);
  const [targetWeight, setTargetWeight] = useState<number | null>(null);
  const [heightCm, setHeightCm]         = useState<number | null>(null);
  const [chartRange, setChartRange]     = useState<ChartRange>('1M');

  const [isLoading, setIsLoading]           = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [isSavingEntry, setIsSavingEntry]   = useState(false);
  const [showLogModal, setShowLogModal]     = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // Always fetch the full history — chart range filtering happens
      // client-side (filterByRange) so switching tabs doesn't refetch.
      const { data } = await api.get<HistoryResponse>(`${WEIGHT_BASE}history/`, {
        params: { range: 'All' },
      });
      console.log('📥 Weight history response:', JSON.stringify(data, null, 2));

      setEntries(data.entries ?? []);
      setTargetWeight(data.target_weight ?? null);
      setHeightCm(toHeightCm(data.height, data.height_unit));
    } catch (error: any) {
      console.log('❌ Weight history error:', error?.response?.status, JSON.stringify(error?.response?.data));
      Alert.alert('Error', 'Failed to load weight history.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleLogWeight = async (weight: number, note: string) => {
    setIsSavingEntry(true);
    try {
      const payload: Record<string, unknown> = { weight };
      if (note.trim()) payload.note = note.trim();

      console.log('📤 Logging weight:', payload);
      const { data } = await api.post(WEIGHT_BASE, payload);
      console.log('📥 Log weight response:', JSON.stringify(data, null, 2));

      setShowLogModal(false);
      await fetchHistory();
    } catch (error: any) {
      console.log('❌ Log weight error:', error?.response?.status, JSON.stringify(error?.response?.data));
      Alert.alert('Error', error?.response?.data?.weight?.[0] || 'Failed to log weight.');
    } finally {
      setIsSavingEntry(false);
    }
  };

  const handleDeleteEntry = (id: number) => {
    Alert.alert('Delete Entry', 'Remove this weight entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const previous = entries;
          setEntries(prev => prev.filter(e => e.id !== id)); // optimistic
          try {
            await api.delete(`${WEIGHT_BASE}${id}/`);
          } catch (error: any) {
            console.log('❌ Delete weight error:', error?.response?.status);
            Alert.alert('Error', 'Failed to delete entry.');
            setEntries(previous); // revert
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const sorted = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const hasEntries = sorted.length > 0;

  const currentWeight = sorted[0]?.weight ?? null;
  const prevWeight    = sorted[1]?.weight ?? currentWeight;
  const startWeight   = sorted[sorted.length - 1]?.weight ?? currentWeight;

  const weekChange = currentWeight != null
    ? currentWeight - (sorted.find(e => {
        const diff = (new Date(sorted[0].date).getTime() - new Date(e.date).getTime()) / 86400000;
        return diff >= 6;
      })?.weight ?? currentWeight)
    : 0;
  const monthChange = currentWeight != null
    ? currentWeight - (sorted.find(e => {
        const diff = (new Date(sorted[0].date).getTime() - new Date(e.date).getTime()) / 86400000;
        return diff >= 28;
      })?.weight ?? currentWeight)
    : 0;

  const bmi         = currentWeight != null && heightCm ? calcBMI(currentWeight, heightCm) : null;
  const bmiCategory = bmi != null ? getBMICategory(bmi) : null;

  const hasTarget  = targetWeight != null && startWeight != null && startWeight !== targetWeight;
  const totalLost  = currentWeight != null && startWeight != null ? startWeight - currentWeight : 0;
  const remaining  = currentWeight != null && targetWeight != null ? currentWeight - targetWeight : 0;
  const progressPct = hasTarget && currentWeight != null
    ? Math.min(Math.max(((startWeight! - currentWeight) / (startWeight! - targetWeight!)) * 100, 0), 100)
    : 0;

  const chartEntries = filterByRange(entries, chartRange);
  const historyToShow = showAllHistory ? sorted : sorted.slice(0, 5);

  const changeColor = (val: number) => val < 0 ? Colors.primary : val > 0 ? Colors.error : Colors.textMuted;
  const changeIcon  = (val: number): keyof typeof Ionicons.glyphMap =>
    val < 0 ? 'trending-down-outline' : val > 0 ? 'trending-up-outline' : 'remove-outline';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weight Tracker</Text>
        <TouchableOpacity style={styles.logBtn} onPress={() => setShowLogModal(true)} activeOpacity={0.85}>
          <Ionicons name="add-outline" size={18} color={Colors.white} />
          <Text style={styles.logBtnText}>Log</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} tintColor={Colors.primary} />
        }
      >

        {!hasEntries ? (
          <View style={styles.emptyState}>
            <Ionicons name="scale-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>No weight logged yet</Text>
            <Text style={styles.emptyText}>Tap "Log" above to record your first entry.</Text>
          </View>
        ) : (
          <>
            {/* ── Hero: today's weight, same dark card language as Home ── */}
            <View style={[styles.heroCard, leafRadius(BorderRadius.xl)]}>
              <View style={styles.heroBlob} pointerEvents="none" />
              <View style={styles.heroTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroLabel}>Current Weight</Text>
                  <View style={styles.heroWeightRow}>
                    <Text style={styles.heroWeight}>{currentWeight}</Text>
                    <Text style={styles.heroUnit}>kg</Text>
                  </View>
                  <View style={styles.heroChangeRow}>
                    <Ionicons
                      name={changeIcon(currentWeight! - prevWeight!)}
                      size={13}
                      color={currentWeight === prevWeight ? 'rgba(255,255,255,0.6)' : LIME}
                    />
                    <Text style={styles.heroChange}>
                      {currentWeight === prevWeight
                        ? 'No change'
                        : `${Math.abs(currentWeight! - prevWeight!).toFixed(1)} kg from last entry`}
                    </Text>
                  </View>
                </View>
                <View style={styles.heroIconBox}>
                  <Ionicons name="scale-outline" size={28} color={Colors.textDark} />
                </View>
              </View>
              <Text style={styles.heroDate}>Last logged: {formatFullDate(sorted[0]?.date ?? '')}</Text>
            </View>

            {/* ── Quick stats, same pastel-tile language as Home's tools ── */}
            <View style={styles.statsRow}>
              {[
                { label: 'Start',  val: startWeight != null ? `${startWeight} kg` : '—', icon: 'flag-outline' as const, tint: Tint.mint, accent: Colors.primary },
                { label: 'Lost',   val: `${totalLost.toFixed(1)} kg`, icon: 'trending-down-outline' as const, tint: Tint.sky, accent: Accent.teal },
                { label: 'Target', val: targetWeight != null ? `${targetWeight} kg` : 'Not set', icon: 'trophy-outline' as const, tint: Tint.peach, accent: Accent.gold },
                { label: 'To Go',  val: hasTarget ? `${remaining > 0 ? remaining.toFixed(1) : '0'} kg` : '—', icon: 'navigate-outline' as const, tint: Tint.lilac, accent: Accent.plum },
              ].map((s, i) => (
                <View key={i} style={[styles.statCard, leafRadius(BorderRadius.md), { backgroundColor: s.tint }]}>
                  <View style={[styles.statIconBox, { backgroundColor: s.accent }]}>
                    <Ionicons name={s.icon} size={14} color="#fff" />
                  </View>
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {hasTarget ? (
              <>
                <Text style={styles.sectionTitle}>Progress to Target</Text>
                <View style={[styles.progressCard, leafRadius(BorderRadius.lg)]}>
                  <View style={styles.progressTopRow}>
                    <View style={styles.progressLabelCol}>
                      <View style={styles.progressLabelRow}>
                        <Ionicons name="barbell-outline" size={14} color={Colors.textMuted} />
                        <Text style={styles.progressLabelText}>Start: {startWeight} kg</Text>
                      </View>
                      <View style={styles.progressLabelRow}>
                        <Ionicons name="trophy-outline" size={14} color={Accent.gold} />
                        <Text style={styles.progressLabelText}>Target: {targetWeight} kg</Text>
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
                    {remaining <= 0 && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />}
                  </View>
                </View>
              </>
            ) : (
              <View style={[styles.noTargetCard, leafRadius(BorderRadius.lg)]}>
                <Ionicons name="flag-outline" size={18} color={Colors.textMuted} />
                <Text style={styles.noTargetText}>
                  Set a target weight in My Account to track progress here.
                </Text>
              </View>
            )}

            {bmi != null && bmiCategory && (
              <>
                <Text style={styles.sectionTitle}>BMI Indicator</Text>
                <View style={[styles.bmiCard, leafRadius(BorderRadius.lg)]}>
                  <View style={styles.bmiLeft}>
                    <View style={styles.bmiValueRow}>
                      <Text style={styles.bmiValue}>{bmi}</Text>
                      <View style={[styles.bmiCategoryBadge, { backgroundColor: bmiCategory.color + '22' }]}>
                        <Text style={[styles.bmiCategoryText, { color: bmiCategory.color }]}>{bmiCategory.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.bmiSub}>Based on {currentWeight} kg / {Math.round(heightCm!)} cm</Text>
                  </View>
                  <View style={styles.bmiScale}>
                    {[
                      { label: '<18.5', cat: 'Under',  color: '#2196F3' },
                      { label: '18.5–24.9', cat: 'Normal', color: Colors.primary },
                      { label: '25–29.9', cat: 'Over', color: Accent.gold },
                      { label: '30+', cat: 'Obese',   color: Colors.error },
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
              </>
            )}

            <Text style={styles.sectionTitle}>Weight Changes</Text>
            <View style={styles.changeRow}>
              {[
                { label: 'This Week',  icon: 'calendar-outline' as const, val: weekChange, tint: Tint.mint },
                { label: 'This Month', icon: 'calendar-clear-outline' as const, val: monthChange, tint: Tint.peach },
                { label: 'Total',      icon: 'time-outline' as const, val: currentWeight! - startWeight!, tint: Tint.lilac },
              ].map((c, i) => (
                <View key={i} style={[styles.changeCard, leafRadius(BorderRadius.md), { backgroundColor: c.tint }]}>
                  <View style={styles.changeIconRow}>
                    <Ionicons name={c.icon} size={14} color={Colors.textMuted} />
                    <Text style={styles.changeCardLabel}>{c.label}</Text>
                  </View>
                  <View style={styles.changeValRow}>
                    <Ionicons name={changeIcon(c.val)} size={16} color={changeColor(c.val)} />
                    <Text style={[styles.changeVal, { color: changeColor(c.val) }]}>
                      {c.val === 0 ? '0.0' : Math.abs(c.val).toFixed(1)} kg
                    </Text>
                  </View>
                  <Text style={styles.changeSub}>{c.val < 0 ? 'Lost' : c.val > 0 ? 'Gained' : 'No change'}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Weight History Chart</Text>
            <View style={[styles.chartCard, leafRadius(BorderRadius.lg)]}>
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

            <Text style={styles.sectionTitle}>Log History</Text>
            <View style={[styles.historyCard, leafRadius(BorderRadius.lg)]}>
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
                      {!!entry.note && (
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

            <Text style={styles.longPressHint}>Tip: long-press an entry to delete it.</Text>

            <View style={[styles.tipCard, leafRadius(BorderRadius.lg)]}>
              <View style={styles.tipIconBox}>
                <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.tipText}>
                Weigh yourself at the same time each day — ideally morning, after using the bathroom — for the most consistent results.
              </Text>
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <LogWeightModal
        visible={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSave={handleLogWeight}
        isSaving={isSavingEntry}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn:   {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.textDark, letterSpacing: -0.2 },
  logBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 9 },
  logBtnText:  { fontSize: Fonts.sizes.sm, fontWeight: '700', color: Colors.white },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  sectionTitle:  { fontSize: 16, fontWeight: '800', color: Colors.textDark, marginBottom: Spacing.sm, marginTop: Spacing.md, letterSpacing: -0.2 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.lg * 3, gap: Spacing.sm },
  emptyTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.textDark },
  emptyText:  { fontSize: Fonts.sizes.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.lg },

  noTargetCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.white, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  noTargetText: { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.textMuted },

  longPressHint: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },

  // Hero — same dark-card language as Home's calorie card
  heroCard: {
    backgroundColor: Colors.textDark, padding: Spacing.md, marginBottom: Spacing.sm, overflow: 'hidden',
    shadowColor: Colors.textDark, shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  heroBlob:      { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -50 },
  heroTopRow:    { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroLabel:     { fontSize: 12.5, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  heroWeightRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, marginTop: 4 },
  heroWeight:    { fontSize: 42, fontWeight: '900', color: '#fff', lineHeight: 46 },
  heroUnit:      { fontSize: 15, color: 'rgba(255,255,255,0.7)', fontWeight: '700', marginBottom: 7 },
  heroChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  heroChange:    { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.78)' },
  heroDate:      { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: Spacing.sm },
  heroIconBox:   { width: 56, height: 56, borderRadius: 18, backgroundColor: LIME, justifyContent: 'center', alignItems: 'center' },

  statsRow:    { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  statCard:    { flex: 1, padding: Spacing.sm, alignItems: 'center', gap: 4 },
  statIconBox: { width: 28, height: 28, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statVal:     { fontSize: Fonts.sizes.sm, fontWeight: '800', color: Colors.textDark },
  statLabel:   { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },

  progressCard:    { backgroundColor: Colors.white, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
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

  bmiCard:          { backgroundColor: Colors.white, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
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

  changeRow:      { flexDirection: 'row', gap: 8, marginBottom: Spacing.sm },
  changeCard:     { flex: 1, padding: Spacing.sm, gap: 4 },
  changeIconRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  changeCardLabel:{ fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  changeValRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  changeVal:      { fontSize: Fonts.sizes.lg, fontWeight: '800' },
  changeSub:      { fontSize: 10, color: Colors.textMuted },

  chartCard:       { backgroundColor: Colors.white, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  chartRangeTabs:  { flexDirection: 'row', gap: 8 },
  rangeTab:        { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  rangeTabActive:  { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  rangeTabText:    { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted },
  rangeTabTextActive:{ color: Colors.primary },

  historyCard:      { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  historyRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
  historyRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyIconBox:   { width: 36, height: 36, borderRadius: 14, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
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

  tipCard:    { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Tint.mint, padding: Spacing.md, gap: Spacing.sm, marginTop: Spacing.sm },
  tipIconBox: { width: 34, height: 34, borderRadius: 14, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
  tipText:    { flex: 1, fontSize: Fonts.sizes.sm, color: Colors.textDark, lineHeight: 20 },
});

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

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:   { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 24, paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg + 16, paddingTop: Spacing.sm },
  handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: Spacing.md },
  titleRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  titleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleIconChip: { width: 34, height: 34, borderRadius: 14, backgroundColor: Colors.primaryMuted, justifyContent: 'center', alignItems: 'center' },
  title:     { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.textDark },
  closeBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
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