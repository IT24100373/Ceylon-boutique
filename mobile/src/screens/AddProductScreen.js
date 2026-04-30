import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import apiClient from '../api/client';

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
      await apiClient.post('/api/products', {
        name: name.trim(),
        description: description.trim(),
        category,
        price: parseFloat(price),
        sizes: selectedSizes,
        colors,
        images,
        variants,
      });
      Alert.alert('Success! 🎉', 'Your product has been listed and is now visible to customers.', [
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
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Section 1: Basic Info */}
        <Text style={styles.sectionTitle}>📋 Basic Information</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Handloom Cotton Saree"
            maxLength={200}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your product in detail..."
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
            <Text style={styles.pickerArrow}>{showCategoryPicker ? '▲' : '▼'}</Text>
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
            keyboardType="numeric"
          />
        </View>

        {/* Section 2: Sizes */}
        <Text style={styles.sectionTitle}>📏 Sizes *</Text>
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
        <Text style={styles.sectionTitle}>🎨 Colors *</Text>
        <View style={styles.card}>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
              value={colorInput}
              onChangeText={setColorInput}
              placeholder="e.g. Navy Blue"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addColor}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipRow}>
            {colors.map((color, idx) => (
              <TouchableOpacity key={idx} style={styles.chipRemovable} onPress={() => removeColor(idx)}>
                <Text style={styles.chipRemovableText}>{color.name} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section 4: Images */}
        <Text style={styles.sectionTitle}>📸 Images * (1–10)</Text>
        <View style={styles.card}>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10 }]}
              value={imageInput}
              onChangeText={setImageInput}
              placeholder="Paste image URL"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addImage}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          {images.map((img, idx) => (
            <View key={idx} style={styles.imageItem}>
              <Text style={styles.imageUrl} numberOfLines={1}>{img}</Text>
              <TouchableOpacity onPress={() => removeImage(idx)}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Section 5: Variants & Stock */}
        <Text style={styles.sectionTitle}>📦 Stock per Variant</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.generateBtn} onPress={generateVariants}>
            <Text style={styles.generateBtnText}>🔄 Generate Variants from Sizes × Colors</Text>
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
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>🚀 Publish Product</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  scroll: { flex: 1, padding: 16 },
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: '#333',
    marginBottom: 10, marginTop: 6,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0',
  },
  label: {
    fontSize: 13, fontWeight: '700', color: '#555',
    marginBottom: 6, marginTop: 10,
  },
  input: {
    backgroundColor: '#f7f7f7', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 14, color: '#333',
    borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 4,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  pickerBtn: {
    backgroundColor: '#f7f7f7', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 14, borderWidth: 1, borderColor: '#e2e8f0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pickerText: { fontSize: 14, color: '#333' },
  pickerPlaceholder: { fontSize: 14, color: '#999' },
  pickerArrow: { fontSize: 12, color: '#888' },
  pickerList: {
    backgroundColor: '#fff', borderRadius: 10, marginTop: 6,
    borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden',
  },
  pickerItem: { paddingVertical: 12, paddingHorizontal: 14 },
  pickerItemActive: { backgroundColor: '#FBE9E7' },
  pickerItemText: { fontSize: 14, color: '#333' },
  pickerItemTextActive: { color: '#8B2635', fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f1f1f1', marginRight: 8, marginBottom: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#8B2635', borderColor: '#8B2635' },
  chipText: { fontSize: 13, color: '#666', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  chipRemovable: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#E3F2FD', marginRight: 8, marginBottom: 8,
  },
  chipRemovableText: { fontSize: 13, color: '#1565C0', fontWeight: '600' },
  addRow: { flexDirection: 'row', alignItems: 'center' },
  addBtn: {
    backgroundColor: '#8B2635', paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  imageItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  imageUrl: { flex: 1, fontSize: 12, color: '#666', marginRight: 10 },
  removeText: { fontSize: 16, color: '#D32F2F', fontWeight: '700', padding: 4 },
  generateBtn: {
    backgroundColor: '#E8F5E9', paddingVertical: 14, borderRadius: 10,
    alignItems: 'center',
  },
  generateBtnText: { color: '#2E7D32', fontWeight: '700', fontSize: 14 },
  variantTable: { marginTop: 14 },
  variantHeader: {
    flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4,
    backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 4,
  },
  variantHeaderText: { fontSize: 12, fontWeight: '800', color: '#555' },
  variantRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  variantCell: { fontSize: 13, color: '#333', paddingHorizontal: 4 },
  variantInput: {
    flex: 0.8, backgroundColor: '#f7f7f7', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14,
    borderWidth: 1, borderColor: '#e2e8f0', textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: '#8B2635', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default AddProductScreen;
