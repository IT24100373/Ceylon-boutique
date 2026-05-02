import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, StatusBar
} from 'react-native';
import apiClient from '../api/client';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Icon from 'react-native-vector-icons/Feather';

const ChangePasswordScreen = ({ navigation }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = 'Current password is required';
    if (!form.newPassword) e.newPassword = 'New password is required';
    else if (form.newPassword.length < 8) e.newPassword = 'Must be at least 8 characters';
    else if (!/[A-Z]/.test(form.newPassword)) e.newPassword = 'Must include an uppercase letter';
    else if (!/[0-9]/.test(form.newPassword)) e.newPassword = 'Must include a number';
    if (!form.confirmNewPassword) e.confirmNewPassword = 'Please confirm your new password';
    else if (form.newPassword !== form.confirmNewPassword) e.confirmNewPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await apiClient.put('/api/users/change-password', form);
      Alert.alert('Password Updated', 'Your password has been changed successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password.';
      if (msg.toLowerCase().includes('current')) {
        setErrors((e) => ({ ...e, currentPassword: 'Current password is incorrect' }));
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#43332E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.card}>
            <View style={styles.hintBox}>
              <Icon name="shield" size={18} color="#B4725E" style={{ marginRight: 10, marginTop: 2 }} />
              <Text style={styles.hint}>
                Choose a strong password with at least 8 characters, one uppercase letter, and one number.
              </Text>
            </View>

            <InputField
              label="Current Password"
              icon="lock"
              value={form.currentPassword}
              onChangeText={set('currentPassword')}
              placeholder="Your current password"
              secureTextEntry
              error={errors.currentPassword}
            />
            <InputField
              label="New Password"
              icon="lock"
              value={form.newPassword}
              onChangeText={set('newPassword')}
              placeholder="New password"
              secureTextEntry
              error={errors.newPassword}
            />
            <InputField
              label="Confirm New Password"
              icon="lock"
              value={form.confirmNewPassword}
              onChangeText={set('confirmNewPassword')}
              placeholder="Re-enter new password"
              secureTextEntry
              error={errors.confirmNewPassword}
            />
          </View>

          <View style={styles.actionContainer}>
            <Button title="Update Password" onPress={handleSubmit} loading={loading} style={styles.btn} />
            <Button title="Cancel" onPress={() => navigation.goBack()} variant="secondary" style={styles.cancelBtn} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF1E8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF1E8'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },

  container: { flexGrow: 1, padding: 20 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: '#E6C9B9', marginBottom: 24,
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },

  hintBox: {
    flexDirection: 'row', backgroundColor: '#FFF5EE', borderRadius: 10, padding: 14,
    marginBottom: 24, borderWidth: 1, borderColor: '#E6C9B9',
  },
  hint: {
    flex: 1, color: '#8C7A74', fontSize: 13, fontFamily: 'InstrumentSans_400Regular', lineHeight: 20,
  },

  actionContainer: {
    marginTop: 'auto',
  },
  btn: {
    backgroundColor: '#B4725E', borderRadius: 12, paddingVertical: 16, marginBottom: 12
  },
  cancelBtn: {
    backgroundColor: 'transparent', borderWidth: 1, borderColor: '#B4725E', borderRadius: 12, paddingVertical: 16
  },
});

export default ChangePasswordScreen;

