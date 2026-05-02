import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Feather';

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Text style={styles.brandText}>Ceylon Boutique</Text>
          <Text style={styles.title}>Seller Login</Text>
          <Text style={styles.subtitle}>Access your shop dashboard</Text>

          <View style={styles.formSection}>
            <InputField
              label="Email Address"
              icon="mail"
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. seller@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <InputField
              label="Password"
              icon="lock"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />

            <Button
              title={loading ? 'Logging in...' : 'Login →'}
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 30 },
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
    marginBottom: 40,
    opacity: 0.8,
  },
  formSection: {
    marginBottom: 10,
  },
  loginBtn: { marginTop: 10, borderRadius: 8 },
  registerLink: { marginTop: 30, alignItems: 'center' },
  registerLinkText: { fontFamily: 'Montserrat_400Regular', fontSize: 14, color: '#5C554F' },
  registerLinkBold: { color: '#2E2A26', fontFamily: 'Montserrat_600SemiBold' },
  backLink: { marginTop: 20, alignItems: 'center' },
  backLinkText: { color: '#5C554F', fontFamily: 'Montserrat_600SemiBold', fontSize: 14 },
});

export default SellerLoginScreen;
