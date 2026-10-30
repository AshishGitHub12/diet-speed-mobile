import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import InputField from "@/src/components/ui/InputField";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import api from "@/src/services/api";
import { Colors, Spacing, Fonts, BorderRadius } from "@/src/constants/theme";

// ─── Shared design tokens (same system as Home / Weight / Meal / Diet / Workout / Login) ──

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

function RegisterScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Register handler ────────────────────────────────────────────────────────

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      console.log("📤 Registering:", { username: username.trim(), email: email.trim() });
      await api.post("/auth/register/", {
        username: username.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
      });

      Alert.alert(
        "Account Created!",
        "Your account has been created. Please log in.",
        [{ text: "Login", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (error: any) {
      // ── Log full error for debugging ──
      console.log("❌ Register error status  :", error?.response?.status);
      console.log("❌ Register error data    :", JSON.stringify(error?.response?.data));
      console.log("❌ Register error message :", error?.message);
      console.log("❌ Register request URL   :", error?.config?.url);

      const data = error?.response?.data;

      // Show inline field errors from Django
      if (data?.username) {
        setErrors((prev) => ({ ...prev, username: Array.isArray(data.username) ? data.username[0] : data.username }));
      } else if (data?.email) {
        setErrors((prev) => ({ ...prev, email: Array.isArray(data.email) ? data.email[0] : data.email }));
      } else if (data?.password) {
        setErrors((prev) => ({ ...prev, password: Array.isArray(data.password) ? data.password[0] : data.password }));
      } else if (data?.confirm_password) {
        setErrors((prev) => ({ ...prev, confirmPassword: Array.isArray(data.confirm_password) ? data.confirm_password[0] : data.confirm_password }));
      } else {
        Alert.alert(
          "Registration Failed",
          data?.detail || data?.message || error?.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── UI ──────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Dark hero header — same pattern as Login / Home calorie card */}
      <View style={styles.heroCard}>
        <View style={styles.heroBlobA} />
        <View style={styles.heroBlobB} />
        {/* <View style={styles.badgePill}> */}
          {/* <View style={styles.badgeDot} /> */}
          {/* <Text style={styles.badgePillText}>Diet Speed</Text> */}
        {/* </View> */}
        <Image source={require("@/assets/images/logo.png")} style={styles.logo} />
        <Text style={styles.heroTitle}>Create your account</Text>
        <Text style={styles.heroSubtitle}>Start your fitness journey today</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formCard, leafRadius(BorderRadius.xl)]}>
            <Text style={styles.formHeading}>Sign up to get started</Text>

            {/* Username */}
            <View style={styles.fieldWrap}>
              <InputField
                label="Username"
                placeholder="Enter your username"
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  if (errors.username) setErrors((e) => ({ ...e, username: undefined }));
                }}
                autoCapitalize="none"
                returnKeyType="next"
              />
              {!!errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <InputField
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <InputField
                label="Password"
                placeholder="Min. 8 characters"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                }}
                secureTextEntry
                returnKeyType="next"
              />
              {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Confirm Password */}
            <View style={styles.fieldWrap}>
              <InputField
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (errors.confirmPassword) setErrors((e) => ({ ...e, confirmPassword: undefined }));
                }}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              {!!errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Register Button */}
            <PrimaryButton
              title="Register"
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
            />

            {/* Navigate to Login */}
            <TouchableOpacity
              onPress={() => router.replace("/(auth)/login")}
              style={styles.loginRow}
              disabled={isLoading}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLink}>Login</Text>
              </Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Pastel trust row, same as Login */}
          <View style={styles.trustRow}>
            <View style={[styles.trustChip, { backgroundColor: Tint.mint }]}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
              <Text style={styles.trustChipText}>Secure</Text>
            </View>
            <View style={[styles.trustChip, { backgroundColor: Tint.lilac }]}>
              <Ionicons name="sparkles" size={14} color={Accent.plum} />
              <Text style={styles.trustChipText}>Personalized</Text>
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

export default RegisterScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  heroCard: {
    backgroundColor: Colors.textDark,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl + 10,
    paddingHorizontal: Spacing.lg,
    overflow: "hidden",
    alignItems: "center",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroBlobA: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.04)",
    top: -90,
    right: -70,
  },
  heroBlobB: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.03)",
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
  logo: { width: 150, height: 42, resizeMode: "contain", marginBottom: Spacing.md, tintColor: Colors.white },
  heroTitle: { fontSize: 22, fontWeight: "800", color: Colors.white, letterSpacing: -0.4 },
  heroSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 4, fontWeight: "500" },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl + 20,
  },

  formCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    shadowColor: Colors.textDark,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    marginTop: -Spacing.xl,
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
  loginRow: {
    marginTop: Spacing.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  loginText: { color: Colors.textMuted ?? "#666", fontSize: 13, fontWeight: "500" },
  loginLink: { color: Colors.primary, fontWeight: "800" },

  trustRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
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