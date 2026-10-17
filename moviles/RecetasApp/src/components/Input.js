// src/components/Input.js
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import Typography from '../theme/typography';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  style,
  inputStyle,
  rightIcon,
  ...rest
}) {
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(secureTextEntry);

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputFocused,
          error && styles.inputError,
          !editable && styles.inputDisabled,
          multiline && { height: numberOfLines * 24 + 24 },
        ]}
      >
        <TextInput
          style={[styles.input, multiline && styles.multiline, inputStyle]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secure}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : undefined}
          textAlignVertical={multiline ? 'top' : 'auto'}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setSecure(!secure)}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={secure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !secureTextEntry && (
          <View style={styles.eyeBtn}>{rightIcon}</View>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: Typography.md,
    color: Colors.textPrimary,
    paddingVertical: 13,
  },
  multiline: {
    paddingTop: 12,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.bgInput,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    marginTop: 4,
    fontSize: Typography.xs,
    color: Colors.error,
  },
});
