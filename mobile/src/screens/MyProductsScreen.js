import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, RefreshControl, Alert, Image, StatusBar, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/FontAwesome';
import FeatherIcon from 'react-native-vector-icons/Feather';

// -------------------------------------------------------
// Seller — My Products Screen (Redesigned)
// Lists all seller's products with a premium boutique feel
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
      'Remove Product',
      `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/products/${productId}`);
              Alert.alert('Success', 'Product removed from collection.');
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
      Alert.alert('Error', error.response?.data?.message || 'Failed to update product visibility.');
    }
  };

  const tabs = [
    { key: 'all', label: 'All', count: stats.all },
    { key: 'published', label: 'Live', count: stats.published },
    { key: 'unpublished', label: 'Hidden', count: stats.unpublished },
    { key: 'out_of_stock', label: 'Out', count: stats.outOfStock },
  ];

  const getStatusBadge = (product) => {
    if (!product.isPublished) return { text: 'Hidden', color: '#8A8178', bg: '#F8F6F4' };
    if (product.totalStock === 0) return { text: 'Out of Stock', color: '#D32F2F', bg: '#FFEBEE' };
    return { text: 'Live', color: '#2E7D32', bg: '#E8F5E9' };
  };

  const renderProduct = ({ item }) => {
    const badge = getStatusBadge(item);
    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <View style={styles.imageContainer}>
            {item.images && item.images.length > 0 ? (
              <Image source={{ uri: item.images[0] }} style={styles.productImage} />
            ) : (
              <FeatherIcon name="package" size={24} color="#A8A19A" />
            )}
          </View>
          <View style={styles.productInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
              </View>
            </View>
            <Text style={styles.productCategory}>{item.category}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.productPrice}>LKR {item.price?.toLocaleString()}</Text>
              <Text style={styles.stockText}>{item.totalStock} in stock</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('EditProduct', { productId: item._id })}
          >
            <FeatherIcon name="edit-2" size={14} color="#2E2A26" />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('ManageStock', { productId: item._id, productName: item.name })}
          >
            <FeatherIcon name="layers" size={14} color="#2E2A26" />
            <Text style={styles.actionBtnText}>Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleTogglePublish(item._id, item.isPublished)}
          >
            <FeatherIcon name={item.isPublished ? "eye-off" : "eye"} size={14} color="#2E2A26" />
            <Text style={styles.actionBtnText}>{item.isPublished ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item._id, item.name)}
          >
            <FeatherIcon name="trash-2" size={14} color="#D32F2F" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <SafeAreaView style={{ flex: 1 }}>
        

        <View style={styles.tabContainer}>
          <View style={styles.tabBar}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View style={[styles.countBadge, activeTab === tab.key && styles.activeCountBadge]}>
                    <Text style={[styles.countText, activeTab === tab.key && styles.activeCountText]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A853" />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <FeatherIcon name="package" size={32} color="#D4A853" />
                </View>
                <Text style={styles.emptyTitle}>No Products Found</Text>
                <Text style={styles.emptyText}>
                  {activeTab === 'all'
                    ? 'Your collection is empty. Begin by adding your first masterpiece.'
                    : 'No products match your current selection.'}
                </Text>
              </View>
            )
          }
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('AddProduct')}
            activeOpacity={0.9}
          >
            <FeatherIcon name="plus" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
            <Text style={styles.fabText}>Add New Product</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  headerTitle: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8F6F4', justifyContent: 'center', alignItems: 'center' },

  tabContainer: { paddingHorizontal: 20, marginBottom: 10 },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#F8F6F4', borderRadius: 16, padding: 4, marginTop: 20,
  },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', borderRadius: 12,
  },
  activeTab: { backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontSize: 12, color: '#8A8178', fontFamily: 'Montserrat_600SemiBold' },
  activeTabText: { color: '#2E2A26' },
  countBadge: { marginLeft: 6, backgroundColor: '#EEEADD', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  activeCountBadge: { backgroundColor: '#2E2A26' },
  countText: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#8A8178' },
  activeCountText: { color: '#FFFFFF' },

  listContent: { padding: 20, paddingBottom: 100 },
  productCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#F0EBE5',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  productHeader: { flexDirection: 'row', alignItems: 'center' },
  imageContainer: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#F8F6F4', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  productImage: { width: '100%', height: '100%' },
  productInfo: { flex: 1, marginLeft: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  productName: { fontSize: 15, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontFamily: 'Montserrat_700Bold', textTransform: 'uppercase' },
  productCategory: { fontSize: 12, color: '#8A8178', fontFamily: 'Montserrat_400Regular', marginBottom: 8 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  productPrice: { fontSize: 15, fontFamily: 'Montserrat_700Bold', color: '#D4A853' },
  stockText: { fontSize: 11, color: '#8A8178', fontFamily: 'Montserrat_600SemiBold' },

  divider: { height: 1, backgroundColor: '#F0EBE5', marginVertical: 16 },

  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#2E2A26',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  deleteBtn: { flex: 0.4, borderColor: '#FFEBEE', backgroundColor: '#FFEBEE' },
  actionBtnText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F8F6F4', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#8A8178', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F0EBE5',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  fab: {
    backgroundColor: '#2E2A26', height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8,
  },
  fabText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

export default MyProductsScreen;
