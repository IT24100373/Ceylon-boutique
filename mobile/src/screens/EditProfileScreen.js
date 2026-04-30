import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import InputField from '../components/InputField';
import Button from '../components/Button';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateLocalUser } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (!/^(\+94|0)[0-9]{9}$/.test(phone)) e.phone = 'Enter a valid Sri Lankan phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await apiClient.put('/api/users/profile', { fullName, phone });
      updateLocalUser(res.data.user);
      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Update Failed', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.hint}>Email cannot be changed as it is your account identifier.</Text>

          <InputField
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            autoCapitalize="words"
            error={errors.fullName}
          />
          <InputField
            label="Email Address"
            value={user?.email}
            placeholder="Email"
            editable={false}
          />
          <InputField
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="0771234567"
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <Button title="Save Changes" onPress={handleSave} loading={loading} style={styles.btn} />
          <Button title="Cancel" onPress={() => navigation.goBack()} variant="secondary" style={styles.cancelBtn} />
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
  cancelBtn: { marginTop: 12 },
});

export default EditProfileScreen;
