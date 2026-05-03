import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar, Image, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

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
      setImages([...images, { uri: result.assets[0].uri, isLocal: true, type: 'image/jpeg', name: result.assets[0].uri.split('/').pop() || 'image.jpg' }]);
    }
  };

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
        },
        body: formData,
      });
      const responseData = await response.json();
      if (!response.ok || !responseData.success) throw new Error(responseData.message || 'Image upload failed');
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

  const generateVariants = () => {
    if (selectedSizes.length === 0) return Alert.alert('Missing Sizes', 'Please select at least one size first.');
    if (colors.length === 0) return Alert.alert('Missing Colors', 'Please add at least one color first.');
    const newVariants = [];
    selectedSizes.forEach((size) => {
      colors.forEach((color) => {
        const existing = variants.find((v) => v.size === size && v.color === color.name);
        newVariants.push({ size, color: color.name, stock: existing ? existing.stock : 0 });
      });
    });
    setVariants(newVariants);
  };

  const updateVariantStock = (index, value) => {
    const updated = [...variants];
    updated[index].stock = parseInt(value) || 0;
    setVariants(updated);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return Alert.alert('Required', 'Product name is required.');
    if (!description.trim()) return Alert.alert('Required', 'Product description is required.');
    if (!category) return Alert.alert('Required', 'Please select a category.');
    if (!price || parseFloat(price) < 1) return Alert.alert('Required', 'Please enter a valid price.');
    if (selectedSizes.length === 0) return Alert.alert('Required', 'Please select at least one size.');
    if (colors.length === 0) return Alert.alert('Required', 'Please add at least one color.');
    if (images.length === 0) return Alert.alert('Required', 'Please add at least one image.');
    if (variants.length === 0) return Alert.alert('Required', 'Please generate variants.');

    setLoading(true);
    try {
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
      Alert.alert('Success!', 'Product listed successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <SafeAreaView style={{ flex: 1 }}>
        

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Basic Details</Text>
            <View style={styles.sectionLine} />
          </View>
          
          <View style={styles.card}>
            <Text style={styles.label}>Product Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter product title"
              placeholderTextColor="#A8A19A"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="What makes this product special?"
              placeholderTextColor="#A8A19A"
              multiline
            />

            <Text style={styles.label}>Category</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCategoryPicker(!showCategoryPicker)}>
              <Text style={category ? styles.pickerText : styles.pickerPlaceholder}>{category || 'Select Category'}</Text>
              <Icon name="chevron-down" size={20} color="#2E2A26" />
            </TouchableOpacity>
            
            {showCategoryPicker && (
              <View style={styles.pickerList}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity key={cat} style={styles.pickerItem} onPress={() => { setCategory(cat); setShowCategoryPicker(false); }}>
                    <Text style={[styles.pickerItemText, category === cat && styles.activePickerItemText]}>{cat}</Text>
                    {category === cat && <Icon name="check" size={16} color="#2E2A26" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Price (LKR)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="e.g. 5000"
              placeholderTextColor="#A8A19A"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Attributes</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Available Sizes</Text>
            <View style={styles.chipRow}>
              {SIZE_OPTIONS.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.chip, selectedSizes.includes(size) && styles.chipActive]}
                  onPress={() => toggleSize(size)}
                >
                  <Text style={[styles.chipText, selectedSizes.includes(size) && styles.chipTextActive]}>{size}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Colors</Text>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
                value={colorInput}
                onChangeText={setColorInput}
                placeholder="Add color (e.g. Red)"
                placeholderTextColor="#A8A19A"
              />
              <TouchableOpacity style={styles.miniAddBtn} onPress={addColor}>
                <Icon name="plus" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.chipRow}>
              {colors.map((color, idx) => (
                <TouchableOpacity key={idx} style={styles.removableChip} onPress={() => removeColor(idx)}>
                  <Text style={styles.removableChipText}>{color.name}</Text>
                  <Icon name="x" size={14} color="#2E2A26" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Product Media</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.card}>
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              <Icon name="image" size={32} color="#8A8178" />
              <Text style={styles.uploadBoxText}>Upload from Device</Text>
              <Text style={styles.uploadBoxSub}>Up to 10 high-quality photos</Text>
            </TouchableOpacity>

            <View style={styles.urlRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
                value={imageInput}
                onChangeText={setImageInput}
                placeholder="Or paste image URL"
                placeholderTextColor="#A8A19A"
              />
              <TouchableOpacity style={styles.urlAddBtn} onPress={addImage}>
                <Icon name="link" size={18} color="#2E2A26" />
              </TouchableOpacity>
            </View>

            <View style={styles.imageList}>
              {images.map((img, idx) => {
                const isLocal = typeof img === 'object' && img.isLocal;
                return (
                  <View key={idx} style={styles.imageWrapper}>
                    <Image source={{ uri: isLocal ? img.uri : img }} style={styles.imageItem} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(idx)}>
                      <Icon name="x" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inventory</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.card}>
            <TouchableOpacity style={styles.generateBtn} onPress={generateVariants}>
              <Icon name="layers" size={18} color="#2E2A26" style={{ marginRight: 8 }} />
              <Text style={styles.generateBtnText}>Generate Variant Grid</Text>
            </TouchableOpacity>

            {variants.length > 0 && (
              <View style={styles.variantList}>
                {variants.map((v, idx) => (
                  <View key={idx} style={styles.variantRow}>
                    <View style={styles.variantInfo}>
                      <Text style={styles.variantMainText}>{v.color} • {v.size}</Text>
                    </View>
                    <View style={styles.variantStockInput}>
                      <Text style={styles.stockLabel}>Stock:</Text>
                      <TextInput
                        style={styles.stockInput}
                        value={String(v.stock)}
                        onChangeText={(val) => updateVariantStock(idx, val)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Publish Product</Text>}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },

  scroll: { flex: 1, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  sectionTitle: { fontSize: 14, fontFamily: 'Montserrat_700Bold', color: '#2E2A26', textTransform: 'uppercase', letterSpacing: 1, marginRight: 15 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#F0EBE5' },

  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 0, marginBottom: 10 },
  label: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', marginBottom: 10, marginTop: 5 },
  input: {
    backgroundColor: '#F8F6F4', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', marginBottom: 20,
    borderWidth: 1, borderColor: '#EEEADD'
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  
  pickerBtn: {
    backgroundColor: '#F8F6F4', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#EEEADD'
  },
  pickerText: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#2E2A26' },
  pickerPlaceholder: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#A8A19A' },
  pickerList: { backgroundColor: '#F8F6F4', borderRadius: 12, marginBottom: 20, padding: 8, borderWidth: 1, borderColor: '#EEEADD' },
  pickerItem: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8 },
  pickerItemText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#5C554F' },
  activePickerItemText: { fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F8F6F4', marginRight: 10, marginBottom: 10, borderWidth: 1, borderColor: '#EEEADD' },
  chipActive: { backgroundColor: '#2E2A26', borderColor: '#2E2A26' },
  chipText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },
  chipTextActive: { color: '#FFFFFF' },

  addRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  miniAddBtn: { width: 50, height: 50, backgroundColor: '#2E2A26', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  removableChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F0EBE5', marginRight: 10, marginBottom: 10 },
  removableChipText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26', marginRight: 8 },

  uploadBox: {
    height: 140, backgroundColor: '#F8F6F4', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#EEEADD',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20
  },
  uploadBoxText: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26', marginTop: 12 },
  uploadBoxSub: { fontSize: 12, fontFamily: 'Montserrat_400Regular', color: '#8A8178', marginTop: 4 },

  urlRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  urlAddBtn: { width: 50, height: 50, backgroundColor: '#F0EBE5', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEEADD' },

  imageList: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  imageWrapper: { width: 80, height: 80, marginRight: 12, marginBottom: 12, borderRadius: 12, overflow: 'hidden' },
  imageItem: { width: '100%', height: '100%' },
  removeImageBtn: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(46, 42, 38, 0.8)', justifyContent: 'center', alignItems: 'center' },

  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0EBE5', paddingVertical: 16, borderRadius: 12, marginBottom: 20,
    borderWidth: 1, borderColor: '#EEEADD'
  },
  generateBtnText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },

  variantList: { marginBottom: 10 },
  variantRow: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    backgroundColor: '#F8F6F4', padding: 15, borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#EEEADD'
  },
  variantMainText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },
  variantStockInput: { flexDirection: 'row', alignItems: 'center' },
  stockLabel: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', marginRight: 8 },
  stockInput: { 
    backgroundColor: '#FFFFFF', width: 60, paddingVertical: 8, paddingHorizontal: 10, 
    borderRadius: 8, borderWidth: 1, borderColor: '#EEEADD', textAlign: 'center',
    fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26'
  },

  submitBtn: { 
    backgroundColor: '#2E2A26', paddingVertical: 18, borderRadius: 16, alignItems: 'center', 
    marginTop: 20, shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8
  },
  disabledBtn: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: '#FFFFFF', letterSpacing: 0.5 },
});

export default AddProductScreen;
