import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import apiClient from '../api/client';
import { useCart } from '../context/CartContext';

const CheckoutScreen = ({ navigation }) => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD or card

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/api/users/profile');
      const userAddrs = response.data.user.addresses || [];
      setAddresses(userAddrs);
      if (userAddrs.length > 0) {
        setSelectedAddressId(userAddrs[0]._id);
      }
    } catch (error) {
      console.log('Error fetching addresses:', error);
      Alert.alert('Error', 'Failed to load your addresses.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert('Error', 'Please select a shipping address.');
      return;
    }

    const selectedAddress = addresses.find((a) => a._id === selectedAddressId);

    const orderData = {
      items: cartItems.map((item) => ({
        product: item.product,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      })),
      shippingAddress: {
        label: selectedAddress.label || 'Home',
        addressLine1: selectedAddress.addressLine1,
        addressLine2: selectedAddress.addressLine2 || '',
        city: selectedAddress.city,
        province: selectedAddress.province,
        postalCode: selectedAddress.postalCode,
      },
      paymentMethod,
    };

    setPlacingOrder(true);
    try {
      const response = await apiClient.post('/api/orders', orderData);
      await clearCart();
      navigation.reset({
        index: 0,
        routes: [
          { name: 'Home' },
          { name: 'OrderConfirmation', params: { order: response.data.order } },
        ],
      });
    } catch (error) {
      console.log('Place order error:', error.response?.data);
      Alert.alert('Checkout Failed', error.response?.data?.message || 'Something went wrong.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B2635" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Shipping Address Section */}
        <Text style={styles.sectionTitle}>Shipping Address</Text>
        {addresses.length === 0 ? (
          <View style={styles.noAddressContainer}>
            <Text style={styles.noAddressText}>You have no saved addresses.</Text>
            <TouchableOpacity
              style={styles.addAddressBtn}
              onPress={() => navigation.navigate('Addresses')}
            >
              <Text style={styles.addAddressBtnText}>Manage Addresses</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((address) => (
            <TouchableOpacity
              key={address._id}
              style={[
                styles.addressCard,
                selectedAddressId === address._id && styles.addressCardSelected,
              ]}
              onPress={() => setSelectedAddressId(address._id)}
            >
              <Text style={styles.addressLabel}>{address.label}</Text>
              <Text style={styles.addressText}>{address.addressLine1}</Text>
              {address.addressLine2 ? <Text style={styles.addressText}>{address.addressLine2}</Text> : null}
              <Text style={styles.addressText}>
                {address.city}, {address.province} {address.postalCode}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {/* Payment Method Section */}
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <TouchableOpacity
          style={[styles.paymentCard, paymentMethod === 'COD' && styles.paymentCardSelected]}
          onPress={() => setPaymentMethod('COD')}
        >
          <Text style={styles.paymentIcon}>💵</Text>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>Cash on Delivery (COD)</Text>
            <Text style={styles.paymentDesc}>Pay with cash when your order arrives.</Text>
          </View>
          <View style={[styles.radio, paymentMethod === 'COD' && styles.radioSelected]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paymentCard, paymentMethod === 'card' && styles.paymentCardSelected]}
          onPress={() => setPaymentMethod('card')}
        >
          <Text style={styles.paymentIcon}>💳</Text>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentTitle}>Credit / Debit Card</Text>
            <Text style={styles.paymentDesc}>Pay securely with your card.</Text>
          </View>
          <View style={[styles.radio, paymentMethod === 'card' && styles.radioSelected]} />
        </TouchableOpacity>

        {/* Order Summary */}
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Items ({cartItems.length})</Text>
            <Text style={styles.summaryText}>LKR {cartTotal.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>Delivery Fee</Text>
            <Text style={styles.summaryText}>LKR 0</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryTotalText}>Total Amount</Text>
            <Text style={styles.summaryTotalValue}>LKR {cartTotal.toLocaleString()}</Text>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, (!selectedAddressId || placingOrder) && styles.placeOrderBtnDisabled]}
          disabled={!selectedAddressId || placingOrder}
          onPress={handlePlaceOrder}
        >
          {placingOrder ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeOrderBtnText}>Place Order (LKR {cartTotal.toLocaleString()})</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#333', marginTop: 10, marginBottom: 12 },
  noAddressContainer: { padding: 20, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center' },
  noAddressText: { fontSize: 15, color: '#666', marginBottom: 12 },
  addAddressBtn: { padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 },
  addAddressBtnText: { color: '#8B2635', fontWeight: '600' },
  addressCard: {
    backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12,
    borderWidth: 2, borderColor: 'transparent', elevation: 1,
  },
  addressCardSelected: { borderColor: '#8B2635', backgroundColor: '#FBE9E7' },
  addressLabel: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 6 },
  addressText: { fontSize: 14, color: '#666', marginBottom: 4 },
  paymentCard: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12,
    marginBottom: 12, alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  paymentCardSelected: { borderColor: '#8B2635', backgroundColor: '#FBE9E7' },
  paymentIcon: { fontSize: 24, marginRight: 12 },
  paymentInfo: { flex: 1 },
  paymentTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 4 },
  paymentDesc: { fontSize: 13, color: '#666' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#ccc' },
  radioSelected: { borderColor: '#8B2635', backgroundColor: '#8B2635', borderWidth: 5 },
  summaryCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryText: { fontSize: 14, color: '#555' },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10, marginTop: 4, marginBottom: 0 },
  summaryTotalText: { fontSize: 16, fontWeight: '700', color: '#333' },
  summaryTotalValue: { fontSize: 18, fontWeight: '800', color: '#8B2635' },
  footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  placeOrderBtn: { backgroundColor: '#8B2635', padding: 16, borderRadius: 12, alignItems: 'center' },
  placeOrderBtnDisabled: { opacity: 0.5 },
  placeOrderBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default CheckoutScreen;
