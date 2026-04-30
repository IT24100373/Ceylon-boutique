import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

// -------------------------------------------------------
// FR2.1 — Seller Login Screen
// Same layout as customer LoginScreen but calls seller login
// -------------------------------------------------------
const SellerLoginScreen = ({ navigation }) => {
  const { sellerLoginAction } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await sellerLoginAction(email, password);
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please try again.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B2635" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Brand Section */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>CB</Text>
            </View>
            <Text style={styles.title}>Seller Login</Text>
            <Text style={styles.subtitle}>Access your shop dashboard</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <InputField
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. seller@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />

            <Button
              title={loading ? 'Logging in...' : 'Login'}
              onPress={handleLogin}
              disabled={loading}
              style={styles.loginBtn}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('SellerRegister')}
              style={styles.registerLink}
            >
              <Text style={styles.registerLinkText}>
                Don't have a seller account?{' '}
                <Text style={styles.registerLinkBold}>Register as Seller</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backLink}
            >
              <Text style={styles.backLinkText}>← Back to Welcome</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#8B2635' },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  brandSection: {
    alignItems: 'center', paddingVertical: 40,
  },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  title: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 15 },
  formSection: {
    backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: 30, paddingBottom: 40, flex: 1,
  },
  loginBtn: { marginTop: 10 },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerLinkText: { fontSize: 14, color: '#666' },
  registerLinkBold: { color: '#8B2635', fontWeight: '700' },
  backLink: { marginTop: 16, alignItems: 'center' },
  backLinkText: { color: '#8B2635', fontWeight: '600', fontSize: 14 },
});

export default SellerLoginScreen;
