import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/theme';

// ─── Shared design tokens (same system as Home / Weight / Meal / Diet /
// Workout / Login / Register / Onboarding) ─────────────────────────────────

const LIME = '#B9F24C';

// ─── Local Icon Assets ────────────────────────────────────────────────────────

const ICON_HOME    = require('@/assets/icons/home.png');
const ICON_DIET    = require('@/assets/icons/diet.png');
const ICON_WORKOUT = require('@/assets/icons/workout.png');
const ICON_PROFILE = require('@/assets/icons/profile-icon1.png');
const ICON_AI      = require('@/assets/icons/ai-icon.png');

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const icons: Record<string, any> = {
    home:    ICON_HOME,
    diet:    ICON_DIET,
    workout: ICON_WORKOUT,
    profile: ICON_PROFILE,
    'ai-coach': ICON_AI,
  };

  return (
    <View style={[
      styles.tabBarOuter,
      // Respect Android nav bar + add extra breathing room
      { bottom: Math.max(insets.bottom, 12) + 2 },
    ]}>
      <View style={styles.tabBarPill}>
        {/* Soft decorative blob, same language as the dark hero cards elsewhere */}
        <View style={styles.pillBlob} />

        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.iconChip, isFocused && styles.iconChipActive]}>
                <Image
                  source={icons[route.name]}
                  style={[
                    styles.tabIcon,
                    { tintColor: isFocused ? Colors.textDark : 'rgba(255,255,255,0.55)' },
                  ]}
                  resizeMode="contain"
                />
              </View>
              {isFocused && (
                <Text style={styles.tabLabel}>
                  {options.title || route.name}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home"    options={{ title: 'Home' }} />
      <Tabs.Screen name="diet"    options={{ title: 'Diet' }} />
      <Tabs.Screen name="workout" options={{ title: 'Workout' }} />
      <Tabs.Screen name="ai-coach" options={{ title: 'Ai Coach' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  tabBarPill: {
    flexDirection: 'row',
    backgroundColor: Colors.textDark,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: Colors.textDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  pillBlob: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -60,
    right: -40,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    gap: 3,
  },
  iconChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipActive: {
    backgroundColor: LIME,
  },
  tabIcon: {
    width: 20,
    height: 20,
  },
  tabLabel: {
    fontSize: 10.5,
    color: Colors.white,
    fontWeight: '700',
  },
});