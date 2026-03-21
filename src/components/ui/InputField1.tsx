import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Fonts } from '../../constants/theme';

interface InputFieldProps extends TextInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  containerStyle?: ViewStyle;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  required = false,
  error,
  containerStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          !!error && styles.inputWrapperError,
        ]}
      >
        {label && (
          <Text style={styles.label}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textPlaceholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputWrapper: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    justifyContent: 'center',
    minHeight: 64,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
  },
  inputWrapperError: {
    borderColor: Colors.error,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  required: {
    color: Colors.error,
  },
  input: {
    fontSize: Fonts.sizes.md,
    color: Colors.textDark,
    padding: 0,
    margin: 0,
  },
  errorText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default InputField;