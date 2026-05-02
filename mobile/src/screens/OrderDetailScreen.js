import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Image, StatusBar
} from 'react-native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#D4A853';
    case 'confirmed': return '#5B6939';
    case 'shipped': return '#1976D2';
    case 'delivered': return '#388E3C';
    case 'cancelled': return '#D32F2F';
    default: return '#8C7A74';
  }
};

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, []);

  const fetchOrder = async () => {
    try {
      const response = await apiClient.get(`/api/orders/${orderId}`);
      const fetchedOrder = response.data.order;
      setOrder(fetchedOrder);
      if (fetchedOrder.status === 'delivered') {
        try {
          const rvRes = await apiClient.get(`/api/reviews/order/${orderId}/status`);
          setReviewStatus(rvRes.data);
        } catch (_) { }
      }
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
              fetchOrder();
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

  const handleConfirmDelivery = () => {
    Alert.alert(
      'Confirm Receipt',
      'Have you received your order? This action cannot be undone.',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, I Received It',
          style: 'default',
          onPress: async () => {
            try {
              setConfirmingDelivery(true);
              await apiClient.put(`/api/orders/${orderId}/confirm-delivery`);
              Alert.alert(
                '🎉 Delivery Confirmed!',
                'Thank you! You can now leave a review for your purchase.',
                [{ text: 'OK', onPress: () => fetchOrder() }]
              );
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to confirm delivery.');
            } finally {
              setConfirmingDelivery(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !order) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
        <ActivityIndicator size="large" color="#B4725E" />
      </View>
    );
  }

  const { shippingAddress } = order;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#43332E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header / Status */}
        <View style={styles.headerCard}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.dateText}>Placed on {new Date(order.createdAt).toLocaleDateString()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15', borderColor: getStatusColor(order.status) + '40' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
          {order.status === 'cancelled' && order.cancellationReason && (
            <Text style={styles.cancelReason}>Reason: {order.cancellationReason}</Text>
          )}
        </View>

        {/* Shipped — confirm receipt banner */}
        {order.status === 'shipped' && (
          <View style={styles.confirmBanner}>
            <Icon name="package" size={28} color="#4A148C" style={{ marginRight: 16 }} />
            <View style={styles.confirmBannerText}>
              <Text style={styles.confirmBannerTitle}>Your order is on the way!</Text>
              <Text style={styles.confirmBannerSubtitle}>
                Once you receive your package, tap "Confirm Receipt" below.
              </Text>
            </View>
          </View>
        )}

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
          <View style={styles.card}>
            {order.items.map((item, idx) => (
              <View key={idx} style={[styles.itemRow, idx === order.items.length - 1 && { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                <View style={styles.itemImageContainer}>
                  {item.productImage ? (
                    <Image source={{ uri: item.productImage }} style={styles.itemImage} resizeMode="cover" />
                  ) : (
                    <Icon name="image" size={24} color="#E6C9B9" />
                  )}
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
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.card}>
            <View style={styles.addressBox}>
              <Text style={styles.addressLabel}>{shippingAddress.label}</Text>
              <Text style={styles.addressText}>{shippingAddress.addressLine1}</Text>
              {shippingAddress.addressLine2 ? <Text style={styles.addressText}>{shippingAddress.addressLine2}</Text> : null}
              <Text style={styles.addressText}>
                {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postalCode}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.card}>
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
                Payment: <Text style={{ fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D' }}>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card'}</Text>
              </Text>
              <Text style={styles.paymentStatusText}>
                Status: {order.paymentStatus.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Review Section */}
        {order.status === 'delivered' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate Your Purchase</Text>
            <View style={styles.card}>
              {order.items.map((item, idx) => {
                const statusItem = reviewStatus?.items?.find(
                  (s) => s.orderItemId === item._id?.toString()
                );
                return (
                  <View key={idx} style={[styles.reviewItemRow, idx === order.items.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <View style={styles.reviewItemInfo}>
                      <Text style={styles.reviewItemName} numberOfLines={1}>
                        {item.productName}
                      </Text>
                      <Text style={styles.reviewItemVariant}>{item.size} · {item.color}</Text>
                    </View>
                    <View style={styles.reviewBtns}>
                      <TouchableOpacity
                        style={[
                          styles.reviewBtn,
                          statusItem?.productReviewed && styles.reviewBtnDone,
                        ]}
                        disabled={statusItem?.productReviewed}
                        onPress={() =>
                          navigation.navigate('ReviewSubmit', {
                            orderId: order._id,
                            orderItem: item,
                            initialReviewType: 'product',
                          })
                        }
                      >
                        <Text style={[
                          styles.reviewBtnText,
                          statusItem?.productReviewed && styles.reviewBtnTextDone,
                        ]}>
                          {statusItem?.productReviewed ? '✓ Product' : 'Rate Product'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.reviewBtn,
                          statusItem?.sellerReviewed && styles.reviewBtnDone,
                        ]}
                        disabled={statusItem?.sellerReviewed}
                        onPress={() =>
                          navigation.navigate('ReviewSubmit', {
                            orderId: order._id,
                            orderItem: item,
                            initialReviewType: 'seller',
                          })
                        }
                      >
                        <Text style={[
                          styles.reviewBtnText,
                          statusItem?.sellerReviewed && styles.reviewBtnTextDone,
                        ]}>
                          {statusItem?.sellerReviewed ? '✓ Seller' : 'Rate Seller'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      {order.status === 'shipped' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.confirmBtn, confirmingDelivery && styles.confirmBtnDisabled]}
            disabled={confirmingDelivery}
            onPress={handleConfirmDelivery}
          >
            {confirmingDelivery ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.confirmBtnText}>Confirm Receipt</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

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
  container: { flex: 1, backgroundColor: '#FFF1E8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF1E8'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF1E8' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  headerCard: {
    backgroundColor: '#FFFFFF', padding: 24, alignItems: 'center',
    borderRadius: 12, borderWidth: 1, borderColor: '#E6C9B9', marginTop: 8,
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  orderNumber: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 6 },
  dateText: { fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 14, fontFamily: 'InstrumentSans_600SemiBold' },
  cancelReason: { marginTop: 12, fontSize: 14, color: '#D32F2F', fontFamily: 'InstrumentSans_400Regular', textAlign: 'center' },

  confirmBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE7F6',
    borderWidth: 1, borderColor: '#B39DDB', borderRadius: 12,
    padding: 16, marginTop: 16,
  },
  confirmBannerText: { flex: 1 },
  confirmBannerTitle: { fontSize: 15, fontFamily: 'InstrumentSans_600SemiBold', color: '#4A148C', marginBottom: 4 },
  confirmBannerSubtitle: { fontSize: 13, fontFamily: 'InstrumentSans_400Regular', color: '#6A1B9A', lineHeight: 18 },

  trackingCard: { backgroundColor: '#F3E5F5', padding: 16, marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E1BEE7' },
  trackingText: { fontSize: 15, color: '#4A148C', fontFamily: 'InstrumentSans_600SemiBold', marginTop: 4 },

  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 12 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },

  itemRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E6C9B9', paddingBottom: 16, marginBottom: 16 },
  itemImageContainer: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#F8F8F8', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: '#E6C9B9', overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%' },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 15, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D', marginBottom: 4 },
  itemVariant: { fontSize: 13, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', marginBottom: 2 },
  itemPrice: { fontSize: 15, fontFamily: 'InstrumentSans_600SemiBold', color: '#B4725E', marginTop: 4 },

  addressBox: { backgroundColor: '#FFFFFF' },
  addressLabel: { fontSize: 15, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D', marginBottom: 6 },
  addressText: { fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', marginBottom: 4, lineHeight: 20 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryText: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#43332E' },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: '#E6C9B9', paddingTop: 16, marginTop: 8, marginBottom: 16 },
  summaryTotalText: { fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D' },
  summaryTotalValue: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: '#B4725E' },

  paymentBox: { backgroundColor: '#FFF5EE', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E6C9B9' },
  paymentText: { fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', marginBottom: 6 },
  paymentStatusText: { fontSize: 14, fontFamily: 'InstrumentSans_600SemiBold', color: '#B4725E' },

  footer: { backgroundColor: '#FFFFFF', padding: 24, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#43332E', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },

  confirmBtn: { backgroundColor: '#388E3C', padding: 18, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },

  cancelBtn: { padding: 18, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#D32F2F', backgroundColor: '#FFFFFF' },
  cancelBtnDisabled: { opacity: 0.5 },
  cancelBtnText: { color: '#D32F2F', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },

  reviewItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E6C9B9' },
  reviewItemInfo: { flex: 1, marginRight: 12 },
  reviewItemName: { fontSize: 14, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D' },
  reviewItemVariant: { fontSize: 13, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', marginTop: 4 },
  reviewBtns: { flexDirection: 'row', gap: 8 },
  reviewBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#B4725E', backgroundColor: '#FFFFFF' },
  reviewBtnDone: { borderColor: '#388E3C', backgroundColor: '#E8F5E9' },
  reviewBtnText: { fontSize: 12, fontFamily: 'InstrumentSans_600SemiBold', color: '#B4725E' },
  reviewBtnTextDone: { color: '#388E3C' },
});

export default OrderDetailScreen;
