import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/theme';

// ─── Local Icon Assets ────────────────────────────────────────────────────────

const ICON_HOME    = require('@/assets/icons/home.png');
const ICON_DIET    = require('@/assets/icons/diet.png');
const ICON_WORKOUT = require('@/assets/icons/workout.png');
const ICON_PROFILE = require('@/assets/icons/profile.png');

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const icons: Record<string, any> = {
    home:    ICON_HOME,
    diet:    ICON_DIET,
    workout: ICON_WORKOUT,
    profile: ICON_PROFILE,
  };

  return (
    <View style={[
      styles.tabBarOuter,
      // Respect Android nav bar + add extra breathing room
      { bottom: Math.max(insets.bottom, 12) + 2 },
    ]}>
      <View style={styles.tabBarPill}>
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
              <Image
                source={icons[route.name]}
                style={[styles.tabIcon, { opacity: isFocused ? 1 : 0.4 }]}
                resizeMode="contain"
              />
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
    backgroundColor: '#D6E8D0',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#317039',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#D0DCC8',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
  },
  tabIcon: {
    width: 26,
    height: 26,
  },
  tabLabel: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
});