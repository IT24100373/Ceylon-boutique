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
          <Icon name={icon} size={20} color="#2E2A26" style={styles.icon} />
        )}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#5C554F"
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
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: '#2E2A26',
  },
  rightLabel: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: '#2E2A26',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    
    
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E2A26',
    backgroundColor: '#FFFFFF', // very light beige
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 10,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 15,
    color: '#2E2A26',
  },
  inputError: { },
  inputDisabled: { backgroundColor: '#FFFFFF', opacity: 0.7 },
  errorText: { color: '#5C554F', fontSize: 12, marginTop: 4, fontFamily: 'Montserrat_400Regular' },
});

export default InputField;
