import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import apiClient from '../api/client';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#F57C00';
    case 'confirmed': return '#1976D2';
    case 'shipped': return '#7B1FA2';
    case 'delivered': return '#388E3C';
    case 'cancelled': return '#D32F2F';
    default: return '#666';
  }
};

const MyOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/api/orders/my-orders');
      setOrders(response.data.orders);
    } catch (error) {
      console.log('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch when screen focuses
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
    >
      <View style={styles.headerRow}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.dateText}>Placed on {new Date(item.createdAt).toLocaleDateString()}</Text>
      
      <View style={styles.itemsSummary}>
        <Text style={styles.itemsText}>
          {item.items.length} {item.items.length === 1 ? 'item' : 'items'} • LKR {item.totalAmount.toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.previewImages}>
        {item.items.slice(0, 3).map((cartItem, idx) => (
          cartItem.productImage ? (
            <View key={idx} style={styles.previewImageContainer}>
              <Text style={{fontSize: 20}}>🖼️</Text>
            </View>
          ) : (
            <View key={idx} style={styles.previewImageContainer}>
              <Text style={{fontSize: 20}}>🛍️</Text>
            </View>
          )
        ))}
        {item.items.length > 3 && (
          <View style={styles.moreItemsBadge}>
            <Text style={styles.moreItemsText}>+{item.items.length - 3}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#8B2635" style={{ marginTop: 50 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>You haven't placed any orders.</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  listContainer: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 10 },
  emptySubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  shopBtn: { backgroundColor: '#8B2635', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 10 },
  shopBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    marginBottom: 16, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNumber: { fontSize: 16, fontWeight: '700', color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '800' },
  dateText: { fontSize: 13, color: '#666', marginBottom: 12 },
  itemsSummary: { backgroundColor: '#f8f8f8', padding: 10, borderRadius: 8, marginBottom: 12 },
  itemsText: { fontSize: 14, fontWeight: '600', color: '#333' },
  previewImages: { flexDirection: 'row', alignItems: 'center' },
  previewImageContainer: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0f0f0',
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  moreItemsBadge: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0',
    justifyContent: 'center', alignItems: 'center',
  },
  moreItemsText: { fontSize: 12, fontWeight: '700', color: '#555' },
});

export default MyOrdersScreen;
