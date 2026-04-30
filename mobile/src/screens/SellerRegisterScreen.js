import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, Alert, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import InputField from '../components/InputField';
import Button from '../components/Button';
import apiClient from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

// -------------------------------------------------------
// FR2.1 — Multi-step Seller Registration (4 steps)
// -------------------------------------------------------
const SellerRegisterScreen = ({ navigation }) => {
  const { sellerLogin: contextSellerLogin } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Personal Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Shop Details
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [categoryFocus, setCategoryFocus] = useState('');

  // Step 3: Business Documents
  const [businessRegNumber, setBusinessRegNumber] = useState('');
  const [nicNumber, setNicNumber] = useState('');

  // Step 4: Bank Details + Contact Address
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const totalSteps = 4;

  // --- Step validation ---
  const validateStep = () => {
    switch (step) {
      case 1:
        if (!fullName || !email || !phone || !password || !confirmPassword) {
          Alert.alert('Missing Fields', 'Please fill in all personal details.');
          return false;
        }
        if (password !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match.');
          return false;
        }
        if (password.length < 8) {
          Alert.alert('Error', 'Password must be at least 8 characters.');
          return false;
        }
        return true;
      case 2:
        if (!shopName) {
          Alert.alert('Missing Fields', 'Shop name is required.');
          return false;
        }
        return true;
      case 3:
        if (!businessRegNumber || !nicNumber) {
          Alert.alert('Missing Fields', 'Business registration number and NIC are required.');
          return false;
        }
        return true;
      case 4:
        if (!bankName || !bankBranch || !bankAccountNumber || !bankAccountName) {
          Alert.alert('Missing Fields', 'Please fill in all bank details.');
          return false;
        }
        if (!addressLine1 || !city || !province || !postalCode) {
          Alert.alert('Missing Fields', 'Please fill in your contact address.');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  // --- Submit registration ---
  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const response = await apiClient.post('/api/sellers/register', {
        fullName, email, phone, password, confirmPassword,
        shopName, shopDescription, categoryFocus,
        businessRegNumber, nicNumber,
        bankName, bankBranch, bankAccountNumber, bankAccountName,
        contactAddress: {
          addressLine1, addressLine2, city, province, postalCode,
        },
      });

      const { token, user, seller } = response.data;

      // Save session
      await AsyncStorage.setItem('ceylon_token', token);
      await AsyncStorage.setItem('ceylon_user', JSON.stringify({
        ...user, verificationStatus: seller.verificationStatus,
        shopName: seller.shopName, sellerId: seller.id,
      }));

      // Use context to update state
      if (contextSellerLogin) {
        await contextSellerLogin(token, {
          ...user, verificationStatus: seller.verificationStatus,
          shopName: seller.shopName, sellerId: seller.id,
        });
      }

      Alert.alert(
        'Registration Successful! 🎉',
        response.data.message,
        [{ text: 'OK' }]
      );
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors) {
        Alert.alert('Validation Error', fieldErrors.map(e => `${e.field}: ${e.message}`).join('\n'));
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Province picker (simple buttons) ---
  const provinces = [
    'Western', 'Central', 'Southern', 'Northern', 'Eastern',
    'North Western', 'North Central', 'Uva', 'Sabaragamuwa',
  ];

  // --- Render current step ---
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>Step 1: Personal Details</Text>
            <Text style={styles.stepDesc}>Your login credentials for the seller account</Text>
            <InputField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="e.g. Kasun Perera" />
            <InputField label="Email" value={email} onChangeText={setEmail} placeholder="e.g. kasun@email.com" keyboardType="email-address" autoCapitalize="none" />
            <InputField label="Phone" value={phone} onChangeText={setPhone} placeholder="e.g. 0771234567" keyboardType="phone-pad" />
            <InputField label="Password" value={password} onChangeText={setPassword} placeholder="Min 8 chars, 1 uppercase, 1 number" secureTextEntry />
            <InputField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" secureTextEntry />
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>Step 2: Shop Details</Text>
            <Text style={styles.stepDesc}>Tell customers about your boutique</Text>
            <InputField label="Shop Name *" value={shopName} onChangeText={setShopName} placeholder="e.g. Colombo Silk House" />
            <InputField label="Shop Description" value={shopDescription} onChangeText={setShopDescription} placeholder="Describe your boutique..." multiline numberOfLines={4} />
            <InputField label="Category Focus" value={categoryFocus} onChangeText={setCategoryFocus} placeholder="e.g. Saree & Traditional, Casual Wear" />
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>Step 3: Business Documents</Text>
            <Text style={styles.stepDesc}>Required for verification by our admin team</Text>
            <InputField label="Business Registration Number *" value={businessRegNumber} onChangeText={setBusinessRegNumber} placeholder="e.g. PV00123456" />
            <InputField label="NIC Number *" value={nicNumber} onChangeText={setNicNumber} placeholder="e.g. 200012345678 or 901234567V" />
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>📋 Document upload will be available in a future update. For now, our admin team will contact you to collect documents.</Text>
            </View>
          </View>
        );
      case 4:
        return (
          <View>
            <Text style={styles.stepTitle}>Step 4: Bank & Address</Text>
            <Text style={styles.stepDesc}>For receiving payouts from your sales</Text>
            <InputField label="Bank Name *" value={bankName} onChangeText={setBankName} placeholder="e.g. Commercial Bank" />
            <InputField label="Bank Branch *" value={bankBranch} onChangeText={setBankBranch} placeholder="e.g. Colombo Fort" />
            <InputField label="Account Number *" value={bankAccountNumber} onChangeText={setBankAccountNumber} placeholder="e.g. 1234567890" keyboardType="numeric" />
            <InputField label="Account Holder Name *" value={bankAccountName} onChangeText={setBankAccountName} placeholder="e.g. Kasun Perera" />

            <Text style={[styles.stepTitle, { marginTop: 20 }]}>Contact Address</Text>
            <InputField label="Address Line 1 *" value={addressLine1} onChangeText={setAddressLine1} placeholder="e.g. 45 Galle Road" />
            <InputField label="Address Line 2" value={addressLine2} onChangeText={setAddressLine2} placeholder="e.g. Floor 2" />
            <InputField label="City *" value={city} onChangeText={setCity} placeholder="e.g. Colombo" />

            <Text style={styles.inputLabel}>Province *</Text>
            <View style={styles.provinceGrid}>
              {provinces.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.provinceChip, province === p && styles.provinceChipActive]}
                  onPress={() => setProvince(p)}
                >
                  <Text style={[styles.provinceChipText, province === p && styles.provinceChipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <InputField label="Postal Code *" value={postalCode} onChangeText={setPostalCode} placeholder="e.g. 10100" keyboardType="numeric" />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B2635" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seller Registration</Text>
          <Text style={styles.stepIndicator}>{step}/{totalSteps}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>

        {/* Form */}
        <ScrollView style={styles.formArea} keyboardShouldPersistTaps="handled">
          {renderStep()}
          <View style={styles.btnRow}>
            {step < totalSteps ? (
              <Button title="Next →" onPress={handleNext} style={styles.nextBtn} />
            ) : (
              <Button title={loading ? 'Submitting...' : 'Submit for Verification'} onPress={handleSubmit} disabled={loading} style={styles.nextBtn} />
            )}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: {
    backgroundColor: '#8B2635', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  stepIndicator: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  progressBar: {
    height: 4, backgroundColor: '#e2e8f0',
  },
  progressFill: {
    height: 4, backgroundColor: '#D4A853', borderRadius: 2,
  },
  formArea: { flex: 1, padding: 20 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: '#333', marginBottom: 4 },
  stepDesc: { fontSize: 14, color: '#777', marginBottom: 20 },
  btnRow: { marginTop: 20 },
  nextBtn: {},
  infoBox: {
    backgroundColor: '#FFF8E1', padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#FFE082', marginTop: 10,
  },
  infoText: { fontSize: 13, color: '#6D4C00', lineHeight: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 10 },
  provinceGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10,
  },
  provinceChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#ccc', backgroundColor: '#fff',
  },
  provinceChipActive: {
    backgroundColor: '#8B2635', borderColor: '#8B2635',
  },
  provinceChipText: { fontSize: 13, color: '#555' },
  provinceChipTextActive: { color: '#fff', fontWeight: '600' },
});

export default SellerRegisterScreen;
