import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import Button from '../components/Button';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // Navigation handled automatically by AppNavigator when user state changes
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <Text style={styles.brandText}>Ceylon Boutique</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Enter your credentials to access your curated collection.</Text>

          <View style={styles.formContainer}>
            <InputField
              label="Email Address"
              icon="mail"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              error={errors.email}
            />
            <InputField
              label="Password"
              icon="lock"
              rightLabel="Forgot Password?"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              error={errors.password}
            />
          </View>

          <Button title="Login →" onPress={handleLogin} loading={loading} style={styles.btn} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.link}>Register</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' }, // matching the image background (white/very light)
  container: { flexGrow: 1, padding: 30, justifyContent: 'center' },
  brandText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 32,
    color: '#2E2A26',
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 48,
    color: '#2E2A26',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    color: '#2E2A26',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  formContainer: {
    marginBottom: 10,
  },
  btn: {
    marginTop: 10,
    borderRadius: 8, // the image login button is slightly rounded, not full pill
  },
  linkRow: { marginTop: 40, alignItems: 'center' },
  linkText: { fontFamily: 'Montserrat_400Regular', color: '#5C554F', fontSize: 15 },
  link: { color: '#2E2A26', fontFamily: 'Montserrat_600SemiBold' },
});

export default LoginScreen;
