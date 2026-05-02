import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import Button from '../components/Button';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^(\+94|0)[0-9]{9}$/.test(form.phone)) e.phone = 'Enter a valid Sri Lankan phone (e.g. 0771234567)';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Password must include an uppercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Password must include a number';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.fullName, form.email.trim().toLowerCase(), form.phone, form.password, form.confirmPassword);
      // Navigator auto-redirects to Home on success
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && Array.isArray(apiErrors)) {
        const fieldErrors = {};
        apiErrors.forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
      } else {
        Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.brandText}>Ceylon Boutique</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Ceylon Boutique today</Text>

          <View style={styles.formContainer}>
            <InputField label="Full Name" icon="user" value={form.fullName} onChangeText={set('fullName')}
              placeholder="e.g. Amal Perera" autoCapitalize="words" error={errors.fullName} />
            <InputField label="Email Address" icon="mail" value={form.email} onChangeText={set('email')}
              placeholder="you@example.com" keyboardType="email-address" error={errors.email} />
            <InputField label="Phone Number" icon="phone" value={form.phone} onChangeText={set('phone')}
              placeholder="0771234567" keyboardType="phone-pad" error={errors.phone} />
            <InputField label="Password" icon="lock" value={form.password} onChangeText={set('password')}
              placeholder="Min 8 chars, 1 uppercase, 1 number" secureTextEntry error={errors.password} />
            <InputField label="Confirm Password" icon="lock" value={form.confirmPassword} onChangeText={set('confirmPassword')}
              placeholder="Re-enter your password" secureTextEntry error={errors.confirmPassword} />
          </View>

          <Button title="Create Account →" onPress={handleRegister} loading={loading} style={styles.btn} />

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.link}>Login</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flexGrow: 1, padding: 30, paddingTop: 40 },
  brandText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 32,
    color: '#2E2A26',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 40,
    color: '#2E2A26',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    color: '#2E2A26',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.8,
  },
  formContainer: {
    marginBottom: 10,
  },
  btn: {
    marginTop: 10,
    borderRadius: 8,
  },
  linkRow: { marginTop: 30, alignItems: 'center', paddingBottom: 20 },
  linkText: { fontFamily: 'Montserrat_400Regular', color: '#5C554F', fontSize: 15 },
  link: { color: '#2E2A26', fontFamily: 'Montserrat_600SemiBold' },
});

export default RegisterScreen;
