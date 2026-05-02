import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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

  const pickImage = async (field) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newPhoto = { uri: result.assets[0].uri, isLocal: true, type: result.assets[0].type || 'image/jpeg', name: result.assets[0].uri.split('/').pop() };
      if (field === 'logo') setShopLogo(newPhoto);
      else if (field === 'banner') setShopBanner(newPhoto);
    }
  };

  const uploadSingleImage = async (img) => {
    if (typeof img === 'string') return img;
    if (!img || !img.isLocal) return '';

    const formData = new FormData();
    formData.append('image', {
      uri: img.uri,
      type: img.type,
      name: img.name || `shop_image_${Date.now()}.jpg`,
    });

    try {
      const token = await require('@react-native-async-storage/async-storage').default.getItem('ceylon_token');
      const response = await fetch(`${apiClient.defaults.baseURL}/api/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const responseData = await response.json();
      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || 'Image upload failed');
      }
      return responseData.image;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    // We check shopName. It's safe to assume seller data is string.
    const nameToSave = typeof shopName === 'string' ? shopName : '';
    if (!nameToSave.trim()) {
      Alert.alert('Error', 'Shop name cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      const finalLogoUrl = shopLogo ? await uploadSingleImage(shopLogo) : '';
      const finalBannerUrl = shopBanner ? await uploadSingleImage(shopBanner) : '';

      const response = await apiClient.put('/api/sellers/my-shop', {
        shopName: nameToSave.trim(),
        shopDescription: typeof shopDescription === 'string' ? shopDescription.trim() : '',
        categoryFocus: typeof categoryFocus === 'string' ? categoryFocus.trim() : '',
        shopLogo: finalLogoUrl,
        shopBanner: finalBannerUrl,
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

            <Text style={styles.inputLabel}>Shop Logo (URL or Upload)</Text>
            <View style={styles.imageInputRow}>
              {shopLogo ? (
                <View style={styles.imageItem}>
                  <Image source={{ uri: typeof shopLogo === 'object' ? shopLogo.uri : shopLogo }} style={styles.imagePreview} />
                  <TouchableOpacity onPress={() => setShopLogo('')} style={styles.removeBtn}>
                    <Icon name="trash-2" size={18} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('logo')}>
                    <Icon name="upload" size={18} color="#B4725E" style={{ marginRight: 8 }} />
                    <Text style={styles.uploadBtnText}>Upload Image</Text>
                  </TouchableOpacity>
                  <InputField
                    value={typeof shopLogo === 'string' ? shopLogo : ''}
                    onChangeText={setShopLogo}
                    placeholder="Or paste image URL"
                    autoCapitalize="none"
                    icon="link"
                  />
                </>
              )}
            </View>

            <Text style={styles.inputLabel}>Shop Banner (URL or Upload)</Text>
            <View style={styles.imageInputRow}>
              {shopBanner ? (
                <View style={styles.imageItem}>
                  <Image source={{ uri: typeof shopBanner === 'object' ? shopBanner.uri : shopBanner }} style={styles.imagePreviewBanner} />
                  <TouchableOpacity onPress={() => setShopBanner('')} style={styles.removeBtn}>
                    <Icon name="trash-2" size={18} color="#D32F2F" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage('banner')}>
                    <Icon name="upload" size={18} color="#B4725E" style={{ marginRight: 8 }} />
                    <Text style={styles.uploadBtnText}>Upload Banner</Text>
                  </TouchableOpacity>
                  <InputField
                    value={typeof shopBanner === 'string' ? shopBanner : ''}
                    onChangeText={setShopBanner}
                    placeholder="Or paste banner URL"
                    autoCapitalize="none"
                    icon="link"
                  />
                </>
              )}
            </View>

            <View style={styles.infoBox}>
              <Icon name="info" size={16} color="#B4725E" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.infoText}>
                You can now upload your logo/banner directly from your device, or paste a link.
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
  inputLabel: { fontSize: 14, fontFamily: 'InstrumentSans_600SemiBold', color: '#43332E', marginBottom: 8, marginTop: 10 },
  imageInputRow: { marginBottom: 16 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF5EE', paddingVertical: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#E6C9B9', marginBottom: 10, borderStyle: 'dashed'
  },
  uploadBtnText: { color: '#B4725E', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14 },
  imageItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E6C9B9', borderRadius: 10, backgroundColor: '#F8F8F8', paddingHorizontal: 12
  },
  imagePreview: {
    width: 60, height: 60, borderRadius: 30, marginRight: 10, backgroundColor: '#E0E0E0'
  },
  imagePreviewBanner: {
    width: 100, height: 50, borderRadius: 6, marginRight: 10, backgroundColor: '#E0E0E0'
  },
  removeBtn: { padding: 4 },
});

export default EditShopScreen;
