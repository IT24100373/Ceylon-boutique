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
import Icon from 'react-native-vector-icons/Feather';

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

      await AsyncStorage.setItem('ceylon_token', token);
      await AsyncStorage.setItem('ceylon_user', JSON.stringify({
        ...user, verificationStatus: seller.verificationStatus,
        shopName: seller.shopName, sellerId: seller.id,
      }));

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

  const provinces = [
    'Western', 'Central', 'Southern', 'Northern', 'Eastern',
    'North Western', 'North Central', 'Uva', 'Sabaragamuwa',
  ];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View>
            <Text style={styles.stepTitle}>Step 1: Personal Details</Text>
            <Text style={styles.stepDesc}>Your login credentials for the seller account</Text>
            <InputField label="Full Name" icon="user" value={fullName} onChangeText={setFullName} placeholder="e.g. Kasun Perera" />
            <InputField label="Email" icon="mail" value={email} onChangeText={setEmail} placeholder="e.g. kasun@email.com" keyboardType="email-address" autoCapitalize="none" />
            <InputField label="Phone" icon="phone" value={phone} onChangeText={setPhone} placeholder="e.g. 0771234567" keyboardType="phone-pad" />
            <InputField label="Password" icon="lock" value={password} onChangeText={setPassword} placeholder="Min 8 chars, 1 uppercase, 1 number" secureTextEntry />
            <InputField label="Confirm Password" icon="lock" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" secureTextEntry />
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={styles.stepTitle}>Step 2: Shop Details</Text>
            <Text style={styles.stepDesc}>Tell customers about your boutique</Text>
            <InputField label="Shop Name *" icon="shopping-bag" value={shopName} onChangeText={setShopName} placeholder="e.g. Colombo Silk House" />
            <InputField label="Shop Description" icon="info" value={shopDescription} onChangeText={setShopDescription} placeholder="Describe your boutique..." />
            <InputField label="Category Focus" icon="tag" value={categoryFocus} onChangeText={setCategoryFocus} placeholder="e.g. Saree & Traditional, Casual Wear" />
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={styles.stepTitle}>Step 3: Business Documents</Text>
            <Text style={styles.stepDesc}>Required for verification by our admin team</Text>
            <InputField label="Business Registration Number *" icon="file-text" value={businessRegNumber} onChangeText={setBusinessRegNumber} placeholder="e.g. PV00123456" />
            <InputField label="NIC Number *" icon="credit-card" value={nicNumber} onChangeText={setNicNumber} placeholder="e.g. 200012345678 or 901234567V" />
            <View style={styles.infoBox}>
              <Icon name="info" size={16} color="#B4725E" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.infoText}>Document upload will be available in a future update. For now, our admin team will contact you to collect documents.</Text>
            </View>
          </View>
        );
      case 4:
        return (
          <View>
            <Text style={styles.stepTitle}>Step 4: Bank & Address</Text>
            <Text style={styles.stepDesc}>For receiving payouts from your sales</Text>
            <InputField label="Bank Name *" icon="dollar-sign" value={bankName} onChangeText={setBankName} placeholder="e.g. Commercial Bank" />
            <InputField label="Bank Branch *" icon="map-pin" value={bankBranch} onChangeText={setBankBranch} placeholder="e.g. Colombo Fort" />
            <InputField label="Account Number *" icon="hash" value={bankAccountNumber} onChangeText={setBankAccountNumber} placeholder="e.g. 1234567890" keyboardType="numeric" />
            <InputField label="Account Holder Name *" icon="user" value={bankAccountName} onChangeText={setBankAccountName} placeholder="e.g. Kasun Perera" />

            <Text style={[styles.stepTitle, { marginTop: 20 }]}>Contact Address</Text>
            <InputField label="Address Line 1 *" icon="map" value={addressLine1} onChangeText={setAddressLine1} placeholder="e.g. 45 Galle Road" />
            <InputField label="Address Line 2" icon="map" value={addressLine2} onChangeText={setAddressLine2} placeholder="e.g. Floor 2" />
            <InputField label="City *" icon="map-pin" value={city} onChangeText={setCity} placeholder="e.g. Colombo" />

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

            <InputField label="Postal Code *" icon="map-pin" value={postalCode} onChangeText={setPostalCode} placeholder="e.g. 10100" keyboardType="numeric" />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7D9C4" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#43332E" />
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: '#F7D9C4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: { color: '#43332E', fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20 },
  stepIndicator: { color: '#43332E', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14, opacity: 0.8 },
  progressBar: {
    height: 4, backgroundColor: '#FFF1E8',
  },
  progressFill: {
    height: 4, backgroundColor: '#B4725E',
  },
  formArea: { flex: 1, padding: 24 },
  stepTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: '#2A201D', marginBottom: 8 },
  stepDesc: { fontFamily: 'InstrumentSans_400Regular', fontSize: 15, color: '#43332E', marginBottom: 24, opacity: 0.8 },
  btnRow: { marginTop: 24 },
  nextBtn: { borderRadius: 8 },
  infoBox: {
    flexDirection: 'row', backgroundColor: '#FFF1E8', padding: 16, borderRadius: 10,
    borderWidth: 1, borderColor: '#E6C9B9', marginTop: 10,
  },
  infoText: { flex: 1, fontFamily: 'InstrumentSans_400Regular', fontSize: 14, color: '#43332E', lineHeight: 22 },
  inputLabel: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14, color: '#43332E', marginBottom: 8, marginTop: 10 },
  provinceGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20,
  },
  provinceChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: '#E6C9B9', backgroundColor: '#FFF1E8',
  },
  provinceChipActive: {
    backgroundColor: '#B4725E', borderColor: '#B4725E',
  },
  provinceChipText: { fontFamily: 'InstrumentSans_400Regular', fontSize: 14, color: '#43332E' },
  provinceChipTextActive: { color: '#FFFFFF', fontFamily: 'InstrumentSans_600SemiBold' },
});

export default SellerRegisterScreen;
