import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar
} from 'react-native';
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
    setColors([...colors, { name: trimmed, hexCode: '#000000' }]);
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
      await apiClient.put(`/api/products/${productId}`, {
        name: name.trim(),
        description: description.trim(),
        category,
        price: parseFloat(price),
        sizes: selectedSizes,
        colors,
        images,
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
        <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
        <ActivityIndicator size="large" color="#B4725E" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#43332E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Product</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.sectionHeader}>
          <Icon name="info" size={20} color="#B4725E" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Basic Information</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} maxLength={200} placeholderTextColor="#8C7A74" />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description} onChangeText={setDescription}
            multiline numberOfLines={4} maxLength={2000} placeholderTextColor="#8C7A74"
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
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholderTextColor="#8C7A74" />
        </View>

        {/* Sizes */}
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

        {/* Colors */}
        <View style={styles.sectionHeader}>
          <Icon name="aperture" size={20} color="#B4725E" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Colors</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
              value={colorInput} onChangeText={setColorInput} placeholder="e.g. Navy Blue" placeholderTextColor="#8C7A74"
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

        {/* Images */}
        <View style={styles.sectionHeader}>
          <Icon name="image" size={20} color="#B4725E" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Images * (1–10)</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
              value={imageInput} onChangeText={setImageInput} placeholder="Paste image URL" placeholderTextColor="#8C7A74"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addImage}>
              <Icon name="plus" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          {images.map((img, idx) => (
            <View key={idx} style={styles.imageItem}>
              <Text style={styles.imageUrl} numberOfLines={1}>{img}</Text>
              <TouchableOpacity onPress={() => removeImage(idx)} style={styles.removeBtn}>
                <Icon name="trash-2" size={18} color="#D32F2F" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.hintContainer}>
          <Icon name="info" size={16} color="#B4725E" style={{ marginRight: 8, marginTop: 2 }} />
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
              <Icon name="save" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
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
  container: { flex: 1, backgroundColor: '#FFF1E8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF1E8'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },

  scroll: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF1E8' },
  loadingText: { marginTop: 12, color: '#8C7A74', fontFamily: 'InstrumentSans_400Regular', fontSize: 15 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 10 },
  sectionIcon: { marginRight: 8 },
  sectionTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  label: { fontSize: 14, fontFamily: 'InstrumentSans_600SemiBold', color: '#43332E', marginBottom: 8, marginTop: 14 },
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
    backgroundColor: '#B4725E', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10,
  },
  addBtnText: { color: '#FFFFFF', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14 },

  imageItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8F8F8',
  },
  imageUrl: { flex: 1, fontSize: 13, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', marginRight: 10 },
  removeBtn: { padding: 4 },

  hintContainer: { flexDirection: 'row', backgroundColor: '#FFF5EE', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#E6C9B9', marginVertical: 10 },
  hint: { flex: 1, fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', lineHeight: 22 },

  submitBtn: {
    backgroundColor: '#B4725E', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 10,
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },
});

export default EditProductScreen;
