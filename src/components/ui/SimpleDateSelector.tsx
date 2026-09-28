import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';
import DropdownModal from '@/src/components/ui/Dropdownmodal';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => String(currentYear - i));
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));

interface SimpleDateSelectorProps {
  date: Date;
  onChange: (date: Date) => void;
}

const SimpleDateSelector: React.FC<SimpleDateSelectorProps> = ({ date, onChange }) => {
  const [showDay, setShowDay] = useState(false);
  const [showMonth, setShowMonth] = useState(false);
  const [showYear, setShowYear] = useState(false);

  const day = String(date.getDate());
  const month = MONTHS[date.getMonth()];
  const year = String(date.getFullYear());

  const update = (part: 'day' | 'month' | 'year', value: string) => {
    const next = new Date(date);
    if (part === 'day') next.setDate(parseInt(value, 10));
    if (part === 'month') next.setMonth(MONTHS.indexOf(value));
    if (part === 'year') next.setFullYear(parseInt(value, 10));
    onChange(next);
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.field} onPress={() => setShowDay(true)}>
        <Text style={styles.value}>{day}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.field, styles.fieldWide]} onPress={() => setShowMonth(true)}>
        <Text style={styles.value}>{month}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.field} onPress={() => setShowYear(true)}>
        <Text style={styles.value}>{year}</Text>
      </TouchableOpacity>

      <DropdownModal
        visible={showDay}
        title="Day"
        options={DAYS}
        selected={day}
        onSelect={(v) => update('day', v)}
        onClose={() => setShowDay(false)}
      />
      <DropdownModal
        visible={showMonth}
        title="Month"
        options={MONTHS}
        selected={month}
        onSelect={(v) => update('month', v)}
        onClose={() => setShowMonth(false)}
      />
      <DropdownModal
        visible={showYear}
        title="Year"
        options={YEARS}
        selected={year}
        onSelect={(v) => update('year', v)}
        onClose={() => setShowYear(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.sm },
  field: {
    flex: 1,
    height: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldWide: { flex: 1.4 },
  value: { fontSize: Fonts.sizes.sm, color: Colors.textDark, fontWeight: '600' },
});

export default SimpleDateSelector;
export { MONTHS };
