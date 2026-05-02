import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Switch, StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

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
  { key: 'newest', label: 'Newest First', icon: 'clock' },
  { key: 'price_low', label: 'Price: Low → High', icon: 'trending-up' },
  { key: 'price_high', label: 'Price: High → Low', icon: 'trending-down' },
  { key: 'popular', label: 'Most Popular', icon: 'star' },
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
      size: selectedSizes.length > 0 ? selectedSizes[0] : undefined,
      inStock: inStockOnly || undefined,
      sortBy,
      search: searchText.trim() || undefined,
    };

    // Navigate back to Home with filter params (no function callbacks — serializable only)
    navigation.navigate('Home', { filters });
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="x" size={24} color="#43332E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filter & Sort</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.sectionHeader}>
          <Icon name="search" size={20} color="#B4725E" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Search</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={18} color="#8C7A74" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by product name..."
              placeholderTextColor="#8C7A74"
            />
          </View>
        </View>

        {/* Sort */}
        <View style={styles.sectionHeader}>
          <Icon name="bar-chart-2" size={20} color="#B4725E" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Sort By</Text>
        </View>
        <View style={styles.card}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortItem, sortBy === opt.key && styles.sortItemActive]}
              onPress={() => setSortBy(opt.key)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name={opt.icon} size={16} color={sortBy === opt.key ? "#B4725E" : "#8C7A74"} style={{ marginRight: 10 }} />
                <Text style={[styles.sortText, sortBy === opt.key && styles.sortTextActive]}>
                  {opt.label}
                </Text>
              </View>
              {sortBy === opt.key && <Icon name="check" size={16} color="#B4725E" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Category */}
        <View style={styles.sectionHeader}>
          <Icon name="tag" size={20} color="#B4725E" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Category</Text>
        </View>
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
        <View style={styles.sectionHeader}>
          <Icon name="dollar-sign" size={20} color="#B4725E" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Price Range (LKR)</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.priceRow}>
            <TextInput
              style={[styles.input, styles.priceInput]}
              value={minPrice}
              onChangeText={setMinPrice}
              placeholder="Min"
              keyboardType="numeric"
              placeholderTextColor="#8C7A74"
            />
            <Text style={styles.priceDash}>—</Text>
            <TextInput
              style={[styles.input, styles.priceInput]}
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholder="Max"
              keyboardType="numeric"
              placeholderTextColor="#8C7A74"
            />
          </View>
        </View>

        {/* Sizes */}
        <View style={styles.sectionHeader}>
          <Icon name="maximize" size={20} color="#B4725E" style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Size</Text>
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

        {/* In Stock Toggle */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="package" size={18} color="#B4725E" style={{ marginRight: 8 }} />
              <Text style={styles.toggleLabel}>Show in-stock products only</Text>
            </View>
            <Switch
              value={inStockOnly}
              onValueChange={setInStockOnly}
              trackColor={{ false: '#E6C9B9', true: '#B4725E' }}
              thumbColor={inStockOnly ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
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
  container: { flex: 1, backgroundColor: '#FFF1E8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF1E8'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },

  scroll: { flex: 1, padding: 16 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 6 },
  sectionIcon: { marginRight: 8 },
  sectionTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', borderRadius: 10, borderWidth: 1, borderColor: '#E6C9B9', paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#2A201D' },

  input: {
    backgroundColor: '#F8F8F8', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#2A201D',
    borderWidth: 1, borderColor: '#E6C9B9',
  },
  sortItem: {
    paddingVertical: 14, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#F8F8F8',
  },
  sortItemActive: { backgroundColor: '#FFF5EE', borderRadius: 8, borderWidth: 1, borderColor: '#E6C9B9' },
  sortText: { fontSize: 15, color: '#43332E', fontFamily: 'InstrumentSans_400Regular' },
  sortTextActive: { color: '#B4725E', fontFamily: 'InstrumentSans_600SemiBold' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#FFF5EE', marginRight: 10, marginBottom: 10,
    borderWidth: 1, borderColor: '#E6C9B9',
  },
  chipActive: { backgroundColor: '#B4725E', borderColor: '#B4725E' },
  chipText: { fontSize: 14, color: '#43332E', fontFamily: 'InstrumentSans_600SemiBold' },
  chipTextActive: { color: '#FFFFFF' },

  priceRow: { flexDirection: 'row', alignItems: 'center' },
  priceInput: { flex: 1 },
  priceDash: { marginHorizontal: 12, fontSize: 18, color: '#8C7A74', fontFamily: 'InstrumentSans_600SemiBold' },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4
  },
  toggleLabel: { fontSize: 15, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D' },

  bottomBar: {
    flexDirection: 'row', padding: 16, paddingBottom: 30,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E6C9B9',
  },
  resetBtn: {
    flex: 0.4, paddingVertical: 16, borderRadius: 12,
    backgroundColor: '#F8F8F8', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#E6C9B9'
  },
  resetBtnText: { color: '#43332E', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },
  applyBtn: {
    flex: 0.6, paddingVertical: 16, borderRadius: 12,
    backgroundColor: '#B4725E', alignItems: 'center',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4
  },
  applyBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },
});

export default SearchFilterScreen;
