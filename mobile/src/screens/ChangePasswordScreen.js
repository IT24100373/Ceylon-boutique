import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import apiClient from '../api/client';
import InputField from '../components/InputField';
import Button from '../components/Button';

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
      Alert.alert('Password Updated', 'Your password has been changed. Please log in again.', [
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.hint}>
            Choose a strong password with at least 8 characters, one uppercase letter, and one number.
          </Text>

          <InputField label="Current Password" value={form.currentPassword}
            onChangeText={set('currentPassword')} placeholder="Your current password"
            secureTextEntry error={errors.currentPassword} />
          <InputField label="New Password" value={form.newPassword}
            onChangeText={set('newPassword')} placeholder="New password"
            secureTextEntry error={errors.newPassword} />
          <InputField label="Confirm New Password" value={form.confirmNewPassword}
            onChangeText={set('confirmNewPassword')} placeholder="Re-enter new password"
            secureTextEntry error={errors.confirmNewPassword} />

          <Button title="Update Password" onPress={handleSubmit} loading={loading} style={styles.btn} />
          <Button title="Cancel" onPress={() => navigation.goBack()} variant="secondary" style={styles.cancel} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 24 },
  hint: {
    backgroundColor: '#fff8e1', borderRadius: 8, padding: 12,
    color: '#7a6012', fontSize: 13, marginBottom: 22, lineHeight: 19,
  },
  btn: { marginTop: 8 },
  cancel: { marginTop: 12 },
});

export default ChangePasswordScreen;
