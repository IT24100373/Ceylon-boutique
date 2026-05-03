import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Image, StatusBar, Modal, TextInput, Platform
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
    default: return '#5C554F';
  }
};

const getTrackerProgress = (status) => {
  if (status === 'cancelled') return 0;
  const progressMap = { 'pending': 0, 'confirmed': 33, 'shipped': 66, 'delivered': 100 };
  return progressMap[status] || 0;
};

const isStepActive = (currentStatus, step) => {
  if (currentStatus === 'cancelled') return false;
  const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
  return statusOrder.indexOf(currentStatus) >= statusOrder.indexOf(step);
};

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [reviewStatus, setReviewStatus] = useState(null);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

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

  const handleCancelOrderClick = () => {
    setCancelReason('');
    setCancelModalVisible(true);
  };

  const submitCancelOrder = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please enter a reason for cancellation.');
      return;
    }
    try {
      setCancelling(true);
      await apiClient.put(`/api/orders/${orderId}/cancel`, { reason: cancelReason.trim() });
      setCancelModalVisible(false);
      Alert.alert('Cancelled', 'Your order has been cancelled.');
      fetchOrder();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
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
        <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
        <ActivityIndicator size="large" color="#2E2A26" />
      </View>
    );
  }

  const { shippingAddress } = order;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusTop}>
              <View>
                <Text style={styles.orderLabel}>Order Tracking</Text>
                <Text style={styles.orderNumber}>#{order.orderNumber?.toUpperCase()}</Text>
                <Text style={styles.orderDate}>Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status.toUpperCase()}</Text>
              </View>
            </View>

            {/* Visual Progress Tracker */}
            <View style={styles.trackerWrapper}>
              <View style={styles.trackerLine} />
              <View style={[styles.trackerLineActive, { width: `${getTrackerProgress(order.status)}%` }]} />
              
              <View style={styles.stepsRow}>
                {['pending', 'confirmed', 'shipped', 'delivered'].map((step, idx) => {
                  const isActive = isStepActive(order.status, step);
                  return (
                    <View key={step} style={styles.stepItem}>
                      <View style={[styles.stepCircle, isActive && styles.stepCircleActive]}>
                        {isActive ? (
                          <Icon name="check" size={12} color="#FFFFFF" />
                        ) : (
                          <View style={styles.stepDotInner} />
                        )}
                      </View>
                      <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                        {step === 'pending' ? 'Placed' : step.charAt(0).toUpperCase() + step.slice(1)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {order.status === 'cancelled' && order.cancellationReason && (
              <View style={styles.cancelNotice}>
                <Icon name="alert-circle" size={16} color="#D32F2F" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cancelNoticeTitle}>Cancellation Reason</Text>
                  <Text style={styles.cancelNoticeText}>{order.cancellationReason}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Delivery Banner */}
          {order.status === 'shipped' && (
            <View style={styles.deliveryBanner}>
              <View style={styles.deliveryIconWrapper}>
                <Icon name="truck" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.deliveryTextWrapper}>
                <Text style={styles.deliveryTitle}>Order is in transit</Text>
                <Text style={styles.deliverySubtitle}>Your package has been dispatched. Track its progress below.</Text>
              </View>
            </View>
          )}

          {/* Tracking info if shipped */}
          {order.status === 'shipped' && (order.trackingNumber || order.courierName) && (
            <View style={styles.trackingSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Logistics</Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.infoCard}>
                {order.courierName && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Courier</Text>
                    <Text style={styles.infoValue}>{order.courierName}</Text>
                  </View>
                )}
                {order.trackingNumber && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tracking ID</Text>
                    <Text style={styles.infoValue}>{order.trackingNumber}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Items Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ordered Items</Text>
              <View style={styles.sectionLine} />
            </View>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.itemCard}>
                <View style={styles.itemContent}>
                  <View style={styles.itemImageContainer}>
                    {item.productImage ? (
                      <Image source={{ uri: item.productImage }} style={styles.itemImage} />
                    ) : (
                      <Icon name="image" size={20} color="#A8A19A" />
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                    <Text style={styles.itemMeta}>{item.size} • {item.color}</Text>
                    <View style={styles.itemPriceQty}>
                      <Text style={styles.itemPrice}>LKR {item.itemTotal.toLocaleString()}</Text>
                      <Text style={styles.itemQty}>QTY: {item.quantity}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Shipping Address Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shipping Address</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Icon name="map-pin" size={18} color="#2E2A26" style={{ marginRight: 8 }} />
                <Text style={styles.addressLabel}>{shippingAddress.label}</Text>
              </View>
              <Text style={styles.addressText}>{shippingAddress.addressLine1}</Text>
              {shippingAddress.addressLine2 ? <Text style={styles.addressText}>{shippingAddress.addressLine2}</Text> : null}
              <Text style={styles.addressSubText}>
                {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postalCode}
              </Text>
            </View>
          </View>

          {/* Order Summary Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>LKR {order.subtotal.toLocaleString()}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>LKR {order.deliveryFee}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalValue}>LKR {order.totalAmount.toLocaleString()}</Text>
              </View>
              <View style={styles.paymentBox}>
                <View style={styles.paymentMethod}>
                  <Icon name={order.paymentMethod === 'COD' ? 'truck' : 'credit-card'} size={14} color="#8A8178" style={{ marginRight: 6 }} />
                  <Text style={styles.paymentMethodText}>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</Text>
                </View>
                <View style={styles.paymentStatus}>
                  <Text style={styles.paymentStatusText}>{order.paymentStatus.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Review Section */}
          {order.status === 'delivered' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Rate Your Experience</Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.reviewCard}>
                {order.items.map((item, idx) => {
                  const statusItem = reviewStatus?.items?.find((s) => s.orderItemId === item._id?.toString());
                  return (
                    <View key={idx} style={[styles.reviewItem, idx !== 0 && styles.reviewDivider]}>
                      <Text style={styles.reviewItemName} numberOfLines={1}>{item.productName}</Text>
                      <View style={styles.reviewBtnGroup}>
                        <TouchableOpacity
                          style={[styles.rateBtn, statusItem?.productReviewed && styles.rateBtnDone]}
                          disabled={statusItem?.productReviewed}
                          onPress={() => navigation.navigate('ReviewSubmit', { orderId: order._id, orderItem: item, initialReviewType: 'product' })}
                        >
                          <Text style={[styles.rateBtnText, statusItem?.productReviewed && styles.rateBtnTextDone]}>
                            {statusItem?.productReviewed ? '✓ Product Rated' : 'Rate Product'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.rateBtn, statusItem?.sellerReviewed && styles.rateBtnDone]}
                          disabled={statusItem?.sellerReviewed}
                          onPress={() => navigation.navigate('ReviewSubmit', { orderId: order._id, orderItem: item, initialReviewType: 'seller' })}
                        >
                          <Text style={[styles.rateBtnText, statusItem?.sellerReviewed && styles.rateBtnTextDone]}>
                            {statusItem?.sellerReviewed ? '✓ Seller Rated' : 'Rate Seller'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Footer Actions */}
        {['pending', 'shipped'].includes(order.status) && (
          <View style={styles.footer}>
            {order.status === 'shipped' && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, confirmingDelivery && styles.disabledBtn]}
                disabled={confirmingDelivery}
                onPress={handleConfirmDelivery}
              >
                {confirmingDelivery ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="check-circle" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
                    <Text style={styles.primaryActionText}>Confirm Receipt</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {order.status === 'pending' && (
              <TouchableOpacity
                style={[styles.secondaryActionBtn, cancelling && styles.disabledBtn]}
                disabled={cancelling}
                onPress={handleCancelOrderClick}
              >
                {cancelling ? (
                  <ActivityIndicator color="#D32F2F" />
                ) : (
                  <Text style={styles.secondaryActionText}>Cancel Order</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Cancel Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={cancelModalVisible}
          onRequestClose={() => setCancelModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cancel Order</Text>
              <Text style={styles.modalSubtitle}>Please provide a reason for cancelling this order.</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="E.g., I changed my mind"
                placeholderTextColor="#A8A19A"
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setCancelModalVisible(false)}>
                  <Text style={styles.modalCloseText}>Dismiss</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmBtn} onPress={submitCancelOrder} disabled={cancelling}>
                  {cancelling ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalConfirmText}>Cancel Order</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  scroll: { flex: 1, paddingHorizontal: 20 },

  statusCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, marginTop: 20, marginBottom: 10,
    borderWidth: 1, borderColor: '#F0EBE5',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5,
  },
  statusTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  orderLabel: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#A8A19A', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  orderNumber: { fontSize: 22, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  orderDate: { fontSize: 12, fontFamily: 'Montserrat_400Regular', color: '#8A8178', marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { fontSize: 11, fontFamily: 'Montserrat_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  trackerWrapper: { marginTop: 10, marginBottom: 5, paddingHorizontal: 5 },
  trackerLine: { position: 'absolute', top: 13, left: 30, right: 30, height: 2, backgroundColor: '#F0EBE5' },
  trackerLineActive: { position: 'absolute', top: 13, left: 30, height: 2, backgroundColor: '#D4A853' },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', width: 60 },
  stepCircle: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#F0EBE5', justifyContent: 'center', alignItems: 'center', zIndex: 1, marginBottom: 8 },
  stepCircleActive: { backgroundColor: '#D4A853', borderColor: '#D4A853' },
  stepDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F0EBE5' },
  stepLabel: { fontSize: 9, fontFamily: 'Montserrat_700Bold', color: '#A8A19A', textTransform: 'uppercase', textAlign: 'center' },
  stepLabelActive: { color: '#2E2A26' },
  
  cancelNotice: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF5F5', padding: 15, borderRadius: 15, marginTop: 20, borderWidth: 1, borderColor: '#FFE3E3' },
  cancelNoticeTitle: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#D32F2F', marginBottom: 4 },
  cancelNoticeText: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#5C554F', lineHeight: 18 },

  deliveryBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F6F4',
    padding: 20, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: '#EEEADD'
  },
  deliveryIconWrapper: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#2E2A26', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  deliveryTextWrapper: { flex: 1 },
  deliveryTitle: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26', marginBottom: 4 },
  deliverySubtitle: { fontSize: 12, fontFamily: 'Montserrat_400Regular', color: '#8A8178', lineHeight: 18 },

  section: { marginVertical: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontFamily: 'Montserrat_700Bold', color: '#2E2A26', textTransform: 'uppercase', letterSpacing: 1, marginRight: 15 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#F0EBE5' },

  trackingSection: { marginBottom: 5 },
  infoCard: { backgroundColor: '#F8F6F4', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#EEEADD' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#8A8178' },
  infoValue: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },

  itemCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#F0EBE5' },
  itemContent: { flexDirection: 'row', alignItems: 'center' },
  itemImageContainer: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F8F6F4', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemImage: { width: '100%', height: '100%', borderRadius: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26', marginBottom: 4 },
  itemMeta: { fontSize: 12, fontFamily: 'Montserrat_400Regular', color: '#8A8178', marginBottom: 6 },
  itemPriceQty: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemPrice: { fontSize: 14, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  itemQty: { fontSize: 11, fontFamily: 'Montserrat_700Bold', color: '#A8A19A' },

  addressCard: { backgroundColor: '#F8F6F4', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#EEEADD' },
  addressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  addressLabel: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#2E2A26', textTransform: 'uppercase', letterSpacing: 1 },
  addressText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', marginBottom: 4, lineHeight: 22 },
  addressSubText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F', marginTop: 4 },

  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#F0EBE5' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#8A8178' },
  summaryValue: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },
  summaryDivider: { height: 1, backgroundColor: '#F0EBE5', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  totalLabel: { fontSize: 16, fontFamily: 'Cinzel_700Bold', color: '#8A8178' },
  totalValue: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  paymentBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F6F4', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#EEEADD' },
  paymentMethod: { flexDirection: 'row', alignItems: 'center' },
  paymentMethodText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },
  paymentStatus: { backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#EEEADD' },
  paymentStatusText: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#2E2A26' },

  reviewCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F0EBE5' },
  reviewItem: { paddingVertical: 15 },
  reviewDivider: { borderTopWidth: 1, borderTopColor: '#F0EBE5' },
  reviewItemName: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26', marginBottom: 12 },
  reviewBtnGroup: { flexDirection: 'row', gap: 10 },
  rateBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F8F6F4', alignItems: 'center', borderWidth: 1, borderColor: '#EEEADD' },
  rateBtnDone: { backgroundColor: '#5B693915', borderColor: '#5B6939' },
  rateBtnText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },
  rateBtnTextDone: { color: '#5B6939' },

  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', 
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 1, borderTopColor: '#F0EBE5',
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 20
  },
  primaryActionBtn: { backgroundColor: '#2E2A26', paddingVertical: 18, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  primaryActionText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  secondaryActionBtn: { backgroundColor: '#FFFFFF', paddingVertical: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#D32F2F' },
  secondaryActionText: { color: '#D32F2F', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  disabledBtn: { opacity: 0.6 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(46, 42, 38, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 22, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 10 },
  modalSubtitle: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#8A8178', marginBottom: 20, lineHeight: 20 },
  modalInput: { backgroundColor: '#F8F6F4', borderRadius: 16, padding: 16, fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', minHeight: 120, marginBottom: 25, borderWidth: 1, borderColor: '#EEEADD', textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCloseBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: '#F8F6F4', alignItems: 'center', borderWidth: 1, borderColor: '#EEEADD' },
  modalCloseText: { color: '#5C554F', fontSize: 15, fontFamily: 'Montserrat_600SemiBold' },
  modalConfirmBtn: { flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: '#D32F2F', alignItems: 'center' },
  modalConfirmText: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Montserrat_600SemiBold' },
});

export default OrderDetailScreen;
