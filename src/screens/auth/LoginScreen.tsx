import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from "react-native";
import InputField from "@/src/components/ui/InputField";
import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { useRouter } from "expo-router";

function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    console.log("Login clicked", { email, password });
    // later: call API with RTK Query
  };

  return (
    <ImageBackground
    source={require('@/assets/images/bg-gradient.jpg')}
    style={styles.background}
    resizeMode="cover"
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
    </ImageBackground>
  );
}

export default LoginScreen;

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'flex-end',
      },
    container: {
        paddingBottom: 90,
        paddingHorizontal: 20,
        width: '100%',
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