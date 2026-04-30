import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Switch,
} from 'react-native';

// -------------------------------------------------------
// Customer — Search & Filter Screen
// Filter modal with category, price range, sizes, and in-stock toggle
// -------------------------------------------------------

const CATEGORIES = [
  'All', 'Saree & Traditional', 'Dresses', 'Tops & Blouses',
  'Pants & Trousers', 'Skirts', "Men's Shirts", "Men's Trousers",
  'Kids Wear', 'Accessories', 'Footwear', 'Other',
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

const SORT_OPTIONS = [
  { key: 'newest', label: '🕐 Newest First' },
  { key: 'price_low', label: '💰 Price: Low → High' },
  { key: 'price_high', label: '💎 Price: High → Low' },
  { key: 'popular', label: '⭐ Most Popular' },
];

const SearchFilterScreen = ({ route, navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [searchText, setSearchText] = useState('');

  const toggleSize = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleApply = () => {
    const filters = {
      category: selectedCategory === 'All' ? '' : selectedCategory,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      size: selectedSizes.length > 0 ? selectedSizes[0] : undefined, // API supports single size filter
      inStock: inStockOnly || undefined,
      sortBy,
      search: searchText.trim() || undefined,
    };

    if (route.params?.onApply) {
      route.params.onApply(filters);
    }
    navigation.goBack();
  };

  const handleReset = () => {
    setSelectedCategory('All');
    setMinPrice('');
    setMaxPrice('');
    setSelectedSizes([]);
    setInStockOnly(false);
    setSortBy('newest');
    setSearchText('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <Text style={styles.sectionTitle}>🔍 Search</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search by product name..."
            placeholderTextColor="#999"
          />
        </View>

        {/* Sort */}
        <Text style={styles.sectionTitle}>📊 Sort By</Text>
        <View style={styles.card}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortItem, sortBy === opt.key && styles.sortItemActive]}
              onPress={() => setSortBy(opt.key)}
            >
              <Text style={[styles.sortText, sortBy === opt.key && styles.sortTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category */}
        <Text style={styles.sectionTitle}>📁 Category</Text>
        <View style={styles.card}>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Range */}
        <Text style={styles.sectionTitle}>💰 Price Range (LKR)</Text>
        <View style={styles.card}>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.input, styles.priceInput]}
              value={minPrice}
              onChangeText={setMinPrice}
              placeholder="Min"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            <Text style={styles.priceDash}>—</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholder="Max"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Sizes */}
        <Text style={styles.sectionTitle}>📏 Size</Text>
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

        {/* In Stock Toggle */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show in-stock products only</Text>
            <Switch
              value={inStockOnly}
              onValueChange={setInStockOnly}
              trackColor={{ false: '#ddd', true: '#C8E6C9' }}
              thumbColor={inStockOnly ? '#2E7D32' : '#ccc'}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>Reset All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.8}>
          <Text style={styles.applyBtnText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  scroll: { flex: 1, padding: 16 },
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: '#333',
    marginBottom: 10, marginTop: 8,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0',
  },
  input: {
    backgroundColor: '#f7f7f7', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 14, color: '#333',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  sortItem: {
    paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  sortItemActive: { backgroundColor: '#FBE9E7', borderRadius: 8, marginHorizontal: -4, paddingHorizontal: 8 },
  sortText: { fontSize: 14, color: '#555' },
  sortTextActive: { color: '#8B2635', fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f1f1f1', marginRight: 8, marginBottom: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#8B2635', borderColor: '#8B2635' },
  chipText: { fontSize: 13, color: '#666', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  priceRow: { flexDirection: 'row', alignItems: 'center' },
  priceInput: { flex: 1 },
  priceDash: { marginHorizontal: 12, fontSize: 18, color: '#888' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  bottomBar: {
    flexDirection: 'row', padding: 16,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  resetBtn: {
    flex: 0.4, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#f5f5f5', alignItems: 'center', marginRight: 10,
  },
  resetBtnText: { color: '#666', fontSize: 15, fontWeight: '700' },
  applyBtn: {
    flex: 0.6, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#8B2635', alignItems: 'center',
  },
  applyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

export default SearchFilterScreen;
