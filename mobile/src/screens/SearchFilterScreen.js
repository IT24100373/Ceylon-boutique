import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Switch, StatusBar, Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Search Header Area */}
          <View style={styles.headerArea}>
            <Text style={styles.headerTitle}>Discovery</Text>
            <View style={styles.searchBar}>
              <Icon name="search" size={18} color="#A8A19A" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Find your next boutique piece..."
                placeholderTextColor="#A8A19A"
              />
            </View>
          </View>

          {/* Sort Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Preferences</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.optionsGrid}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.sortCard, sortBy === opt.key && styles.sortCardActive]}
                  onPress={() => setSortBy(opt.key)}
                >
                  <Icon name={opt.icon} size={16} color={sortBy === opt.key ? "#FFFFFF" : "#8A8178"} style={{ marginBottom: 8 }} />
                  <Text style={[styles.sortCardText, sortBy === opt.key && styles.sortCardTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Collections</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.chipGrid}>
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

          {/* Price Range Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Budget (LKR)</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.priceContainer}>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.priceInputLabel}>From</Text>
                <TextInput
                  style={styles.priceInput}
                  value={minPrice}
                  onChangeText={setMinPrice}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor="#A8A19A"
                />
              </View>
              <View style={styles.priceDashWrapper}>
                <View style={styles.priceDash} />
              </View>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.priceInputLabel}>To</Text>
                <TextInput
                  style={styles.priceInput}
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  placeholder="99,999"
                  keyboardType="numeric"
                  placeholderTextColor="#A8A19A"
                />
              </View>
            </View>
          </View>

          {/* Size Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Fit & Size</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.chipGrid}>
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

          {/* Inventory Toggle */}
          <View style={styles.inventoryCard}>
            <View style={styles.inventoryInfo}>
              <Icon name="package" size={18} color="#2E2A26" style={{ marginRight: 12 }} />
              <Text style={styles.inventoryLabel}>Available In Stock Only</Text>
            </View>
            <Switch
              value={inStockOnly}
              onValueChange={setInStockOnly}
              trackColor={{ false: '#EEEADD', true: '#2E2A26' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.9}>
            <Text style={styles.applyBtnText}>Apply Selection</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  
  headerArea: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 25, backgroundColor: '#EEEADDFF', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTitle: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 20 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, height: 50, fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#2E2A26' },

  section: { paddingHorizontal: 20, marginVertical: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#2E2A26', textTransform: 'uppercase', letterSpacing: 1.5, marginRight: 15 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#F0EBE5' },

  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  sortCard: {
    width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 15,
    borderWidth: 1, borderColor: '#F0EBE5', alignItems: 'center'
  },
  sortCardActive: { backgroundColor: '#2E2A26', borderColor: '#2E2A26' },
  sortCardText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', textAlign: 'center' },
  sortCardTextActive: { color: '#FFFFFF' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F8F6F4', borderWidth: 1, borderColor: '#EEEADD' },
  chipActive: { backgroundColor: '#2E2A26', borderColor: '#2E2A26' },
  chipText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },
  chipTextActive: { color: '#FFFFFF' },

  priceContainer: { flexDirection: 'row', alignItems: 'center' },
  priceInputWrapper: { flex: 1 },
  priceInputLabel: { fontSize: 11, fontFamily: 'Montserrat_700Bold', color: '#A8A19A', textTransform: 'uppercase', marginBottom: 8 },
  priceInput: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0EBE5', borderRadius: 12, height: 48,
    paddingHorizontal: 16, fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26'
  },
  priceDashWrapper: { paddingHorizontal: 15, paddingTop: 20 },
  priceDash: { width: 10, height: 2, backgroundColor: '#A8A19A' },

  inventoryCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', marginHorizontal: 20, padding: 20, borderRadius: 20,
    borderWidth: 1, borderColor: '#F0EBE5', marginVertical: 10
  },
  inventoryInfo: { flexDirection: 'row', alignItems: 'center' },
  inventoryLabel: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },

  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20, flexDirection: 'row', gap: 15, borderTopWidth: 1, borderTopColor: '#F0EBE5'
  },
  resetBtn: { flex: 0.4, height: 56, borderRadius: 16, borderWeight: 1, borderColor: '#2E2A26', borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  resetBtnText: { color: '#2E2A26', fontSize: 15, fontFamily: 'Montserrat_600SemiBold' },
  applyBtn: { flex: 0.6, height: 56, borderRadius: 16, backgroundColor: '#2E2A26', justifyContent: 'center', alignItems: 'center', shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  applyBtnText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Montserrat_600SemiBold' },
});

export default SearchFilterScreen;
