import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TextInputProps,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = TextInputProps & {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  required?: boolean;
};

function InputField({
  placeholder,
  value,
  onChangeText,
  label,
  required = false,
  secureTextEntry,
  ...rest
}: Props) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !passwordVisible}
          {...rest}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setPasswordVisible((v) => !v)}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={passwordVisible ? "eye-outline" : "eye-off-outline"}
              size={22}
              color="#888"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default InputField;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 10,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    color: "#444",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: "transparent",
  },
  eyeButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    alignSelf: "stretch",
  },
});