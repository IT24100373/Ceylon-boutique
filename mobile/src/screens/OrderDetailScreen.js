import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Image
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

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      const response = await apiClient.get(`/api/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (error) {
      console.log('Error fetching order detail:', error);
      Alert.alert('Error', 'Failed to load order details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.prompt(
      'Cancel Order',
      'Please enter a reason for cancellation:',
      [
        { text: 'Nevermind', style: 'cancel' },
        {
          text: 'Confirm Cancel',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason) {
              Alert.alert('Error', 'Reason is required to cancel.');
              return;
            }
            try {
              setCancelling(true);
              await apiClient.put(`/api/orders/${orderId}/cancel`, { reason });
              Alert.alert('Cancelled', 'Your order has been cancelled.');
              fetchOrder(); // refresh
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel order.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  if (loading || !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B2635" />
      </View>
    );
  }

  const { shippingAddress } = order;

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
          {order.status === 'cancelled' && order.cancellationReason && (
            <Text style={styles.cancelReason}>Reason: {order.cancellationReason}</Text>
          )}
        </View>

        {/* Tracking info if shipped */}
        {order.status === 'shipped' && (order.trackingNumber || order.courierName) && (
          <View style={styles.trackingCard}>
            <Text style={styles.sectionTitle}>Tracking Information</Text>
            {order.courierName ? <Text style={styles.trackingText}>Courier: {order.courierName}</Text> : null}
            {order.trackingNumber ? <Text style={styles.trackingText}>Tracking #: {order.trackingNumber}</Text> : null}
          </View>
        )}

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.itemImageContainer}>
                <Text style={{fontSize: 24}}>🛍️</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
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

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Subtotal</Text>
            <Text style={styles.summaryText}>LKR {order.subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Delivery Fee</Text>
            <Text style={styles.summaryText}>LKR {order.deliveryFee}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalText}>Total</Text>
            <Text style={styles.summaryTotalValue}>LKR {order.totalAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.paymentBox}>
            <Text style={styles.paymentText}>
              Payment: <Text style={{fontWeight: '700'}}>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card'}</Text>
            </Text>
            <Text style={styles.paymentStatusText}>
              Status: {order.paymentStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Cancel Button Footer */}
      {order.status === 'pending' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
            disabled={cancelling}
            onPress={handleCancelOrder}
          >
            {cancelling ? (
              <ActivityIndicator color="#D32F2F" />
            ) : (
              <Text style={styles.cancelBtnText}>Cancel Order</Text>
            )}
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
  cancelReason: { marginTop: 10, fontSize: 14, color: '#D32F2F', fontStyle: 'italic', textAlign: 'center' },
  trackingCard: { backgroundColor: '#F3E5F5', padding: 16, margin: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E1BEE7' },
  trackingText: { fontSize: 15, color: '#4A148C', fontWeight: '600', marginTop: 4 },
  section: { backgroundColor: '#fff', padding: 16, marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 12, marginBottom: 12 },
  itemImageContainer: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  itemVariant: { fontSize: 13, color: '#666' },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#8B2635' },
  addressBox: { backgroundColor: '#f8f8f8', padding: 12, borderRadius: 8 },
  addressLabel: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 4 },
  addressText: { fontSize: 14, color: '#666', marginBottom: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryText: { fontSize: 14, color: '#555' },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12, marginTop: 4, marginBottom: 12 },
  summaryTotalText: { fontSize: 16, fontWeight: '700', color: '#333' },
  summaryTotalValue: { fontSize: 18, fontWeight: '800', color: '#8B2635' },
  paymentBox: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginTop: 8 },
  paymentText: { fontSize: 14, color: '#333', marginBottom: 4 },
  paymentStatusText: { fontSize: 14, color: '#333', fontWeight: '600' },
  footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  cancelBtn: { padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#D32F2F' },
  cancelBtnDisabled: { opacity: 0.5 },
  cancelBtnText: { color: '#D32F2F', fontSize: 16, fontWeight: '700' },
});

export default OrderDetailScreen;
