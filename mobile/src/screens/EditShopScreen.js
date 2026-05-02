import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, Alert, KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import InputField from '../components/InputField';
import Button from '../components/Button';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

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

      Alert.alert('Success', response.data.message, [
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#43332E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Shop Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.formArea} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.subheading}>
              Update your shop details. Changes will be visible to customers immediately.
            </Text>

            <InputField
              label="Shop Name *"
              value={shopName}
              onChangeText={setShopName}
              placeholder="e.g. Colombo Silk House"
              icon="home"
            />

            <InputField
              label="Shop Description"
              value={shopDescription}
              onChangeText={setShopDescription}
              placeholder="Describe your boutique..."
              multiline
              numberOfLines={4}
              icon="align-left"
            />

            <InputField
              label="Category Focus"
              value={categoryFocus}
              onChangeText={setCategoryFocus}
              placeholder="e.g. Saree & Traditional, Casual Wear"
              icon="tag"
            />

            <InputField
              label="Shop Logo URL"
              value={shopLogo}
              onChangeText={setShopLogo}
              placeholder="https://example.com/logo.jpg"
              autoCapitalize="none"
              icon="image"
            />

            <InputField
              label="Shop Banner URL"
              value={shopBanner}
              onChangeText={setShopBanner}
              placeholder="https://example.com/banner.jpg"
              autoCapitalize="none"
              icon="image"
            />

            <View style={styles.infoBox}>
              <Icon name="info" size={16} color="#B4725E" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.infoText}>
                Image upload will be available in a future update. For now, you can paste a direct link to your logo/banner image.
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
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF1E8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF1E8'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },

  formArea: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  subheading: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', marginBottom: 24, lineHeight: 22 },
  infoBox: {
    flexDirection: 'row', backgroundColor: '#FFF5EE', padding: 16, borderRadius: 10,
    borderWidth: 1, borderColor: '#E6C9B9', marginTop: 10,
  },
  infoText: { flex: 1, fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', lineHeight: 22 },
  saveBtn: { marginTop: 24, backgroundColor: '#B4725E', borderRadius: 12 },
  cancelBtn: { marginTop: 12, borderRadius: 12 },
});

export default EditShopScreen;
