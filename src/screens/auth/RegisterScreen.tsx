import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";

import InputField from "@/src/components/ui/InputField";
import PrimaryButton from "@/src/components/ui/PrimaryButton";

function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    console.log("Register Data:", { name, email, password });

    // Later we will connect API here
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Diet Speed</Text>
      <Text style={styles.subtitle}>Create your account</Text>

      {/* Name */}
      <InputField
        label="Full Name"
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />

      {/* Email */}
      <InputField
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* Password */}
      <InputField
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Register Button */}
      <PrimaryButton title="Register" onPress={handleRegister} />

      {/* Navigate to Login */}
      <TouchableOpacity
        onPress={() => router.replace("/(auth)/login")}
        style={styles.loginContainer}
      >
        <Text style={styles.loginText}>
          Already have an account?{" "}
          <Text style={styles.loginLink}>Login</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
    marginTop: 5,
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