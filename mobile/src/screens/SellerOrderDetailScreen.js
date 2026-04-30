import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, TextInput
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

const SellerOrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // For shipping
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      const response = await apiClient.get(`/api/orders/seller/${orderId}`);
      setOrder(response.data.order);
    } catch (error) {
      console.log('Error fetching order detail:', error);
      Alert.alert('Error', 'Failed to load order details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    Alert.alert('Confirm Order', 'Are you sure you want to confirm this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setUpdating(true);
            await apiClient.put(`/api/orders/seller/${orderId}/confirm`);
            Alert.alert('Success', 'Order confirmed.');
            fetchOrder();
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to confirm order.');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const handleShipOrder = async () => {
    try {
      setUpdating(true);
      await apiClient.put(`/api/orders/seller/${orderId}/ship`, {
        courierName,
        trackingNumber,
      });
      Alert.alert('Success', 'Order marked as shipped.');
      fetchOrder();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to ship order.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B2635" />
      </View>
    );
  }

  const { customer, shippingAddress } = order;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header / Status */}
        <View style={styles.headerCard}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.dateText}>Placed on {new Date(order.createdAt).toLocaleDateString()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <Text style={styles.infoText}>Name: {customer?.fullName}</Text>
          <Text style={styles.infoText}>Email: {customer?.email}</Text>
          <Text style={styles.infoText}>Phone: {customer?.phone}</Text>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items to Fulfill</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemVariant}>Size: {item.size} | Color: {item.color}</Text>
                <Text style={styles.itemVariant}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>LKR {item.itemTotal.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>{shippingAddress.label}</Text>
            <Text style={styles.addressText}>{shippingAddress.addressLine1}</Text>
            {shippingAddress.addressLine2 ? <Text style={styles.addressText}>{shippingAddress.addressLine2}</Text> : null}
            <Text style={styles.addressText}>
              {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postalCode}
            </Text>
          </View>
        </View>

        {/* Ship Form if Confirmed */}
        {order.status === 'confirmed' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Details (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Courier Name (e.g., DHL, FedEx)"
              value={courierName}
              onChangeText={setCourierName}
            />
            <TextInput
              style={styles.input}
              placeholder="Tracking Number"
              value={trackingNumber}
              onChangeText={setTrackingNumber}
            />
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Action Footer */}
      {order.status === 'pending' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, updating && styles.btnDisabled]}
            disabled={updating}
            onPress={handleConfirmOrder}
          >
            {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Confirm Order</Text>}
          </TouchableOpacity>
        </View>
      )}

      {order.status === 'confirmed' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, updating && styles.btnDisabled]}
            disabled={updating}
            onPress={handleShipOrder}
          >
            {updating ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Mark as Shipped</Text>}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  headerCard: { backgroundColor: '#fff', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  orderNumber: { fontSize: 22, fontWeight: '800', color: '#333', marginBottom: 4 },
  dateText: { fontSize: 14, color: '#666', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 14, fontWeight: '800' },
  section: { backgroundColor: '#fff', padding: 16, marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  infoText: { fontSize: 15, color: '#555', marginBottom: 6 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 12, marginBottom: 12 },
  itemDetails: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  itemVariant: { fontSize: 14, color: '#666' },
  itemPrice: { fontSize: 16, fontWeight: '700', color: '#8B2635' },
  addressBox: { backgroundColor: '#f8f8f8', padding: 12, borderRadius: 8 },
  addressLabel: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 4 },
  addressText: { fontSize: 14, color: '#666', marginBottom: 2 },
  input: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, fontSize: 15, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  primaryBtn: { backgroundColor: '#8B2635', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default SellerOrderDetailScreen;
