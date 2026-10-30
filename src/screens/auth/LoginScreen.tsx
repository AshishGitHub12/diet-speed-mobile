import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch } from "@/src/redux/hooks";
import { setTokens, setOnboarded } from "@/src/redux/authSlice";
import { setProfile } from "@/src/redux/userSlice";
import { saveTokens } from "@/src/utils/secureStore";
import api from "@/src/services/api";
import InputField from "@/src/components/ui/InputField";
import { Colors, Spacing, Fonts, BorderRadius } from "@/src/constants/theme";

// ─── Shared design tokens (same system as Home / Weight / Meal / Diet / Workout) ──

const Accent = {
  gold: "#B9892E",
  plum: "#6E5A8C",
  teal: "#3E7CA6",
  berry: "#8B3A42",
};

const Tint = {
  mint: "#E1EEDD",
  peach: "#F5E6D3",
  lilac: "#E7E2F0",
  sky: "#DCEAF2",
};

const LIME = "#B9F24C";

const leafRadius = (r: number) => ({
  borderTopLeftRadius: r + 14,
  borderTopRightRadius: r,
  borderBottomRightRadius: r,
  borderBottomLeftRadius: r,
});

function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    identifier?: string;
    password?: string;
  }>({});

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!identifier.trim()) newErrors.identifier = "Username or email is required";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Login handler ───────────────────────────────────────────────────────────

  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      // Step 1 — login → get tokens
      const loginRes = await api.post("/auth/login/", {
        identifier: identifier.trim(),
        password,
      });

      const { access, refresh } = loginRes.data;

      // Step 2 — persist tokens to SecureStore + Redux
      await saveTokens(access, refresh);
      dispatch(setTokens({ access, refresh }));

      // Step 3 — fetch profile to check onboarding status
      // 404 = new user, no profile yet → go to onboarding
      try {
        const profileRes = await api.get("/profile/");
        const profile = profileRes.data;
        dispatch(setProfile(profile));
        dispatch(setOnboarded(profile.onboarding_completed));

        if (profile.onboarding_completed) {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/(onboarding)/step1");
        }
      } catch (profileError: any) {
        // 404 = new user, no profile yet → start onboarding
        if (profileError?.response?.status === 404) {
          router.replace("/(onboarding)/step1");
        } else {
          throw profileError;
        }
      }
    } catch (error: any) {
      const data = error?.response?.data;
      const status = error?.response?.status;

      if (status === 401 || status === 400) {
        setErrors({
          identifier: " ", // spacer to highlight both fields
          password: data?.detail || data?.message || "Invalid username or password",
        });
      } else {
        Alert.alert("Login Failed", "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── UI ──────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Dark hero header — leaf-corner shape so it flows into the form card below */}
          <View style={[styles.heroCard, { borderBottomLeftRadius: 42, borderBottomRightRadius: 20 }]}>
            <View style={styles.heroBlobA} />
            <View style={styles.heroBlobB} />
            <View style={styles.badgePill}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgePillText}>Diet Speed</Text>
            </View>
            <Image source={require("@/assets/images/logo.png")} style={styles.logo} />
            <Text style={styles.heroTitle}>Welcome back</Text>
            <Text style={styles.heroSubtitle}>Sign in to keep your streak going</Text>
          </View>

          <View style={[styles.formCard, leafRadius(BorderRadius.xl)]}>
            <Text style={styles.formHeading}>Sign in to your account</Text>

            {/* Username / Email */}
            <View style={styles.fieldWrap}>
              <InputField
                label="Username or Email"
                placeholder="Enter your username or email"
                value={identifier}
                onChangeText={(t) => {
                  setIdentifier(t);
                  if (errors.identifier) setErrors((e) => ({ ...e, identifier: undefined }));
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
              {!!errors.identifier?.trim() && (
                <Text style={styles.errorText}>{errors.identifier}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <InputField
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                }}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Login Button — lime accent, matches the rest of the app's primary actions */}
            <TouchableOpacity
              style={[styles.limeButton, isLoading && styles.limeButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.textDark} />
              ) : (
                <>
                  <Text style={styles.limeButtonText}>Login</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.textDark} />
                </>
              )}
            </TouchableOpacity>

            {/* Register link */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              disabled={isLoading}
              style={styles.registerRow}
            >
              <Text style={styles.registerText}>
                Don't have an account?{" "}
                <Text style={styles.registerLink}>Register</Text>
              </Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Little pastel trust row, echoes the tool cards elsewhere in the app */}
          <View style={styles.trustRow}>
            <View style={[styles.trustChip, { backgroundColor: Tint.mint }]}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
              <Text style={styles.trustChipText}>Secure</Text>
            </View>
            <View style={[styles.trustChip, { backgroundColor: Tint.sky }]}>
              <Ionicons name="flash" size={14} color={Accent.teal} />
              <Text style={styles.trustChipText}>Fast sync</Text>
            </View>
            <View style={[styles.trustChip, { backgroundColor: Tint.peach }]}>
              <Ionicons name="trending-up" size={14} color={Accent.gold} />
              <Text style={styles.trustChipText}>Track progress</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default LoginScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
  },

  heroCard: {
    backgroundColor: Colors.textDark,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    overflow: "hidden",
    alignItems: "center",
  },
  heroBlobA: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -90,
    right: -70,
  },
  heroBlobB: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(185,242,76,0.07)",
    bottom: -60,
    left: -40,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: Spacing.md,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: LIME },
  badgePillText: { fontSize: 11, fontWeight: "700", color: Colors.white, letterSpacing: 0.3 },
  logo: { width: 130, height: 36, resizeMode: "contain", marginBottom: Spacing.sm, tintColor: Colors.white },
  heroTitle: { fontSize: 21, fontWeight: "800", color: Colors.white, letterSpacing: -0.4 },
  heroSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4, fontWeight: "500" },

  formCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textDark,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  fieldWrap: { marginBottom: Spacing.sm },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },

  limeButton: {
    height: 54,
    borderRadius: BorderRadius.xl,
    backgroundColor: LIME,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: Spacing.sm,
    shadowColor: LIME,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  limeButtonDisabled: { opacity: 0.6, shadowOpacity: 0 },
  limeButtonText: { fontSize: Fonts.sizes.md, fontWeight: "800", color: Colors.textDark },

  registerRow: {
    marginTop: Spacing.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  registerText: { color: Colors.textMuted ?? "#666", fontSize: 13, fontWeight: "500" },
  registerLink: { color: Colors.primary, fontWeight: "800" },

  trustRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
    justifyContent: "center",
  },
  trustChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  trustChipText: { fontSize: 11, fontWeight: "700", color: Colors.textDark },
});