import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#111'} size="small" />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: '#111' },
  secondary: { backgroundColor: '#f3f3f3' },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#ddd' },
  danger: { backgroundColor: '#ef4444' },
  disabled: { opacity: 0.45 },
  text: { fontSize: 15, fontWeight: '600' },
  primaryText: { color: '#fff' },
  secondaryText: { color: '#111' },
  ghostText: { color: '#111' },
  dangerText: { color: '#fff' },
});
