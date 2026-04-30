import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, TextInput, RefreshControl, Image,
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

// -------------------------------------------------------
// Customer — Product Browse Screen (Home)
// Displays product grid with search bar and category chips
// -------------------------------------------------------

const CATEGORIES = [
  'All', 'Saree & Traditional', 'Dresses', 'Tops & Blouses',
  'Pants & Trousers', 'Skirts', "Men's Shirts", "Men's Trousers",
  'Kids Wear', 'Accessories', 'Footwear', 'Other',
];

const ProductBrowseScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    try {
      const params = { page: pageNum, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (activeCategory !== 'All') params.category = activeCategory;

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
  }, [search, activeCategory]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchProducts(1, false);
  }, [activeCategory, fetchProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(1, false);
    setRefreshing(false);
  };

  const handleSearch = () => {
    setLoading(true);
    setPage(1);
    fetchProducts(1, false);
  };

  const loadMore = () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    fetchProducts(page + 1, true);
  };

  const renderProduct = ({ item }) => {
    const isOutOfStock = item.totalStock === 0;
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
        activeOpacity={0.7}
      >
        {/* Product Image */}
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.productImage} />
        ) : (
          <View style={[styles.productImage, styles.noImage]}>
            <Text style={styles.noImageText}>🛍️</Text>
          </View>
        )}

        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>LKR {item.price?.toLocaleString()}</Text>
          <View style={styles.productMeta}>
            {item.averageRating > 0 && (
              <Text style={styles.rating}>⭐ {item.averageRating.toFixed(1)}</Text>
            )}
            {item.seller?.shopName && (
              <Text style={styles.shopName} numberOfLines={1}>{item.seller.shopName}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Welcome Banner */}
      <View style={styles.banner}>
        <Text style={styles.greet}>Hello, {user?.fullName?.split(' ')[0]} 👋</Text>
        <Text style={styles.bannerSub}>Discover authentic Sri Lankan boutique fashion</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
          placeholderTextColor="#999"
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => navigation.navigate('SearchFilter', {
            onApply: (filters) => {
              if (filters.category) setActiveCategory(filters.category);
              setSearch(filters.search || '');
              setLoading(true);
              setPage(1);
              fetchProducts(1, false);
            },
          })}
        >
          <Text style={styles.filterBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Category Chips */}
      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, activeCategory === item && styles.categoryChipActive]}
              onPress={() => setActiveCategory(item)}
            >
              <Text style={[styles.categoryText, activeCategory === item && styles.categoryTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>

      {/* Product Grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B2635" />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>Try adjusting your search or filters.</Text>
            </View>
          )
        }
      />

      {/* Bottom Navigation Quick Links */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  banner: {
    backgroundColor: '#8B2635', paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 14,
  },
  greet: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  searchRow: {
    flexDirection: 'row', paddingHorizontal: 16,
    paddingVertical: 12, alignItems: 'center',
  },
  searchInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 14,
    borderWidth: 1, borderColor: '#e2e8f0', color: '#333',
  },
  searchBtn: {
    marginLeft: 8, backgroundColor: '#8B2635', width: 44, height: 44,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  searchBtnText: { fontSize: 18 },
  filterBtn: {
    marginLeft: 8, backgroundColor: '#fff', width: 44, height: 44,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  filterBtnText: { fontSize: 18 },
  categoryRow: { marginBottom: 8 },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', marginRight: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  categoryChipActive: { backgroundColor: '#8B2635', borderColor: '#8B2635' },
  categoryText: { fontSize: 12, color: '#666', fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  gridContent: { paddingHorizontal: 12, paddingBottom: 70 },
  row: { justifyContent: 'space-between' },
  productCard: {
    backgroundColor: '#fff', borderRadius: 14, width: '48%',
    marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  productImage: {
    width: '100%', height: 160, backgroundColor: '#f1f1f1',
  },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  noImageText: { fontSize: 40 },
  outOfStockBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(211, 47, 47, 0.9)', paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 8,
  },
  outOfStockText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  productInfo: { padding: 10 },
  productName: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 4 },
  productPrice: { fontSize: 15, fontWeight: '800', color: '#8B2635', marginBottom: 4 },
  productMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rating: { fontSize: 11, color: '#F57C00', fontWeight: '600' },
  shopName: { fontSize: 11, color: '#888', flex: 1, textAlign: 'right' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },
  loadingMore: { paddingVertical: 16, alignItems: 'center' },
  loadingMoreText: { color: '#888', fontSize: 13 },
  bottomNav: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
    paddingVertical: 8,
  },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navIcon: { fontSize: 22, marginBottom: 2 },
  navLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
  navLabelActive: { color: '#8B2635' },
});

export default ProductBrowseScreen;
