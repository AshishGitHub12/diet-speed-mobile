import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform, Image, TouchableOpacity } from 'react-native';
import { Colors } from '../../src/constants/theme';

// ─── Local Icon Assets ────────────────────────────────────────────────────────
// Export from Figma as PNG 3x and place in assets/icons/

const ICON_HOME    = require('@/assets/icons/home.png');
const ICON_DIET    = require('@/assets/icons/diet.png');
const ICON_WORKOUT = require('@/assets/icons/workout.png');
const ICON_PROFILE = require('@/assets/icons/profile.png');

// ─── Custom Tab Bar ───────────────────────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }: any) {
  const icons: Record<string, any> = {
    home:    ICON_HOME,
    diet:    ICON_DIET,
    workout: ICON_WORKOUT,
    profile: ICON_PROFILE,
  };

  return (
    <View style={styles.tabBarOuter}>
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
                style={[
                  styles.tabIcon,
                  { opacity: isFocused ? 1 : 0.45 },
                ]}
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
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tabBarPill: {
    flexDirection: 'row',
    // Matches Figma: linear-gradient(92.75deg, rgba(222,235,221,0.6), rgba(200,214,190,0.6))
    backgroundColor: '#D6E8D0',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    // Matches Figma shadow
    shadowColor: '#317039',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#D0DCC8',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
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