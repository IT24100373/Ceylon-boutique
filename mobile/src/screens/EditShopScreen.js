import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import InputField from '../components/InputField';
import Button from '../components/Button';
import apiClient from '../api/client';

// -------------------------------------------------------
// FR2.4 — Edit Shop Info (Verified Sellers Only)
// Same pattern as EditProfileScreen.js
// -------------------------------------------------------
const EditShopScreen = ({ navigation, route }) => {
  const seller = route.params?.seller;

  const [shopName, setShopName] = useState(seller?.shopName || '');
  const [shopDescription, setShopDescription] = useState(seller?.shopDescription || '');
  const [categoryFocus, setCategoryFocus] = useState(seller?.categoryFocus || '');
  const [shopLogo, setShopLogo] = useState(seller?.shopLogo || '');
  const [shopBanner, setShopBanner] = useState(seller?.shopBanner || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert('Error', 'Shop name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.put('/api/sellers/my-shop', {
        shopName: shopName.trim(),
        shopDescription: shopDescription.trim(),
        categoryFocus: categoryFocus.trim(),
        shopLogo: shopLogo.trim(),
        shopBanner: shopBanner.trim(),
      });

      Alert.alert('Success ✅', response.data.message, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update shop info.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B2635" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.formArea} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Edit Shop Profile</Text>
          <Text style={styles.subheading}>
            Update your shop details. Changes will be visible to customers immediately.
          </Text>

          <InputField
            label="Shop Name *"
            value={shopName}
            onChangeText={setShopName}
            placeholder="e.g. Colombo Silk House"
          />

          <InputField
            label="Shop Description"
            value={shopDescription}
            onChangeText={setShopDescription}
            placeholder="Describe your boutique..."
            multiline
            numberOfLines={4}
          />

          <InputField
            label="Category Focus"
            value={categoryFocus}
            onChangeText={setCategoryFocus}
            placeholder="e.g. Saree & Traditional, Casual Wear"
          />

          <InputField
            label="Shop Logo URL"
            value={shopLogo}
            onChangeText={setShopLogo}
            placeholder="https://example.com/logo.jpg"
            autoCapitalize="none"
          />

          <InputField
            label="Shop Banner URL"
            value={shopBanner}
            onChangeText={setShopBanner}
            placeholder="https://example.com/banner.jpg"
            autoCapitalize="none"
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Image upload will be available in a future update. For now, you can paste a direct link to your logo/banner image.
            </Text>
          </View>

          <Button
            title={loading ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={loading}
            style={styles.saveBtn}
          />

          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.cancelBtn}
          />

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  formArea: { flex: 1, padding: 20 },
  heading: { fontSize: 22, fontWeight: '800', color: '#333', marginBottom: 4 },
  subheading: { fontSize: 14, color: '#777', marginBottom: 24, lineHeight: 20 },
  infoBox: {
    backgroundColor: '#E3F2FD', padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#BBDEFB', marginTop: 10,
  },
  infoText: { fontSize: 13, color: '#1565C0', lineHeight: 20 },
  saveBtn: { marginTop: 24 },
  cancelBtn: { marginTop: 10 },
});

export default EditShopScreen;
