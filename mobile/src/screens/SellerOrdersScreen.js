import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar, Platform
} from 'react-native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#D4A853'; // Goldish
    case 'confirmed': return '#5B6939'; // Olive
    case 'shipped': return '#1976D2'; // Blue
    case 'delivered': return '#388E3C'; // Green
    case 'cancelled': return '#D32F2F'; // Red
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
      activeOpacity={0.9}
    >
      <View style={styles.cardTop}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Order ID</Text>
          <Text style={styles.orderNumber}>#{item.orderNumber?.substring(0, 8).toUpperCase()}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardMiddle}>
        <View style={styles.customerBox}>
          <Text style={styles.infoLabel}>Customer</Text>
          <Text style={styles.customerName}>{item.customer?.fullName || 'Unknown Customer'}</Text>
        </View>
        <View style={styles.dateBox}>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Total Earnings</Text>
          <Text style={styles.amountText}>LKR {item.totalAmount.toLocaleString()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => navigation.navigate('SellerOrderDetail', { orderId: item._id })}
        >
          <Text style={styles.actionBtnText}>Manage Order</Text>
          <Icon name="arrow-right" size={14} color="#5C554F" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <SafeAreaView style={{ flex: 1 }}>
        

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E2A26" />
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="clipboard" size={40} color="#2E2A26" />
            </View>
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>Your products are waiting for their first admirers. They will appear here once purchased.</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E2A26" />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  headerRightBtn: { padding: 4 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: 20, paddingBottom: 40 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyIconCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#F8F6F4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    borderWidth: 1, borderColor: '#EEEADD',
  },
  emptyTitle: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 12 },
  emptySubtitle: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#8A8178', textAlign: 'center', lineHeight: 24 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: '#F0EBE5',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  orderInfo: { flex: 1 },
  orderLabel: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1.5 },
  orderNumber: { fontSize: 16, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { fontSize: 11, fontFamily: 'Montserrat_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  divider: { height: 1, backgroundColor: '#F0EBE5', marginBottom: 16 },
  
  cardMiddle: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  customerBox: { flex: 1 },
  dateBox: { flex: 0.4, alignItems: 'flex-end' },
  infoLabel: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold', color: '#A8A19A', marginBottom: 4, textTransform: 'uppercase' },
  customerName: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },
  dateText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },
  
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  amountBox: { flex: 1 },
  amountLabel: { fontSize: 10, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', marginBottom: 2, textTransform: 'uppercase' },
  amountText: { fontSize: 18, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  
  actionBtn: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#F8F6F4', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
    borderWidth: 1, borderColor: '#EEEADD',
  },
  actionBtnText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F', marginRight: 6 },
});

export default SellerOrdersScreen;
