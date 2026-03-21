import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const getDaysInMonth = (month: number, year: number) =>
  new Date(year, month + 1, 0).getDate();

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);

// ─── Types ────────────────────────────────────────────────────────────────────

type CalendarMode = 'calendar' | 'month' | 'year';

interface CalendarPickerProps {
  visible: boolean;
  date: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  visible,
  date,
  onChange,
  onClose,
}) => {
  const [viewMonth, setViewMonth] = useState(date.getMonth());
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [mode, setMode] = useState<CalendarMode>('calendar');

  const daysInMonth = getDaysInMonth(viewMonth, viewYear);
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const selectedDay =
    date.getMonth() === viewMonth && date.getFullYear() === viewYear
      ? date.getDate()
      : null;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const handleDayPress = (day: number) => {
    onChange(new Date(viewYear, viewMonth, day));
    onClose();
  };

  const blanks = Array.from({ length: firstDayOfWeek });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <TouchableOpacity
                onPress={() => setMode(mode === 'month' ? 'calendar' : 'month')}
              >
                <Text style={styles.headerMonth}>{MONTHS[viewMonth]}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMode(mode === 'year' ? 'calendar' : 'year')}
              >
                <Text style={styles.headerYear}>{viewYear}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ── Month grid ── */}
          {mode === 'month' && (
            <View style={styles.pickerGrid}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.pickerCell, i === viewMonth && styles.pickerCellActive]}
                  onPress={() => { setViewMonth(i); setMode('calendar'); }}
                >
                  <Text style={[styles.pickerText, i === viewMonth && styles.pickerTextActive]}>
                    {m.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Year scroll ── */}
          {mode === 'year' && (
            <ScrollView style={styles.yearScroll} showsVerticalScrollIndicator={false}>
              {YEARS.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.yearRow, y === viewYear && styles.yearRowActive]}
                  onPress={() => { setViewYear(y); setMode('calendar'); }}
                >
                  <Text style={[styles.yearText, y === viewYear && styles.yearTextActive]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* ── Day grid ── */}
          {mode === 'calendar' && (
            <>
              <View style={styles.weekRow}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <Text key={d} style={styles.weekDay}>{d}</Text>
                ))}
              </View>
              <View style={styles.daysGrid}>
                {blanks.map((_, i) => (
                  <View key={`blank-${i}`} style={styles.dayCell} />
                ))}
                {days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayCell, day === selectedDay && styles.dayCellSelected]}
                    onPress={() => handleDayPress(day)}
                  >
                    <Text style={[styles.dayText, day === selectedDay && styles.dayTextSelected]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.md,
    width: 320,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerCenter: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headerMonth: {
    fontSize: Fonts.sizes.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerYear: {
    fontSize: Fonts.sizes.md,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  navBtn: { padding: 8 },
  navArrow: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Week days
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },

  // Day cells
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: 13,
    color: Colors.textDark,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },

  // Month picker
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 4,
  },
  pickerCell: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  pickerCellActive: {
    backgroundColor: Colors.primary,
  },
  pickerText: {
    fontSize: 13,
    color: Colors.textDark,
    fontWeight: '500',
  },
  pickerTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },

  // Year picker
  yearScroll: { maxHeight: 220 },
  yearRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  yearRowActive: {
    backgroundColor: Colors.primaryMuted,
  },
  yearText: {
    fontSize: 15,
    color: Colors.textDark,
    textAlign: 'center',
  },
  yearTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default CalendarPicker;