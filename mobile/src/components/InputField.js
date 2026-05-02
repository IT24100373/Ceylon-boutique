import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  editable = true,
  icon,
  rightLabel,
}) => {
  return (
    <View style={styles.container}>
      {(label || rightLabel) && (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {rightLabel ? <Text style={styles.rightLabel}>{rightLabel}</Text> : null}
        </View>
      )}
      <View style={[
        styles.inputContainer,
        error && styles.inputError,
        !editable && styles.inputDisabled,
      ]}>
        {icon && (
          <Icon name={icon} size={20} color="#43332E" style={styles.icon} />
        )}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8C7A74"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontFamily: 'InstrumentSans_600SemiBold',
    fontSize: 14,
    color: '#43332E',
  },
  rightLabel: {
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 12,
    color: '#B4725E',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6C9B9',
    borderRadius: 8,
    backgroundColor: '#FFF1E8', // very light beige
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 10,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: 'InstrumentSans_400Regular',
    fontSize: 15,
    color: '#43332E',
  },
  inputError: { borderColor: '#e53e3e' },
  inputDisabled: { backgroundColor: '#f5f5f5', opacity: 0.7 },
  errorText: { color: '#e53e3e', fontSize: 12, marginTop: 4, fontFamily: 'InstrumentSans_400Regular' },
});

export default InputField;
