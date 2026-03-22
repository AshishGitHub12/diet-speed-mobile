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
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import InputField from "@/src/components/ui/InputField";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import api from "@/src/services/api";

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

            <Text style={styles.heading}>Create your account</Text>

            {/* Username */}
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

            {/* Email */}
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

            {/* Password */}
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

            {/* Confirm Password */}
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
            {!!errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

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
              style={styles.loginContainer}
              disabled={isLoading}
            >
              <Text style={styles.loginText}>
                Already have an account?{" "}
                <Text style={styles.loginLink}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

export default RegisterScreen;

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
    paddingVertical: 30,
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
    marginBottom: 24,
    textAlign: "center",
  },
  fieldSpacing: {
    marginBottom: 12,
  },
  buttonSpacing: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#E53935",
    marginTop: -6,
    marginBottom: 6,
    marginLeft: 4,
  },
  loginContainer: {
    marginTop: 15,
    alignItems: "center",
  },
  loginText: {
    color: "#444",
  },
  loginLink: {
    color: "#2E7D32",
    fontWeight: "600",
  },
});