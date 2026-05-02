import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, RefreshControl, Alert, Image, StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

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
    if (!product.isPublished) return { text: 'Unpublished', color: '#5C554F', bg: '#EEEADDFF' };
    if (product.totalStock === 0) return { text: 'Out of Stock', color: '#5C554F', bg: '#FFEBEE' };
    return { text: 'Published', color: '#5C554F', bg: '#E8F5E9' };
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
              <Icon name="package" size={24} color="#2E2A26" />
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
            <Icon name="edit-2" size={14} color="#2E2A26" style={{ marginRight: 4 }} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.stockBtn]}
            onPress={() => navigation.navigate('ManageStock', { productId: item._id, productName: item.name })}
          >
            <Icon name="bar-chart-2" size={14} color="#2E2A26" style={{ marginRight: 4 }} />
            <Text style={styles.actionBtnText}>Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, item.isPublished ? styles.unpublishBtn : styles.publishBtn]}
            onPress={() => handleTogglePublish(item._id, item.isPublished)}
          >
            <Icon name={item.isPublished ? "eye-off" : "eye"} size={14} color="#2E2A26" style={{ marginRight: 4 }} />
            <Text style={styles.actionBtnText}>
              {item.isPublished ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item._id, item.name)}
          >
            <Icon name="trash-2" size={16} color="#2E2A26" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />

      

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EEEADDFF" />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Icon name="package" size={40} color="#2E2A26" />
              </View>
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
        <Icon name="plus" size={20} color="#2E2A26" style={{ marginRight: 8 }} />
        <Text style={styles.fabText}>Add Product</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#EEEADDFF',
     
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
  },
  activeTab: {
     
  },
  tabText: { fontSize: 13, color: '#5C554F', fontFamily: 'Montserrat_600SemiBold' },
  activeTabText: { color: '#5C554F', fontFamily: 'Montserrat_600SemiBold' },

  listContent: { padding: 16, paddingBottom: 100 },
  productCard: {
    backgroundColor: '#EEEADDFF', borderRadius: 14, padding: 16,
    marginBottom: 16,  
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  productRow: { flexDirection: 'row', marginBottom: 16 },
  productImage: {
    width: 80, height: 80, borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1, marginLeft: 14 },
  productName: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26', marginBottom: 4 },
  productCategory: { fontSize: 13, color: '#2E2A26', fontFamily: 'Montserrat_400Regular', marginBottom: 6 },
  productPrice: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  badgeText: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold' },
  stockText: { fontSize: 13, color: '#5C554F', fontFamily: 'Montserrat_600SemiBold' },

  actionRow: { flexDirection: 'row',   paddingTop: 14 },
  actionBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    borderRadius: 8, marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#2E2A26',
  },
  editBtn: { backgroundColor: '#EEEADDFF',  },
  stockBtn: { backgroundColor: '#EEEADDFF' },
  unpublishBtn: { backgroundColor: '#EEEADDFF' },
  publishBtn: { backgroundColor: '#EEEADDFF' },
  deleteBtn: { backgroundColor: '#EEEADDFF', flex: 0.5 },
  actionBtnText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEEADDFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 8 },
  emptyText: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#5C554F', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },

  fab: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: '#EEEADDFF', paddingVertical: 16,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    borderWidth: 1, borderColor: '#2E2A26',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#5C554F', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

export default MyProductsScreen;
