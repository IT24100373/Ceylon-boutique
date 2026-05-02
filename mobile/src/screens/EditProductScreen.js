import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

// -------------------------------------------------------
// Seller — Edit Product Screen
// Pre-filled form for editing an existing product listing
// -------------------------------------------------------

const CATEGORIES = [
  'Saree & Traditional', 'Dresses', 'Tops & Blouses', 'Pants & Trousers',
  'Skirts', "Men's Shirts", "Men's Trousers", 'Kids Wear',
  'Accessories', 'Footwear', 'Other',
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

const EditProductScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [colorInput, setColorInput] = useState('');
  const [colors, setColors] = useState([]);
  const [imageInput, setImageInput] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // --- Fetch existing product data ---
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await apiClient.get(`/api/products/${productId}`);
        const p = response.data.product;
        setName(p.name);
        setDescription(p.description);
        setCategory(p.category);
        setPrice(String(p.price));
        setSelectedSizes(p.sizes || []);
        setColors(p.colors || []);
        setImages(p.images || []);
      } catch (error) {
        Alert.alert('Error', 'Failed to load product details.');
        navigation.goBack();
      } finally {
        setFetching(false);
      }
    };
    fetchProduct();
  }, [productId, navigation]);

  const toggleSize = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const addColor = () => {
    const trimmed = colorInput.trim();
    if (!trimmed) return;
    if (colors.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Duplicate', 'This color has already been added.');
      return;
    }
    setColors([...colors, { name: trimmed, hexCode: '#2E2A26' }]);
    setColorInput('');
  };

  const removeColor = (index) => setColors(colors.filter((_, i) => i !== index));

  const addImage = () => {
    const trimmed = imageInput.trim();
    if (!trimmed) return;
    if (images.length >= 10) {
      Alert.alert('Limit', 'Maximum 10 images allowed.');
      return;
    }
    setImages([...images, trimmed]);
    setImageInput('');
  };

  const removeImage = (index) => setImages(images.filter((_, i) => i !== index));

  // --- Pick Image from Device ---
  const pickImage = async () => {
    if (images.length >= 10) {
      Alert.alert('Limit', 'Maximum 10 images allowed.');
      return;
    }

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
      setImages([...images, { uri: result.assets[0].uri, isLocal: true, type: result.assets[0].type || 'image/jpeg', name: result.assets[0].uri.split('/').pop() }]);
    }
  };

  // --- Upload Local Images to Server ---
  const uploadLocalImages = async () => {
    const localImages = images.filter(img => typeof img === 'object' && img.isLocal);
    if (localImages.length === 0) return images;

    const formData = new FormData();
    localImages.forEach((img) => {
      formData.append('images', {
        uri: img.uri,
        type: img.type,
        name: img.name || `image_${Date.now()}.jpg`,
      });
    });

    try {
      const token = await require('@react-native-async-storage/async-storage').default.getItem('ceylon_token');

      const response = await fetch(`${apiClient.defaults.baseURL}/api/upload/images`, {
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

      const finalImages = images.map(img => {
        if (typeof img === 'string') return img;
        return responseData.images.shift() || img.uri;
      });

      return finalImages;

    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // --- Submit updates ---
  const handleSubmit = async () => {
    if (!name.trim()) return Alert.alert('Required', 'Product name is required.');
    if (!description.trim()) return Alert.alert('Required', 'Description is required.');
    if (!category) return Alert.alert('Required', 'Please select a category.');
    if (!price || parseFloat(price) < 1) return Alert.alert('Required', 'Enter a valid price.');
    if (selectedSizes.length === 0) return Alert.alert('Required', 'Select at least one size.');
    if (images.length === 0) return Alert.alert('Required', 'Add at least one image URL.');

    setLoading(true);
    try {
      // First upload any local images
      const finalImageUrls = await uploadLocalImages();

      await apiClient.put(`/api/products/${productId}`, {
        name: name.trim(),
        description: description.trim(),
        category,
        price: parseFloat(price),
        sizes: selectedSizes,
        colors,
        images: finalImageUrls,
      });
      Alert.alert('Success!', 'Product updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update product.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
        <ActivityIndicator size="large" color="#EEEADDFF" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />

      

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.sectionHeader}>
          <Icon name="info" size={20} color="#2E2A26" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Basic Information</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} maxLength={200} placeholderTextColor="#5C554F" />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description} onChangeText={setDescription}
            multiline numberOfLines={4} maxLength={2000} placeholderTextColor="#5C554F"
          />

          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text style={category ? styles.pickerText : styles.pickerPlaceholder}>
              {category || 'Select a category'}
            </Text>
            <Icon name={showCategoryPicker ? "chevron-up" : "chevron-down"} size={20} color="#2E2A26" />
          </TouchableOpacity>
          {showCategoryPicker && (
            <View style={styles.pickerList}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pickerItem, category === cat && styles.pickerItemActive]}
                  onPress={() => { setCategory(cat); setShowCategoryPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, category === cat && styles.pickerItemTextActive]}>
                    {cat}
                  </Text>
                  {category === cat && <Icon name="check" size={16} color="#2E2A26" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Price (LKR) *</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholderTextColor="#5C554F" />
        </View>

        {/* Sizes */}
        <View style={styles.sectionHeader}>
          <Icon name="maximize" size={20} color="#2E2A26" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Sizes *</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.chipRow}>
            {SIZE_OPTIONS.map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.chip, selectedSizes.includes(size) && styles.chipActive]}
                onPress={() => toggleSize(size)}
              >
                <Text style={[styles.chipText, selectedSizes.includes(size) && styles.chipTextActive]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Colors */}
        <View style={styles.sectionHeader}>
          <Icon name="aperture" size={20} color="#2E2A26" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Colors</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
              value={colorInput} onChangeText={setColorInput} placeholder="e.g. Navy Blue" placeholderTextColor="#5C554F"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addColor}>
              <Icon name="plus" size={16} color="#2E2A26" style={{ marginRight: 4 }} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipRow}>
            {colors.map((color, idx) => (
              <TouchableOpacity key={idx} style={styles.chipRemovable} onPress={() => removeColor(idx)}>
                <Text style={styles.chipRemovableText}>{color.name}</Text>
                <Icon name="x" size={14} color="#2E2A26" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Images */}
        <View style={styles.sectionHeader}>
          <Icon name="image" size={20} color="#2E2A26" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Images * (1–10)</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
              value={imageInput} onChangeText={setImageInput} placeholder="Paste image URL" placeholderTextColor="#5C554F"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addImage}>
              <Icon name="link" size={16} color="#2E2A26" style={{ marginRight: 4 }} />
              <Text style={styles.addBtnText}>URL</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Icon name="upload" size={18} color="#2E2A26" style={{ marginRight: 8 }} />
            <Text style={styles.uploadBtnText}>Upload from Device</Text>
          </TouchableOpacity>

          {images.map((img, idx) => {
            const isLocal = typeof img === 'object' && img.isLocal;
            const displayUrl = isLocal ? img.uri : img;
            return (
              <View key={idx} style={styles.imageItem}>
                <Image source={{ uri: displayUrl }} style={styles.imagePreview} />
                <Text style={styles.imageUrl} numberOfLines={1}>
                  {isLocal ? 'Local File' : displayUrl}
                </Text>
                <TouchableOpacity onPress={() => removeImage(idx)} style={styles.removeBtn}>
                  <Icon name="trash-2" size={18} color="#2E2A26" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={styles.hintContainer}>
          <Icon name="info" size={16} color="#2E2A26" style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={styles.hint}>
            To update stock quantities, go back and tap "Stock" on the product card.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="save" size={20} color="#2E2A26" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Save Changes</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },

  scroll: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  loadingText: { marginTop: 12, color: '#5C554F', fontFamily: 'Montserrat_400Regular', fontSize: 15 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 10 },
  sectionIcon: { marginRight: 8 },
  sectionTitle: { fontSize: 18, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },

  card: {
    backgroundColor: '#EEEADDFF', borderRadius: 14, padding: 20,
    marginBottom: 16,  
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  label: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', marginBottom: 8, marginTop: 14 },
  input: {
    backgroundColor: '#EEEADDFF', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#2E2A26',
      marginBottom: 4,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pickerBtn: {
    backgroundColor: '#EEEADDFF', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 14,  
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pickerText: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#5C554F' },
  pickerPlaceholder: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#8A8178' },
  pickerList: {
    backgroundColor: '#EEEADDFF', borderRadius: 10, marginTop: 6,
      overflow: 'hidden',
  },
  pickerItem: { paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerItemActive: { backgroundColor: '#EEEADDFF' },
  pickerItemText: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#5C554F' },
  pickerItemTextActive: { color: '#5C554F', fontFamily: 'Montserrat_600SemiBold' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#EEEADDFF', marginRight: 10, marginBottom: 10,
     
  },
  chipActive: { backgroundColor: '#EEEADDFF', },
  chipText: { fontSize: 14, color: '#5C554F', fontFamily: 'Montserrat_600SemiBold' },
  chipTextActive: { color: '#5C554F' },
  chipRemovable: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#EEEADDFF', marginRight: 10, marginBottom: 10,
     
  },
  chipRemovableText: { fontSize: 14, color: '#5C554F', fontFamily: 'Montserrat_600SemiBold' },

  addRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EEEADDFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10,
  },
  addBtnText: { color: '#5C554F', fontFamily: 'Montserrat_600SemiBold', fontSize: 14 },

  imageItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12,  
  },
  imagePreview: {
    width: 40, height: 40, borderRadius: 6, marginRight: 10, backgroundColor: '#FFFFFF'
  },
  imageUrl: { flex: 1, fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', marginRight: 10 },
  removeBtn: { padding: 4 },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EEEADDFF', paddingVertical: 14, borderRadius: 10,
      marginBottom: 16, borderStyle: 'dashed'
  },
  uploadBtnText: { color: '#5C554F', fontFamily: 'Montserrat_600SemiBold', fontSize: 14 },

  hintContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 10,   marginVertical: 10 },
  hint: { flex: 1, fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#8A8178', lineHeight: 22 },

  submitBtn: {
    backgroundColor: '#EEEADDFF', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 10,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#8A8178', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

export default EditProductScreen;
