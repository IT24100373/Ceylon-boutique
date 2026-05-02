import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

const Button = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#EEEADDFF' : '#FFFFFF'} />
      ) : (
        <Text style={[styles.text, variant === 'secondary' && styles.textSecondary, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30, // pill shape
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#2E2A26',
  },
  primary: { backgroundColor: '#EEEADDFF' },
  secondary: {
    backgroundColor: 'transparent',
  },
  danger: { backgroundColor: '#c53030' },
  disabled: { opacity: 0.5 },
  text: {
    color: '#2E2A26',
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  textSecondary: { color: '#5C554F' },
});

export default Button;
