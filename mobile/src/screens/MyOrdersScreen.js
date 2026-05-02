import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar, Image
} from 'react-native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#D4A853'; // Goldish for pending
    case 'confirmed': return '#5B6939'; // Olive for confirmed
    case 'shipped': return '#1976D2';
    case 'delivered': return '#388E3C';
    case 'cancelled': return '#D32F2F';
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
      activeOpacity={0.8}
    >
      <View style={styles.headerRow}>
        <View style={styles.orderNumberRow}>
          <Icon name="package" size={16} color="#2E2A26" style={{ marginRight: 6 }} />
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15', }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.dateText}>Placed on {new Date(item.createdAt).toLocaleDateString()}</Text>

      <View style={styles.itemsSummary}>
        <Text style={styles.itemsText}>
          {item.items.length} {item.items.length === 1 ? 'Item' : 'Items'}
        </Text>
        <Text style={styles.itemsTotal}>
          LKR {item.totalAmount.toLocaleString()}
        </Text>
      </View>

      <View style={styles.previewImages}>
        {item.items.slice(0, 3).map((cartItem, idx) => (
          <View key={idx} style={styles.previewImageContainer}>
            {cartItem.productImage ? (
              <Image source={{ uri: cartItem.productImage }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <Icon name="image" size={18} color="#2E2A26" />
            )}
          </View>
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
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      

      {loading ? (
        <ActivityIndicator size="large" color="#EEEADDFF" style={{ marginTop: 50 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="package" size={40} color="#2E2A26" />
          </View>
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
  listContainer: { padding: 16 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingBottom: 60 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEEADDFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 12 },
  emptySubtitle: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#8A8178', textAlign: 'center', marginBottom: 32, opacity: 0.8 },
  shopBtn: { backgroundColor: '#EEEADDFF', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8 },
  shopBtnText: { color: '#5C554F', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },

  card: {
    backgroundColor: '#EEEADDFF', borderRadius: 14, padding: 16,
    marginBottom: 16,  
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNumberRow: { flexDirection: 'row', alignItems: 'center' },
  orderNumber: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, },
  statusText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold' },
  dateText: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#5C554F', marginBottom: 16 },

  itemsSummary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#EEEADDFF', padding: 12, borderRadius: 8, marginBottom: 16,
     
  },
  itemsText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#5C554F' },
  itemsTotal: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },

  previewImages: { flexDirection: 'row', alignItems: 'center' },
  previewImageContainer: {
    width: 44, height: 44, borderRadius: 8, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
      overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  moreItemsBadge: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEEADDFF',
    justifyContent: 'center', alignItems: 'center',
  },
  moreItemsText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },
});

export default MyOrdersScreen;
