import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

// -------------------------------------------------------
// Seller — Add Product Screen
// Multi-section form for creating a new product listing
// -------------------------------------------------------

const CATEGORIES = [
  'Saree & Traditional', 'Dresses', 'Tops & Blouses', 'Pants & Trousers',
  'Skirts', "Men's Shirts", "Men's Trousers", 'Kids Wear',
  'Accessories', 'Footwear', 'Other',
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

const AddProductScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [colorInput, setColorInput] = useState('');
  const [colors, setColors] = useState([]);
  const [imageInput, setImageInput] = useState('');
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // --- Size selection toggle ---
  const toggleSize = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // --- Add color ---
  const addColor = () => {
    const trimmed = colorInput.trim();
    if (!trimmed) return;
    if (colors.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Duplicate', 'This color has already been added.');
      return;
    }
    setColors([...colors, { name: trimmed, hexCode: '#000000' }]);
    setColorInput('');
  };

  const removeColor = (index) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  // --- Add image URL ---
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

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

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
      // Add a special object to distinguish local files from URLs
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
      // Need a separate instance or custom config for multipart/form-data
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
      
      // Combine existing URLs with newly uploaded URLs
      const finalImages = images.map(img => {
        if (typeof img === 'string') return img;
        // This relies on the order being preserved, which it should be
        return responseData.images.shift() || img.uri; // Fallback to local uri if something goes wrong, though backend will reject
      });
      
      return finalImages;
      
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // --- Generate variants from sizes × colors ---
  const generateVariants = () => {
    if (selectedSizes.length === 0) {
      Alert.alert('Missing Sizes', 'Please select at least one size first.');
      return;
    }
    if (colors.length === 0) {
      Alert.alert('Missing Colors', 'Please add at least one color first.');
      return;
    }

    const newVariants = [];
    selectedSizes.forEach((size) => {
      colors.forEach((color) => {
        // Preserve existing stock if variant already exists
        const existing = variants.find((v) => v.size === size && v.color === color.name);
        newVariants.push({
          size,
          color: color.name,
          stock: existing ? existing.stock : 0,
        });
      });
    });
    setVariants(newVariants);
  };

  const updateVariantStock = (index, value) => {
    const updated = [...variants];
    updated[index].stock = parseInt(value) || 0;
    setVariants(updated);
  };

  // --- Submit product ---
  const handleSubmit = async () => {
    // Basic client-side checks
    if (!name.trim()) return Alert.alert('Required', 'Product name is required.');
    if (!description.trim()) return Alert.alert('Required', 'Product description is required.');
    if (!category) return Alert.alert('Required', 'Please select a category.');
    if (!price || parseFloat(price) < 1) return Alert.alert('Required', 'Please enter a valid price (min LKR 1).');
    if (selectedSizes.length === 0) return Alert.alert('Required', 'Please select at least one size.');
    if (colors.length === 0) return Alert.alert('Required', 'Please add at least one color.');
    if (images.length === 0) return Alert.alert('Required', 'Please add at least one image URL.');
    if (variants.length === 0) return Alert.alert('Required', 'Please generate and set stock for variants.');

    setLoading(true);
    try {
      // First upload any local images
      const finalImageUrls = await uploadLocalImages();

      await apiClient.post('/api/products', {
        name: name.trim(),
        description: description.trim(),
        category,
        price: parseFloat(price),
        sizes: selectedSizes,
        colors,
        images: finalImageUrls,
        variants,
      });
      Alert.alert('Success!', 'Your product has been listed and is now visible to customers.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to add product. Please try again.';
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
        <Text style={styles.headerTitle}>Add Product</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Section 1: Basic Info */}
        <View style={styles.sectionHeader}>
          <Icon name="info" size={20} color="#B4725E" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Basic Information</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Handloom Cotton Saree"
            placeholderTextColor="#8C7A74"
            maxLength={200}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your product in detail..."
            placeholderTextColor="#8C7A74"
            multiline
            numberOfLines={4}
            maxLength={2000}
          />

          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text style={category ? styles.pickerText : styles.pickerPlaceholder}>
              {category || 'Select a category'}
            </Text>
            <Icon name={showCategoryPicker ? "chevron-up" : "chevron-down"} size={20} color="#8C7A74" />
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
                  {category === cat && <Icon name="check" size={16} color="#B4725E" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Price (LKR) *</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="e.g. 2500"
            placeholderTextColor="#8C7A74"
            keyboardType="numeric"
          />
        </View>

        {/* Section 2: Sizes */}
        <View style={styles.sectionHeader}>
          <Icon name="maximize" size={20} color="#B4725E" style={styles.sectionIcon} />
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

        {/* Section 3: Colors */}
        <View style={styles.sectionHeader}>
          <Icon name="aperture" size={20} color="#B4725E" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Colors *</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
              value={colorInput}
              onChangeText={setColorInput}
              placeholder="e.g. Navy Blue"
              placeholderTextColor="#8C7A74"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addColor}>
              <Icon name="plus" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipRow}>
            {colors.map((color, idx) => (
              <TouchableOpacity key={idx} style={styles.chipRemovable} onPress={() => removeColor(idx)}>
                <Text style={styles.chipRemovableText}>{color.name}</Text>
                <Icon name="x" size={14} color="#B4725E" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section 4: Images */}
        <View style={styles.sectionHeader}>
          <Icon name="image" size={20} color="#B4725E" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Images * (1–10)</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
              value={imageInput}
              onChangeText={setImageInput}
              placeholder="Paste image URL"
              placeholderTextColor="#8C7A74"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addImage}>
              <Icon name="link" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addBtnText}>URL</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
             <Icon name="upload" size={18} color="#B4725E" style={{ marginRight: 8 }} />
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
                  <Icon name="trash-2" size={18} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Section 5: Variants & Stock */}
        <View style={styles.sectionHeader}>
          <Icon name="package" size={20} color="#B4725E" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Stock per Variant</Text>
        </View>
        <View style={styles.card}>
          <TouchableOpacity style={styles.generateBtn} onPress={generateVariants}>
            <Icon name="refresh-cw" size={16} color="#B4725E" style={{ marginRight: 8 }} />
            <Text style={styles.generateBtnText}>Generate Variants from Sizes × Colors</Text>
          </TouchableOpacity>

          {variants.length > 0 && (
            <View style={styles.variantTable}>
              <View style={styles.variantHeader}>
                <Text style={[styles.variantHeaderText, { flex: 1 }]}>Size</Text>
                <Text style={[styles.variantHeaderText, { flex: 1 }]}>Color</Text>
                <Text style={[styles.variantHeaderText, { flex: 0.8 }]}>Stock</Text>
              </View>
              {variants.map((v, idx) => (
                <View key={idx} style={styles.variantRow}>
                  <Text style={[styles.variantCell, { flex: 1 }]}>{v.size}</Text>
                  <Text style={[styles.variantCell, { flex: 1 }]}>{v.color}</Text>
                  <TextInput
                    style={styles.variantInput}
                    value={String(v.stock)}
                    onChangeText={(val) => updateVariantStock(idx, val)}
                    keyboardType="numeric"
                  />
                </View>
              ))}
            </View>
          )}
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
              <Icon name="upload-cloud" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Publish Product</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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

  scroll: { flex: 1, padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 10 },
  sectionIcon: { marginRight: 8 },
  sectionTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  label: {
    fontSize: 14, fontFamily: 'InstrumentSans_600SemiBold', color: '#43332E',
    marginBottom: 8, marginTop: 14,
  },
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#2A201D',
    borderWidth: 1, borderColor: '#E6C9B9', marginBottom: 4,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pickerBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 14, borderWidth: 1, borderColor: '#E6C9B9',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pickerText: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#2A201D' },
  pickerPlaceholder: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74' },
  pickerList: {
    backgroundColor: '#FFFFFF', borderRadius: 10, marginTop: 6,
    borderWidth: 1, borderColor: '#E6C9B9', overflow: 'hidden',
  },
  pickerItem: { paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerItemActive: { backgroundColor: '#FFF5EE' },
  pickerItemText: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#2A201D' },
  pickerItemTextActive: { color: '#B4725E', fontFamily: 'InstrumentSans_600SemiBold' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#FFF5EE', marginRight: 10, marginBottom: 10,
    borderWidth: 1, borderColor: '#E6C9B9',
  },
  chipActive: { backgroundColor: '#B4725E', borderColor: '#B4725E' },
  chipText: { fontSize: 14, color: '#43332E', fontFamily: 'InstrumentSans_600SemiBold' },
  chipTextActive: { color: '#FFFFFF' },
  chipRemovable: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFF5EE', marginRight: 10, marginBottom: 10,
    borderWidth: 1, borderColor: '#E6C9B9',
  },
  chipRemovableText: { fontSize: 14, color: '#B4725E', fontFamily: 'InstrumentSans_600SemiBold' },

  addRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#B4725E', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 10,
  },
  addBtnText: { color: '#FFFFFF', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14 },

  imageItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8F8F8',
  },
  imagePreview: {
    width: 40, height: 40, borderRadius: 6, marginRight: 10, backgroundColor: '#F0F0F0'
  },
  imageUrl: { flex: 1, fontSize: 13, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', marginRight: 10 },
  removeBtn: { padding: 4 },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF5EE', paddingVertical: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#E6C9B9', marginBottom: 16, borderStyle: 'dashed'
  },
  uploadBtnText: { color: '#B4725E', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14 },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF5EE', paddingVertical: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#E6C9B9',
  },
  generateBtnText: { color: '#B4725E', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14 },

  variantTable: { marginTop: 20 },
  variantHeader: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8,
    backgroundColor: '#F8F8F8', borderRadius: 8, marginBottom: 8,
  },
  variantHeaderText: { fontSize: 13, fontFamily: 'InstrumentSans_600SemiBold', color: '#8C7A74' },
  variantRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8F8F8',
  },
  variantCell: { fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#2A201D', paddingHorizontal: 8 },
  variantInput: {
    flex: 0.8, backgroundColor: '#FFFFFF', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, fontFamily: 'InstrumentSans_400Regular',
    borderWidth: 1, borderColor: '#E6C9B9', textAlign: 'center', color: '#2A201D'
  },

  submitBtn: {
    backgroundColor: '#B4725E', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 10,
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },
});

export default AddProductScreen;
