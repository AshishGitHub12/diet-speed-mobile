import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import InputField from "@/src/components/ui/InputField";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { useRouter } from "expo-router";

function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const handleLogin = () => {
    console.log("Login clicked", { email, password });
    // later: call API with RTK Query
  };

  return (
    <ImageBackground
      source={require("@/assets/images/bg-gradient.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              justifyContent: isKeyboardVisible ? "center" : "center",    
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Image source={require("@/assets/images/logo.png")} style={styles.logo} />

            <Text style={styles.heading}>Sign in to your account</Text>

            <InputField
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <InputField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <PrimaryButton title="Login" onPress={handleLogin} />

            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.registerText}>
                Don't have an account? Register
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      {/* </KeyboardAvoidingView> */}
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
  },
  container: {
    justifyContent:"center",
    paddingBottom: 10,
    paddingHorizontal: 20,
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
    fontWeight: "semibold",
    color: "#444",
    marginBottom: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 30,
    textAlign: "center",
  },
  registerText: {
    marginTop: 20,
    textAlign: "center",
    color: "#2E7D32",
    fontWeight: "500",
  },
});