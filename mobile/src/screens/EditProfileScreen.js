import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, SafeAreaView, KeyboardAvoidingView, Platform,
  TouchableOpacity, StatusBar
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Icon from 'react-native-vector-icons/Feather';

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
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#2E2A26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.card}>
            <View style={styles.hintBox}>
              <Icon name="info" size={18} color="#2E2A26" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.hint}>Email cannot be changed as it is your account identifier.</Text>
            </View>

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
          </View>

          <View style={styles.actionContainer}>
            <Button title="Save Changes" onPress={handleSave} loading={loading} style={styles.btn} />
            <Button title="Cancel" onPress={() => navigation.goBack()} variant="secondary" style={styles.cancelBtn} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },

  container: { flexGrow: 1, padding: 20 },

  card: {
    backgroundColor: '#EEEADDFF', borderRadius: 14, padding: 20,
      marginBottom: 24,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },

  hintBox: {
    flexDirection: 'row', backgroundColor: '#EEEADDFF', borderRadius: 10, padding: 14,
    marginBottom: 24,  
  },
  hint: {
    flex: 1, color: '#2E2A26', fontSize: 13, fontFamily: 'Montserrat_400Regular', lineHeight: 20,
  },

  actionContainer: {
    marginTop: 'auto',
  },
  btn: {
    backgroundColor: '#EEEADDFF', borderRadius: 12, paddingVertical: 16, marginBottom: 12
  },
  cancelBtn: {
    backgroundColor: 'transparent',   borderRadius: 12, paddingVertical: 16
  },
});

export default EditProfileScreen;
