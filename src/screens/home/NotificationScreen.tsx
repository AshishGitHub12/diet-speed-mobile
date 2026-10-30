import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Fonts, BorderRadius } from '@/src/constants/theme';

// ─── Shared design system (matches Home, Weight Tracker, Meal Log, Diet,
// Challenges, Profile…) ─────────────────────────────────────────────────────

const Accent = { gold: '#B9892E', plum: '#6E5A8C', teal: '#3E7CA6', berry: '#8B3A42' };
const Tint   = { mint: '#E1EEDD', peach: '#F5E6D3', lilac: '#E7E2F0', sky: '#DCEAF2' };
const LIME   = '#B9F24C';

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifCategory = 'All' | 'Meal' | 'Workout' | 'Water' | 'Weight' | 'AI' | 'Challenge' | 'Update';

interface Notification {
  id: number;
  category: NotifCategory;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_NOTIFICATIONS: Notification[] = [
  { id: 1,  category: 'Meal',      title: 'Breakfast Reminder',         body: "Don't forget to log your breakfast. Start your day right with a healthy meal!",           time: '8:00 AM',   read: false },
  { id: 2,  category: 'Workout',   title: 'Time to Work Out!',          body: 'Your Full Body Strength session is scheduled for today. Lets crush it!',                   time: '9:00 AM',   read: false },
  { id: 3,  category: 'Water',     title: 'Hydration Check',            body: "You've had 3 glasses so far. Drink 2 more glasses to stay on track for your daily goal.",  time: '10:30 AM',  read: false },
  { id: 4,  category: 'AI',        title: 'AI Coach Tip',               body: 'Based on your progress, try adding a 10-minute walk after dinner to boost fat burning.',   time: '11:00 AM',  read: true  },
  { id: 5,  category: 'Weight',    title: 'Log Your Weight',            body: "It's been 3 days since your last weight entry. Tap to log today's weight.",                time: '12:00 PM',  read: false },
  { id: 6,  category: 'Meal',      title: 'Lunch Reminder',             body: "It's lunchtime! Don't skip your meal — check today's diet plan for suggestions.",         time: '1:00 PM',   read: true  },
  { id: 7,  category: 'Challenge', title: '7-Day Challenge — Day 4!',   body: "You're on Day 4 of your 7-Day Hydration Challenge. Keep it up, you're doing great!",     time: '2:00 PM',   read: false },
  { id: 8,  category: 'Water',     title: 'Water Goal Almost Done!',    body: "Just 1 more glass and you'll hit your daily water goal. You're so close!",                time: '3:30 PM',   read: true  },
  { id: 9,  category: 'Challenge', title: 'Achievement Unlocked!',      body: "Congrats! You've earned the 'Consistent Logger' badge for logging meals 7 days in a row.", time: 'Yesterday', read: true  },
  { id: 10, category: 'Workout',   title: 'Workout Streak — 5 Days!',   body: "Amazing! You've worked out 5 days in a row. Your dedication is paying off!",              time: 'Yesterday', read: true  },
  { id: 11, category: 'Update',    title: 'New Feature Available',      body: 'AI Coach now supports personalized meal suggestions. Tap to explore the new feature.',     time: '2 days ago', read: true },
  { id: 12, category: 'Meal',      title: 'Dinner Reminder',            body: "Evening check-in! Log your dinner to complete today's meal tracking.",                    time: '2 days ago', read: true  },
  { id: 13, category: 'AI',        title: 'Weekly Progress Summary',    body: "You lost 0.5kg this week! Your consistency with diet and workouts is showing results.",    time: '3 days ago', read: true  },
  { id: 14, category: 'Update',    title: 'App Updated to v2.1',        body: 'New update includes improved AI coaching, better charts, and bug fixes. Enjoy!',           time: '1 week ago', read: true  },
];

// ─── Category Config — remapped to the app's own accent/tint family ──────────

const CATEGORIES: { key: NotifCategory; label: string; icon: keyof typeof Ionicons.glyphMap; accent: string; tint: string }[] = [
  { key: 'All',       label: 'All',        icon: 'apps-outline',       accent: Colors.textDark, tint: Colors.border     },
  { key: 'Meal',      label: 'Meal',       icon: 'restaurant-outline', accent: Accent.gold,      tint: Tint.peach        },
  { key: 'Workout',   label: 'Workout',    icon: 'barbell-outline',    accent: Accent.berry,     tint: '#F3E3E5'         },
  { key: 'Water',     label: 'Water',      icon: 'water-outline',      accent: Accent.teal,      tint: Tint.sky          },
  { key: 'Weight',    label: 'Weight',     icon: 'scale-outline',      accent: Accent.plum,      tint: Tint.lilac        },
  { key: 'AI',        label: 'AI Coach',   icon: 'sparkles-outline',   accent: Colors.primary,   tint: Tint.mint         },
  { key: 'Challenge', label: 'Challenges', icon: 'trophy-outline',     accent: '#8A8F1F',        tint: '#F2F7D9'         },
  { key: 'Update',    label: 'Updates',    icon: 'megaphone-outline',  accent: Colors.textMuted, tint: Colors.border     },
];

const getCategoryConfig = (cat: NotifCategory) =>
  CATEGORIES.find(c => c.key === cat) ?? CATEGORIES[0];

// ─── Notification Row ─────────────────────────────────────────────────────────

const NotifRow = ({
  notif,
  onDelete,
}: {
  notif: Notification;
  onDelete: (id: number) => void;
}) => {
  const config = getCategoryConfig(notif.category);

  return (
    <TouchableOpacity
      style={[styles.notifRow, !notif.read && styles.notifRowUnread]}
      activeOpacity={0.75}
    >
      {/* Unread dot */}
      {!notif.read && <View style={styles.unreadDot} />}

      {/* Icon */}
      <View style={[styles.notifIconBox, { backgroundColor: config.tint }]}>
        <Ionicons name={config.icon} size={20} color={config.accent} />
      </View>

      {/* Content */}
      <View style={styles.notifContent}>
        <View style={styles.notifTopRow}>
          <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
          <Text style={styles.notifTime}>{notif.time}</Text>
        </View>
        <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
        <View style={[styles.notifCategoryChip, { backgroundColor: config.tint }]}>
          <Ionicons name={config.icon} size={10} color={config.accent} />
          <Text style={[styles.notifCategoryText, { color: config.accent }]}>{config.label}</Text>
        </View>
      </View>

      {/* Delete */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(notif.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ category }: { category: NotifCategory }) => {
  const config = getCategoryConfig(category);
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconBox, { backgroundColor: config.tint }]}>
        <Ionicons name={config.icon} size={40} color={config.accent} />
      </View>
      <Text style={styles.emptyTitle}>No notifications</Text>
      <Text style={styles.emptyBody}>
        {category === 'All'
          ? "You're all caught up! Check back later for updates."
          : `No ${config.label} notifications yet.`}
      </Text>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(DUMMY_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] = useState<NotifCategory>('All');

  const filtered = activeCategory === 'All'
    ? notifications
    : notifications.filter(n => n.category === activeCategory);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ─── Delete single ───────────────────────────────────────────────────────────
  const handleDelete = (id: number) => {
    Alert.alert('Delete Notification', 'Remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => setNotifications(prev => prev.filter(n => n.id !== id)),
      },
    ]);
  };

  // ─── Clear all in category ───────────────────────────────────────────────────
  const handleClearAll = () => {
    const label = activeCategory === 'All' ? 'all' : `all ${getCategoryConfig(activeCategory).label}`;
    Alert.alert('Clear Notifications', `Remove ${label} notifications?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: () => {
          if (activeCategory === 'All') {
            setNotifications([]);
          } else {
            setNotifications(prev => prev.filter(n => n.category !== activeCategory));
          }
        },
      },
    ]);
  };

  // ─── Group by time ───────────────────────────────────────────────────────────
  const todayNotifs     = filtered.filter(n => !['Yesterday', '2 days ago', '3 days ago', '1 week ago'].includes(n.time));
  const yesterdayNotifs = filtered.filter(n => n.time === 'Yesterday');
  const olderNotifs     = filtered.filter(n => ['2 days ago', '3 days ago', '1 week ago'].includes(n.time));

  const renderGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.group}>
        <Text style={styles.groupLabel}>{title}</Text>
        <View style={[styles.groupCard, leafRadius(BorderRadius.lg)]}>
          {items.map((notif, i) => (
            <View key={notif.id}>
              <NotifRow notif={notif} onDelete={handleDelete} />
              {i < items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textDark} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {filtered.length > 0 ? (
          <TouchableOpacity onPress={handleClearAll} style={styles.headerBtn}>
            <Ionicons name="trash-outline" size={17} color={Colors.textDark} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      {/* Category Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {CATEGORIES.map(cat => {
            const count = cat.key === 'All'
              ? notifications.length
              : notifications.filter(n => n.category === cat.key).length;
            if (count === 0 && cat.key !== 'All') return null;
            const active = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.tab, active && { borderColor: cat.accent, backgroundColor: cat.tint }]}
                onPress={() => setActiveCategory(cat.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={active ? cat.accent : Colors.textMuted}
                />
                <Text style={[styles.tabText, active && { color: cat.accent, fontWeight: '800' }]}>
                  {cat.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: active ? cat.accent : Colors.border }]}>
                    <Text style={[styles.tabBadgeText, { color: active ? '#fff' : Colors.textMuted }]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState category={activeCategory} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderGroup('Today', todayNotifs)}
          {renderGroup('Yesterday', yesterdayNotifs)}
          {renderGroup('Older', olderNotifs)}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.background,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:  { fontSize: Fonts.sizes.lg, fontWeight: '800', color: Colors.textDark },
  unreadBadge:  { backgroundColor: LIME, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  unreadBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.textDark },

  // Tabs
  tabsWrapper:  { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabsContent:  { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing.md, paddingVertical: 7,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.background,
  },
  tabText:       { fontSize: Fonts.sizes.sm, fontWeight: '600', color: Colors.textMuted },
  tabBadge:      { borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  tabBadgeText:  { fontSize: 10, fontWeight: '700' },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  // Groups
  group:      { marginBottom: Spacing.md },
  groupLabel: { fontSize: Fonts.sizes.sm, fontWeight: '800', color: Colors.textMuted, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  groupCard:  { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  divider:    { height: 1, backgroundColor: Colors.border, marginLeft: 70 },

  // Notification Row
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    gap: Spacing.sm, position: 'relative',
  },
  notifRowUnread: { backgroundColor: Tint.mint + '50' },
  unreadDot: {
    position: 'absolute', left: 6, top: 20,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: LIME,
  },
  notifIconBox: {
    width: 42, height: 42, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  notifContent:  { flex: 1, gap: 3 },
  notifTopRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notifTitle:    { flex: 1, fontSize: Fonts.sizes.sm, fontWeight: '800', color: Colors.textDark, marginRight: 6 },
  notifTime:     { fontSize: 10, color: Colors.textMuted, flexShrink: 0 },
  notifBody:     { fontSize: Fonts.sizes.sm, color: Colors.textMuted, lineHeight: 18 },
  notifCategoryChip: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4, alignSelf: 'flex-start', borderRadius: BorderRadius.full, paddingHorizontal: 7, paddingVertical: 2 },
  notifCategoryText:{ fontSize: 10, fontWeight: '700' },
  deleteBtn:     { paddingLeft: 4, paddingTop: 2 },

  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.lg },
  emptyIconBox:   { width: 88, height: 88, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  emptyTitle:     { fontSize: Fonts.sizes.xl, fontWeight: '800', color: Colors.textDark },
  emptyBody:      { fontSize: Fonts.sizes.sm, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});