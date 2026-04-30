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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Ceylon Boutique today</Text>

          <InputField label="Full Name" value={form.fullName} onChangeText={set('fullName')}
            placeholder="e.g. Amal Perera" autoCapitalize="words" error={errors.fullName} />
          <InputField label="Email Address" value={form.email} onChangeText={set('email')}
            placeholder="you@example.com" keyboardType="email-address" error={errors.email} />
          <InputField label="Phone Number" value={form.phone} onChangeText={set('phone')}
            placeholder="0771234567" keyboardType="phone-pad" error={errors.phone} />
          <InputField label="Password" value={form.password} onChangeText={set('password')}
            placeholder="Min 8 chars, 1 uppercase, 1 number" secureTextEntry error={errors.password} />
          <InputField label="Confirm Password" value={form.confirmPassword} onChangeText={set('confirmPassword')}
            placeholder="Re-enter your password" secureTextEntry error={errors.confirmPassword} />

          <Button title="Create Account" onPress={handleRegister} loading={loading} style={styles.btn} />

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.link}>Login</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#8B2635', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 28 },
  btn: { marginTop: 8 },
  linkRow: { marginTop: 20, alignItems: 'center', paddingBottom: 20 },
  linkText: { color: '#555', fontSize: 14 },
  link: { color: '#8B2635', fontWeight: '700' },
});

export default RegisterScreen;
