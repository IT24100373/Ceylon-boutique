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
    if (!product.isPublished) return { text: 'Unpublished', color: '#B4725E', bg: '#FFF5EE' };
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
              <Icon name="package" size={24} color="#8C7A74" />
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
            <Icon name="edit-2" size={14} color="#43332E" style={{ marginRight: 4 }} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.stockBtn]}
            onPress={() => navigation.navigate('ManageStock', { productId: item._id, productName: item.name })}
          >
            <Icon name="bar-chart-2" size={14} color="#43332E" style={{ marginRight: 4 }} />
            <Text style={styles.actionBtnText}>Stock</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, item.isPublished ? styles.unpublishBtn : styles.publishBtn]}
            onPress={() => handleTogglePublish(item._id, item.isPublished)}
          >
            <Icon name={item.isPublished ? "eye-off" : "eye"} size={14} color="#43332E" style={{ marginRight: 4 }} />
            <Text style={styles.actionBtnText}>
              {item.isPublished ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item._id, item.name)}
          >
            <Icon name="trash-2" size={16} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#43332E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Products</Text>
        <View style={{ width: 24 }} />
      </View>

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B4725E" />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Icon name="package" size={40} color="#B4725E" />
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
        <Icon name="plus" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.fabText}>Add Product</Text>
      </TouchableOpacity>
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

  tabBar: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E6C9B9',
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3, borderBottomColor: '#B4725E',
  },
  tabText: { fontSize: 13, color: '#8C7A74', fontFamily: 'InstrumentSans_600SemiBold' },
  activeTabText: { color: '#B4725E', fontFamily: 'InstrumentSans_600SemiBold' },

  listContent: { padding: 16, paddingBottom: 100 },
  productCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  productRow: { flexDirection: 'row', marginBottom: 16 },
  productImage: {
    width: 80, height: 80, borderRadius: 10,
    backgroundColor: '#F8F8F8',
  },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  productInfo: { flex: 1, marginLeft: 14 },
  productName: { fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D', marginBottom: 4 },
  productCategory: { fontSize: 13, color: '#8C7A74', fontFamily: 'InstrumentSans_400Regular', marginBottom: 6 },
  productPrice: { fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold', color: '#B4725E', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  badgeText: { fontSize: 11, fontFamily: 'InstrumentSans_600SemiBold' },
  stockText: { fontSize: 13, color: '#8C7A74', fontFamily: 'InstrumentSans_600SemiBold' },

  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F8F8F8', paddingTop: 14 },
  actionBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    borderRadius: 8, marginHorizontal: 4,
    backgroundColor: '#F8F8F8',
  },
  editBtn: { backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#E6C9B9' },
  stockBtn: { backgroundColor: '#FFF5EE' },
  unpublishBtn: { backgroundColor: '#F8F8F8' },
  publishBtn: { backgroundColor: '#E8F5E9' },
  deleteBtn: { backgroundColor: '#FFEBEE', flex: 0.5 },
  actionBtnText: { fontSize: 13, fontFamily: 'InstrumentSans_600SemiBold', color: '#43332E' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F7D9C4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 8 },
  emptyText: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },

  fab: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: '#B4725E', paddingVertical: 16,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },
});

export default MyProductsScreen;
