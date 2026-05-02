import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, RefreshControl, Image, StatusBar, Dimensions, ImageBackground
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40) / 2;

// key = exact backend enum value, label = short display text for the chip
const CATEGORIES = [
  { key: 'All', label: 'All' },
  { key: 'Saree & Traditional', label: 'Sarees' },
  { key: 'Dresses', label: 'Dresses' },
  { key: 'Tops & Blouses', label: 'Tops' },
  { key: 'Pants & Trousers', label: 'Pants' },
  { key: 'Skirts', label: 'Skirts' },
  { key: "Men's Shirts", label: 'Men' },
  { key: 'Accessories', label: 'Accs' },
  { key: 'Footwear', label: 'Shoes' },
  { key: 'Kids Wear', label: 'Kids' },
  { key: 'Other', label: 'Other' },
];

const ProductBrowseScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { cartItems } = useCart();
  const listRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [minPrice, setMinPrice] = useState(undefined);
  const [maxPrice, setMaxPrice] = useState(undefined);
  const [size, setSize] = useState(undefined);
  const [inStock, setInStock] = useState(undefined);
  const [sortBy, setSortBy] = useState('newest');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    try {
      const params = { page: pageNum, limit: 12 };
      if (search.trim()) params.search = search.trim();
      if (activeCategory !== 'All') params.category = activeCategory;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (size) params.size = size;
      if (inStock) params.inStock = 'true';
      if (sortBy !== 'newest') params.sortBy = sortBy;

      const response = await apiClient.get('/api/products', { params });

      if (append) {
        setProducts((prev) => [...prev, ...response.data.products]);
      } else {
        setProducts(response.data.products);
      }
      setTotalPages(response.data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.log('Fetch products error:', error.response?.data?.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, activeCategory, minPrice, maxPrice, size, inStock, sortBy]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchProducts(1, false);
  }, [activeCategory, fetchProducts]);

  // Consume filter params returned from SearchFilterScreen.
  // Always overwrite ALL filter state so that Reset (which sends undefined
  // for cleared fields) properly wipes any previously applied values.
  useEffect(() => {
    if (route.params?.filters) {
      const { filters } = route.params;
      setActiveCategory(filters.category || 'All');
      setSearch(filters.search || '');
      setMinPrice(filters.minPrice || undefined);
      setMaxPrice(filters.maxPrice || undefined);
      setSize(filters.size || undefined);
      setInStock(filters.inStock || undefined);
      setSortBy(filters.sortBy || 'newest');
      // Clear params after consuming to avoid re-triggering
      navigation.setParams({ filters: undefined });
    }
  }, [route.params?.filters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(1, false);
    setRefreshing(false);
  };

  const renderProduct = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.noImage]}>
              <Icon name="image" size={20} color="#2E2A26" />
            </View>
          )}
          <TouchableOpacity
            style={styles.heartButton}
            onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
          >
            <Icon name="heart" size={12} color="#2E2A26" />
          </TouchableOpacity>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          {item.seller && (
            <Text style={styles.sellerName} numberOfLines={1}>{item.seller.shopName}</Text>
          )}
          <View style={styles.ratingRow}>
            <Icon name="star" size={10} color="#2E2A26" style={{ fill: '#D4A853' }} />
            <Text style={styles.ratingText}>{item.averageRating > 0 ? item.averageRating.toFixed(1) : '5.0'}</Text>
          </View>
          <Text style={styles.productPrice}>LKR {item.price?.toLocaleString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const HeaderComponent = () => (
    <View>
      {/* Hero Banner */}
      <View style={styles.heroContainer}>
        <ImageBackground
          source={require('../../assets/XS.png')}
          style={styles.heroImage}
          imageStyle={{ borderRadius: 16 }}
        >
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>New Arrivals:{'\n'}Handloom Collection</Text>
          </View>
        </ImageBackground>
      </View>

      {/* Category Chips */}
      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(cat) => cat.key}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[styles.categoryChip, activeCategory === cat.key && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat.key)}
            >
              <Text style={[styles.categoryText, activeCategory === cat.key && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>
    </View>
  );

  return (
    <>
      <SafeAreaView style={{ flex: 0, backgroundColor: '#EEEADDFF' }} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />

        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('SearchFilter')}>
            <Icon name="menu" size={24} color="#2E2A26" />
          </TouchableOpacity>

          <Text style={styles.brandTitle}>Ceylon Boutique</Text>

          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Cart')}>
            <Icon name="shopping-bag" size={24} color="#2E2A26" />
            {cartItems.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Product Grid */}
        <FlatList
          ref={listRef}
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          numColumns={2}
          ListHeaderComponent={HeaderComponent}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EEEADDFF" />}
          onEndReached={() => {
            if (!loadingMore && page < totalPages) {
              setLoadingMore(true);
              fetchProducts(page + 1, true);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
          >
            <Icon name="home" size={26} color="#2E2A26" />
            <Text style={[styles.navLabel, styles.navLabelActive]}>HOME</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SearchFilter')}>
            <Icon name="search" size={26} color="#2E2A26" />
            <Text style={styles.navLabel}>SEARCH</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Cart')}>
            <Icon name="shopping-bag" size={26} color="#2E2A26" />
            <Text style={styles.navLabel}>CART</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
            <Icon name="user" size={26} color="#2E2A26" />
            <Text style={styles.navLabel}>PROFILE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#EEEADDFF',
  },
  headerIconBtn: { padding: 8 },
  brandTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 24,
    color: '#2E2A26',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: '#D32F2F', borderRadius: 10,
    width: 16, height: 16, justifyContent: 'center', alignItems: 'center'
  },
  badgeText: { color: '#5C554F', fontSize: 9, fontFamily: 'Montserrat_600SemiBold' },

  heroContainer: { padding: 16 },
  heroImage: { width: '100%', height: 240, justifyContent: 'center' },
  heroOverlay: { padding: 20 },
  heroTitle: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 22,
    color: '#2E2A26',
    lineHeight: 28,

  },

  categoryRow: { marginBottom: 16 },
  categoryChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#EEEADDFF', marginRight: 10,
  },
  categoryChipActive: { backgroundColor: '#2E2A26' },
  categoryText: { fontSize: 13, color: '#2E2A26', fontFamily: 'Montserrat_600SemiBold' },
  categoryTextActive: { color: '#FFFFFF' },

  gridContent: { paddingBottom: 20 },
  gridRow: { justifyContent: 'flex-start', paddingHorizontal: 12 },
  productCard: {
    backgroundColor: '#ffffffff', borderRadius: 12, width: COLUMN_WIDTH,
    marginBottom: 16, marginRight: 8, overflow: 'hidden',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  imageContainer: { width: '100%', height: 180, backgroundColor: '#FFFFFF' },
  productImage: { width: '100%', height: '100%' },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  heartButton: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  productInfo: { padding: 8, alignItems: 'center' },
  productName: { fontSize: 12, fontFamily: 'Cinzel_600SemiBold', color: '#322916', marginBottom: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ratingText: { fontSize: 10, color: '#5C554F', fontFamily: 'Montserrat_400Regular', marginLeft: 2 },
  sellerName: { fontSize: 10, fontFamily: 'Montserrat_400Regular', color: '#8A8178', marginBottom: 2 },
  productPrice: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },

  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', backgroundColor: '#EEEADDFF',
    borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingVertical: 14, paddingHorizontal: 20,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 20,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, color: '#8A8178', fontFamily: 'Montserrat_600SemiBold', marginTop: 4 },
  navLabelActive: { color: '#2E2A26' },
});

export default ProductBrowseScreen;
