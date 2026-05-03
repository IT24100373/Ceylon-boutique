import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar, Image, Platform
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
        <View style={styles.middleTextGroup}>
          <Text style={styles.dateLabel}>Date Placed</Text>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        <View style={styles.middleTextGroupRight}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.itemsTotal}>LKR {item.totalAmount.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.previewImages}>
          {item.items.slice(0, 3).map((cartItem, idx) => (
            <View key={idx} style={[styles.previewImageContainer, { zIndex: 3 - idx, marginLeft: idx === 0 ? 0 : -15 }]}>
              {cartItem.productImage ? (
                <Image source={{ uri: cartItem.productImage }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <Icon name="image" size={18} color="#8A8178" />
              )}
            </View>
          ))}
          {item.items.length > 3 && (
            <View style={[styles.moreItemsBadge, { zIndex: 0, marginLeft: -15 }]}>
              <Text style={styles.moreItemsText}>+{item.items.length - 3}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.viewDetailsBtn}
          onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Icon name="arrow-right" size={14} color="#5C554F" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      
      <SafeAreaView style={{ flex: 1 }}>
        {/* Custom Header */}
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E2A26" />
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="shopping-bag" size={40} color="#2E2A26" />
            </View>
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>
              Experience the finest collection of Ceylon. Your future purchases will appear here.
            </Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
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
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
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
  emptySubtitle: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#8A8178', textAlign: 'center', marginBottom: 36, lineHeight: 24 },
  shopBtn: { 
    backgroundColor: '#2E2A26', paddingHorizontal: 40, paddingVertical: 18, borderRadius: 12,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 
  },
  shopBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    marginBottom: 20,
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
  middleTextGroup: { flex: 1 },
  middleTextGroupRight: { flex: 1, alignItems: 'flex-end' },
  dateLabel: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', marginBottom: 4, textTransform: 'uppercase' },
  dateText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },
  totalLabel: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', marginBottom: 4, textTransform: 'uppercase' },
  itemsTotal: { fontSize: 16, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewImages: { flexDirection: 'row', alignItems: 'center' },
  previewImageContainer: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8F6F4',
    justifyContent: 'center', alignItems: 'center', 
    borderWidth: 2, borderColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  previewImage: { width: '100%', height: '100%' },
  moreItemsBadge: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0EBE5',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  moreItemsText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },
  
  viewDetailsBtn: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#F8F6F4', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
    borderWidth: 1, borderColor: '#EEEADD',
  },
  viewDetailsText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F', marginRight: 6 },
});

export default MyOrdersScreen;
