// src/components/Button.js
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../theme/colors';
import Typography from '../theme/typography';

export default function Button({
  title,
  onPress,
  variant = 'primary',   // 'primary' | 'secondary' | 'ghost' | 'danger'
  size = 'md',           // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon = null,
  style,
}) {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.wrapper, style]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={
            isDisabled
              ? ['#2A1F14', '#1C150D']
              : [Colors.gradientStart, Colors.gradientEnd]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, sizes[size]]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textPrimary} size="small" />
          ) : (
            <View style={styles.row}>
              {icon && <View style={styles.iconWrap}>{icon}</View>}
              <Text style={[styles.text, styles.textPrimary, textSizes[size]]}>
                {title}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const containerStyle = [
    styles.gradient,
    sizes[size],
    variant === 'secondary' && styles.secondary,
    variant === 'ghost' && styles.ghost,
    variant === 'danger' && styles.danger,
    isDisabled && styles.disabled,
  ];

  const textColor = {
    secondary: Colors.primary,
    ghost: Colors.textSecondary,
    danger: Colors.error,
  }[variant] || Colors.textPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.wrapper, style]}
      activeOpacity={0.75}
    >
      <View style={containerStyle}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <View style={styles.row}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.text, textSizes[size], { color: textColor }]}>
              {title}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const sizes = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  md: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14 },
  lg: { paddingVertical: 18, paddingHorizontal: 32, borderRadius: 16 },
};

const textSizes = {
  sm: { fontSize: Typography.sm },
  md: { fontSize: Typography.md },
  lg: { fontSize: Typography.lg },
};

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { marginRight: 4 },
  text: {
    fontWeight: Typography.semibold,
    letterSpacing: 0.3,
  },
  textPrimary: { color: Colors.textOnPrimary },
  secondary: {
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  danger: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  disabled: { opacity: 0.5 },
});
