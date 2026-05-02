import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar
} from 'react-native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#F57C00';
    case 'confirmed': return '#1976D2';
    case 'shipped': return '#7B1FA2';
    case 'delivered': return '#388E3C';
    case 'cancelled': return '#D32F2F';
    default: return '#5C554F';
  }
};

const SellerOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/api/orders/seller/my-orders');
      setOrders(response.data.orders);
    } catch (error) {
      console.log('Error fetching seller orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
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
      onPress={() => navigation.navigate('SellerOrderDetail', { orderId: item._id })}
    >
      <View style={styles.headerRow}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.customerText}>Customer: <Text style={styles.customerName}>{item.customer?.fullName || 'Unknown'}</Text></Text>
      <Text style={styles.dateText}>Date: {new Date(item.createdAt).toLocaleDateString()}</Text>

      <View style={styles.itemsSummary}>
        <Text style={styles.itemsText}>
          {item.items.length} {item.items.length === 1 ? 'item' : 'items'} • LKR {item.totalAmount.toLocaleString()}
        </Text>
        <Icon name="chevron-right" size={16} color="#2E2A26" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />

      

      {loading ? (
        <ActivityIndicator size="large" color="#EEEADDFF" style={{ marginTop: 50 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="clipboard" size={40} color="#2E2A26" />
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>You don't have any incoming orders.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EEEADDFF" />}
          showsVerticalScrollIndicator={false}
        />
      )}
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

  listContainer: { padding: 16, paddingBottom: 40 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: -50 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEEADDFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#8A8178', textAlign: 'center' },

  card: {
    backgroundColor: '#EEEADDFF', borderRadius: 14, padding: 20,
    marginBottom: 16,  
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderNumber: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold' },

  customerText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#5C554F', marginBottom: 4 },
  customerName: { fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },
  dateText: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#5C554F', marginBottom: 16 },

  itemsSummary: { backgroundColor: '#EEEADDFF', padding: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',  },
  itemsText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },
});

export default SellerOrdersScreen;
