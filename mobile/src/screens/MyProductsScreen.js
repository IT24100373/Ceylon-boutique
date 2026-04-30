import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, RefreshControl, Alert, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';

// -------------------------------------------------------
// Seller — My Products Screen
// Lists all seller's products with status badges and actions
// -------------------------------------------------------
const MyProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ all: 0, published: 0, unpublished: 0, outOfStock: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async (status) => {
    try {
      const params = {};
      if (status && status !== 'all') params.status = status;
      const response = await apiClient.get('/api/products/seller/my-products', { params });
      setProducts(response.data.products);
      setStats(response.data.stats);
    } catch (error) {
      console.log('Fetch products error:', error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProducts(activeTab);
    }, [activeTab, fetchProducts])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(activeTab);
    setRefreshing(false);
  };

  const handleDelete = (productId, productName) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/products/${productId}`);
              Alert.alert('Success', 'Product deleted successfully.');
              fetchProducts(activeTab);
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete product.');
            }
          },
        },
      ]
    );
  };

  const handleTogglePublish = async (productId, isPublished) => {
    try {
      const endpoint = isPublished ? 'unpublish' : 'republish';
      await apiClient.put(`/api/products/${productId}/${endpoint}`);
      fetchProducts(activeTab);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update product.');
    }
  };

  const tabs = [
    { key: 'all', label: 'All', count: stats.all },
    { key: 'published', label: 'Live', count: stats.published },
    { key: 'unpublished', label: 'Hidden', count: stats.unpublished },
    { key: 'out_of_stock', label: 'No Stock', count: stats.outOfStock },
  ];

  const getStatusBadge = (product) => {
    if (!product.isPublished) return { text: 'Unpublished', color: '#F57C00', bg: '#FFF3E0' };
    if (product.totalStock === 0) return { text: 'Out of Stock', color: '#D32F2F', bg: '#FFEBEE' };
    return { text: 'Published', color: '#2E7D32', bg: '#E8F5E9' };
  };

  const renderProduct = ({ item }) => {
    const badge = getStatusBadge(item);
    return (
      <View style={styles.productCard}>
        {/* Product Image */}
        <View style={styles.productRow}>
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.noImage]}>
              <Text style={styles.noImageText}>📦</Text>
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.productCategory}>{item.category}</Text>
            <Text style={styles.productPrice}>LKR {item.price?.toLocaleString()}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
              </View>
              <Text style={styles.stockText}>Stock: {item.totalStock}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => navigation.navigate('EditProduct', { productId: item._id })}
          >
            <Text style={styles.actionBtnText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.stockBtn]}
            onPress={() => navigation.navigate('ManageStock', { productId: item._id, productName: item.name })}
          >
            <Text style={styles.actionBtnText}>📊 Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, item.isPublished ? styles.unpublishBtn : styles.publishBtn]}
            onPress={() => handleTogglePublish(item._id, item.isPublished)}
          >
            <Text style={styles.actionBtnText}>
              {item.isPublished ? '🔒 Hide' : '🔓 Show'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item._id, item.name)}
          >
            <Text style={[styles.actionBtnText, { color: '#D32F2F' }]}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Product List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={renderProduct}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B2635" />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'all'
                  ? 'Tap the button below to add your first product!'
                  : 'No products match this filter.'}
              </Text>
            </View>
          )
        }
      />

      {/* Add Product FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+ Add Product</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3, borderBottomColor: '#8B2635',
  },
  tabText: { fontSize: 12, color: '#888', fontWeight: '600' },
  activeTabText: { color: '#8B2635', fontWeight: '800' },
  listContent: { padding: 16, paddingBottom: 80 },
  productCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0',
  },
  productRow: { flexDirection: 'row', marginBottom: 12 },
  productImage: {
    width: 80, height: 80, borderRadius: 10,
    backgroundColor: '#f1f1f1',
  },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  noImageText: { fontSize: 30 },
  productInfo: { flex: 1, marginLeft: 12 },
  productName: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 3 },
  productCategory: { fontSize: 12, color: '#888', marginBottom: 3 },
  productPrice: { fontSize: 16, fontWeight: '800', color: '#8B2635', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginRight: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  stockText: { fontSize: 12, color: '#666' },
  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10 },
  actionBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: 8, marginHorizontal: 3,
    backgroundColor: '#f5f5f5',
  },
  editBtn: { backgroundColor: '#E3F2FD' },
  stockBtn: { backgroundColor: '#FFF8E1' },
  unpublishBtn: { backgroundColor: '#FFF3E0' },
  publishBtn: { backgroundColor: '#E8F5E9' },
  deleteBtn: { backgroundColor: '#FFEBEE', flex: 0.6 },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#333' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', paddingHorizontal: 30 },
  fab: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: '#8B2635', paddingVertical: 16,
    borderRadius: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default MyProductsScreen;
