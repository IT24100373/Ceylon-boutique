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
    default: return '#8C7A74';
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
          <Icon name="package" size={16} color="#B4725E" style={{ marginRight: 6 }} />
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15', borderColor: getStatusColor(item.status) + '40' }]}>
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
              <Icon name="image" size={18} color="#E6C9B9" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#43332E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#B4725E" style={{ marginTop: 50 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="package" size={40} color="#B4725E" />
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B4725E" />}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  listContainer: { padding: 16 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingBottom: 60 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F7D9C4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 12 },
  emptySubtitle: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', textAlign: 'center', marginBottom: 32, opacity: 0.8 },
  shopBtn: { backgroundColor: '#B4725E', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8 },
  shopBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNumberRow: { flexDirection: 'row', alignItems: 'center' },
  orderNumber: { fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 12, fontFamily: 'InstrumentSans_600SemiBold' },
  dateText: { fontSize: 13, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', marginBottom: 16 },

  itemsSummary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFF5EE', padding: 12, borderRadius: 8, marginBottom: 16,
    borderWidth: 1, borderColor: '#E6C9B9',
  },
  itemsText: { fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#43332E' },
  itemsTotal: { fontSize: 15, fontFamily: 'InstrumentSans_600SemiBold', color: '#B4725E' },

  previewImages: { flexDirection: 'row', alignItems: 'center' },
  previewImageContainer: {
    width: 44, height: 44, borderRadius: 8, backgroundColor: '#F8F8F8',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
    borderWidth: 1, borderColor: '#E6C9B9', overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  moreItemsBadge: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#F7D9C4',
    justifyContent: 'center', alignItems: 'center',
  },
  moreItemsText: { fontSize: 13, fontFamily: 'InstrumentSans_600SemiBold', color: '#B4725E' },
});

export default MyOrdersScreen;
