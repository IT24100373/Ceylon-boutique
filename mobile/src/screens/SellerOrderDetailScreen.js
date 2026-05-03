import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, TextInput, StatusBar, Platform
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
    if (!courierName.trim() || !trackingNumber.trim()) {
      Alert.alert('Incomplete', 'Please provide courier and tracking details.');
      return;
    }
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
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#2E2A26" />
      </View>
    );
  }

  const { customer, shippingAddress } = order;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <SafeAreaView style={{ flex: 1 }}>
        

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Order Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryLabel}>Order ID</Text>
                <Text style={styles.summaryOrderNumber}>#{order.orderNumber?.toUpperCase()}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryBottom}>
              <View style={styles.summaryInfoBox}>
                <Icon name="calendar" size={14} color="#8A8178" style={{ marginRight: 6 }} />
                <Text style={styles.summaryInfoText}>{new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
              </View>
              <View style={styles.summaryInfoBox}>
                <Icon name="credit-card" size={14} color="#8A8178" style={{ marginRight: 6 }} />
                <Text style={styles.summaryInfoText}>{order.paymentMethod === 'card' ? 'Online Paid' : 'COD'}</Text>
              </View>
            </View>
          </View>

          {/* Customer Info Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Customer Details</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Icon name="user" size={16} color="#2E2A26" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>{customer?.fullName}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Icon name="mail" size={16} color="#2E2A26" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <Text style={styles.infoValue}>{customer?.email}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrapper}>
                  <Icon name="phone" size={16} color="#2E2A26" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Contact Number</Text>
                  <Text style={styles.infoValue}>{customer?.phone}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* fulfill Items Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Items to Fulfill</Text>
              <View style={styles.sectionLine} />
            </View>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.itemCard}>
                <View style={styles.itemMain}>
                  <View style={styles.itemTextContent}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <View style={styles.itemMetaRow}>
                      <View style={styles.itemBadge}>
                        <Text style={styles.itemBadgeText}>SIZE: {item.size}</Text>
                      </View>
                      <View style={styles.itemBadge}>
                        <Text style={styles.itemBadgeText}>COLOR: {item.color}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.itemQuantityBox}>
                    <Text style={styles.qtyLabel}>QTY</Text>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                  </View>
                </View>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemTotalLabel}>Subtotal</Text>
                  <Text style={styles.itemTotalValue}>LKR {item.itemTotal.toLocaleString()}</Text>
                </View>
              </View>
            ))}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>LKR {order.totalAmount.toLocaleString()}</Text>
            </View>
          </View>

          {/* Shipping Address Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shipping Destination</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Icon name="map-pin" size={18} color="#2E2A26" style={{ marginRight: 8 }} />
                <Text style={styles.addressLabel}>{shippingAddress.label}</Text>
              </View>
              <Text style={styles.addressMainText}>{shippingAddress.addressLine1}</Text>
              {shippingAddress.addressLine2 ? <Text style={styles.addressMainText}>{shippingAddress.addressLine2}</Text> : null}
              <Text style={styles.addressSubText}>
                {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postalCode}
              </Text>
            </View>
          </View>

          {/* Shipping Form for Confirmed Orders */}
          {order.status === 'confirmed' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Shipping Logistics</Text>
                <View style={styles.sectionLine} />
              </View>
              <View style={styles.shipFormCard}>
                <Text style={styles.inputLabel}>Courier Service</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="truck" size={18} color="#A8A19A" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. DHL Express, FedEx"
                    placeholderTextColor="#A8A19A"
                    value={courierName}
                    onChangeText={setCourierName}
                  />
                </View>
                <Text style={styles.inputLabel}>Tracking ID</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="hash" size={18} color="#A8A19A" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter tracking number"
                    placeholderTextColor="#A8A19A"
                    value={trackingNumber}
                    onChangeText={setTrackingNumber}
                  />
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Sticky Action Footer */}
        {['pending', 'confirmed'].includes(order.status) && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.primaryBtn, updating && styles.disabledBtn]}
              disabled={updating}
              onPress={order.status === 'pending' ? handleConfirmOrder : handleShipOrder}
              activeOpacity={0.8}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {order.status === 'pending' ? 'Confirm & Accept Order' : 'Mark as Shipped'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  scroll: { flex: 1, paddingHorizontal: 20 },

  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, marginVertical: 10,
    borderWidth: 1, borderColor: '#F0EBE5',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  summaryLabel: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#A8A19A', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  summaryOrderNumber: { fontSize: 22, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { fontSize: 11, fontFamily: 'Montserrat_700Bold', letterSpacing: 0.5 },
  
  divider: { height: 1, backgroundColor: '#F0EBE5', marginBottom: 15 },
  summaryBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryInfoBox: { flexDirection: 'row', alignItems: 'center' },
  summaryInfoText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },

  section: { marginVertical: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontFamily: 'Montserrat_700Bold', color: '#2E2A26', textTransform: 'uppercase', letterSpacing: 1, marginRight: 15 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#F0EBE5' },

  infoCard: { backgroundColor: '#F8F6F4', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#EEEADD' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoIconWrapper: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#EEEADD' },
  infoLabel: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#A8A19A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  infoValue: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },

  itemCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#F0EBE5' },
  itemMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  itemTextContent: { flex: 1 },
  itemName: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26', marginBottom: 8 },
  itemMetaRow: { flexDirection: 'row' },
  itemBadge: { backgroundColor: '#F8F6F4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 8, borderWidth: 1, borderColor: '#EEEADD' },
  itemBadgeText: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#8A8178' },
  itemQuantityBox: { alignItems: 'center', backgroundColor: '#F8F6F4', padding: 10, borderRadius: 12, width: 60, borderWidth: 1, borderColor: '#EEEADD' },
  qtyLabel: { fontSize: 9, fontFamily: 'Montserrat_700Bold', color: '#A8A19A' },
  qtyValue: { fontSize: 18, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0EBE5', paddingTop: 15 },
  itemTotalLabel: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#8A8178' },
  itemTotalValue: { fontSize: 15, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },

  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingHorizontal: 5 },
  grandTotalLabel: { fontSize: 16, fontFamily: 'Cinzel_700Bold', color: '#8A8178' },
  grandTotalValue: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },

  addressCard: { backgroundColor: '#F8F6F4', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#EEEADD' },
  addressHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  addressLabel: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#2E2A26', textTransform: 'uppercase', letterSpacing: 1 },
  addressMainText: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', marginBottom: 4, lineHeight: 22 },
  addressSubText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F', marginTop: 4 },

  shipFormCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 0 },
  inputLabel: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', marginBottom: 8, marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F6F4', borderRadius: 12, paddingHorizontal: 16, marginBottom: 20, borderWidth: 1, borderColor: '#EEEADD' },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#2E2A26' },

  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: '#FFFFFF', padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1, borderTopColor: '#F0EBE5',
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 20
  },
  primaryBtn: { 
    backgroundColor: '#2E2A26', paddingVertical: 18, borderRadius: 16, alignItems: 'center',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold', letterSpacing: 0.5 },
  disabledBtn: { opacity: 0.6 },
});

export default SellerOrderDetailScreen;
