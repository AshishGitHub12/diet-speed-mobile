import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppDispatch } from "@/src/redux/hooks";
import { setTokens, setOnboarded } from "@/src/redux/authSlice";
import { setProfile } from "@/src/redux/userSlice";
import { saveTokens } from "@/src/utils/secureStore";
import api from "@/src/services/api";
import InputField from "@/src/components/ui/InputField";
import PrimaryButton from "@/src/components/ui/PrimaryButton";

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
          identifier: " ",   // spacer to highlight both fields
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
    <ImageBackground
      source={require("@/assets/images/bg-gradient.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Logo */}
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
            />

            <Text style={styles.heading}>Sign in to your account</Text>

            {/* Username / Email */}
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

            {/* Password */}
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
            {!!errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            {/* Login Button */}
            <PrimaryButton
              title="Login"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
            />

            {/* Register link */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/register")}
              disabled={isLoading}
            >
              <Text style={styles.registerText}>
                Don't have an account? Register
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

export default LoginScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  container: {
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    width: "100%",
  },
  logo: {
    width: 180,
    height: 50,
    alignSelf: "center",
    marginBottom: 20,
    resizeMode: "contain",
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
    marginBottom: 20,
    textAlign: "center",
  },
  errorText: {
    fontSize: 12,
    color: "#E53935",
    marginTop: -6,
    marginBottom: 6,
    marginLeft: 4,
  },
  registerText: {
    marginTop: 20,
    textAlign: "center",
    color: "#2E7D32",
    fontWeight: "500",
  },
});