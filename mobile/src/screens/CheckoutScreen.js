import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, TextInput, KeyboardAvoidingView, Platform, StatusBar
} from 'react-native';
import apiClient from '../api/client';
import { useCart } from '../context/CartContext';
import Icon from 'react-native-vector-icons/Feather';

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------
const formatCardNumber = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

const validateCardDetails = ({ cardNumber, expiryDate, cvv, cardName }) => {
  const digits = cardNumber.replace(/\s/g, '');
  if (digits.length < 13 || digits.length > 16) return 'Please enter a valid card number (13–16 digits).';
  const [mm, yy] = expiryDate.split('/');
  const month = parseInt(mm, 10);
  const year = parseInt(`20${yy}`, 10);
  const now = new Date();
  if (!mm || !yy || month < 1 || month > 12) return 'Please enter a valid expiry date (MM/YY).';
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
    return 'Your card has expired.';
  }
  if (cvv.length < 3) return 'Please enter a valid CVV (3–4 digits).';
  if (cardName.trim().length < 2) return 'Please enter the cardholder name.';
  return null;
};

// -------------------------------------------------------
// Component
// -------------------------------------------------------
const CheckoutScreen = ({ navigation }) => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await apiClient.get('/api/users/addresses');
      const userAddrs = response.data.addresses || [];
      setAddresses(userAddrs);
      if (userAddrs.length > 0) {
        const defaultAddr = userAddrs.find((a) => a.isDefault);
        setSelectedAddressId(defaultAddr ? defaultAddr._id : userAddrs[0]._id);
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

    // Validate card details
    const cardError = validateCardDetails({ cardNumber, expiryDate, cvv, cardName });
    if (cardError) {
      Alert.alert('Invalid Card Details', cardError);
      return;
    }

    const selectedAddress = addresses.find((a) => a._id === selectedAddressId);

    // Step 1: Simulate payment processing
    setProcessingPayment(true);
    await new Promise((resolve) => setTimeout(resolve, 1800)); // 1.8s simulated delay
    setProcessingPayment(false);

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
      paymentMethod: 'card',
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
        <ActivityIndicator size="large" color="#B4725E" />
      </View>
    );
  }

  // Payment processing overlay
  if (processingPayment) {
    return (
      <View style={styles.processingOverlay}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
        <View style={styles.processingCard}>
          <ActivityIndicator size="large" color="#B4725E" />
          <Text style={styles.processingTitle}>Processing Payment</Text>
          <Text style={styles.processingSubtitle}>Please do not close this screen…</Text>
        </View>
      </View>
    );
  }

  const isFormReady = selectedAddressId && !placingOrder;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#43332E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Shipping Address ── */}
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
                <View style={styles.addressHeader}>
                  <Text style={styles.addressLabel}>{address.label}</Text>
                  {selectedAddressId === address._id && <Icon name="check-circle" size={18} color="#B4725E" />}
                </View>
                <Text style={styles.addressText}>{address.addressLine1}</Text>
                {address.addressLine2 ? <Text style={styles.addressText}>{address.addressLine2}</Text> : null}
                <Text style={styles.addressText}>
                  {address.city}, {address.province} {address.postalCode}
                </Text>
              </TouchableOpacity>
            ))
          )}

          {/* ── Payment Method ── */}
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.paymentBadge}>
            <Icon name="credit-card" size={22} color="#B4725E" style={{ marginRight: 10 }} />
            <Text style={styles.paymentBadgeText}>Credit / Debit Card</Text>
          </View>

          {/* ── Card Details Form ── */}
          <View style={styles.cardForm}>
            <Text style={styles.cardFormTitle}>Enter Card Details</Text>

            {/* Card Number */}
            <Text style={styles.fieldLabel}>Card Number</Text>
            <View style={styles.inputContainer}>
              <Icon name="credit-card" size={16} color="#8C7A74" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#A0938E"
                keyboardType="numeric"
                value={cardNumber}
                onChangeText={(v) => setCardNumber(formatCardNumber(v))}
                maxLength={19}
              />
            </View>

            {/* Cardholder Name */}
            <Text style={styles.fieldLabel}>Cardholder Name</Text>
            <View style={styles.inputContainer}>
              <Icon name="user" size={16} color="#8C7A74" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Name as on card"
                placeholderTextColor="#A0938E"
                autoCapitalize="characters"
                value={cardName}
                onChangeText={setCardName}
              />
            </View>

            {/* Expiry + CVV row */}
            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.fieldLabel}>Expiry Date</Text>
                <View style={styles.inputContainer}>
                  <Icon name="calendar" size={16} color="#8C7A74" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#A0938E"
                    keyboardType="numeric"
                    value={expiryDate}
                    onChangeText={(v) => setExpiryDate(formatExpiry(v))}
                    maxLength={5}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>CVV</Text>
                <View style={styles.inputContainer}>
                  <Icon name="lock" size={16} color="#8C7A74" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="•••"
                    placeholderTextColor="#A0938E"
                    keyboardType="numeric"
                    secureTextEntry
                    value={cvv}
                    onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                  />
                </View>
              </View>
            </View>

            {/* Demo note */}
            <View style={styles.demoNote}>
              <Icon name="info" size={14} color="#8B4513" style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={styles.demoNoteText}>
                Demo mode — any valid-format card details are accepted. No real charge is made.
              </Text>
            </View>
          </View>

          {/* ── Order Summary ── */}
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

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.placeOrderBtn, !isFormReady && styles.placeOrderBtnDisabled]}
            disabled={!isFormReady}
            onPress={handlePlaceOrder}
          >
            {placingOrder ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.placeOrderBtnText}>Pay & Place Order</Text>
                <Text style={styles.placeOrderBtnAmount}>LKR {cartTotal.toLocaleString()}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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

  // Processing overlay
  processingOverlay: { flex: 1, backgroundColor: '#FFF1E8', justifyContent: 'center', alignItems: 'center' },
  processingCard: {
    backgroundColor: '#FFFFFF', padding: 40, borderRadius: 20, alignItems: 'center',
    shadowColor: '#43332E', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  processingTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginTop: 24, marginBottom: 8 },
  processingSubtitle: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', textAlign: 'center' },

  // Section titles
  sectionTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginTop: 16, marginBottom: 16 },

  // Address
  noAddressContainer: { padding: 24, backgroundColor: '#FFFFFF', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E6C9B9' },
  noAddressText: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', marginBottom: 16 },
  addAddressBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#F7D9C4', borderRadius: 8 },
  addAddressBtnText: { color: '#B4725E', fontFamily: 'InstrumentSans_600SemiBold' },
  addressCard: {
    backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12,
    borderWidth: 2, borderColor: '#E6C9B9',
  },
  addressCardSelected: { borderColor: '#B4725E', backgroundColor: '#FFF5EE' },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addressLabel: { fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D' },
  addressText: { fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', marginBottom: 4, lineHeight: 20 },

  // Payment badge
  paymentBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF5EE', borderWidth: 1, borderColor: '#B4725E',
    borderRadius: 12, padding: 16, marginBottom: 16,
  },
  paymentBadgeText: { fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold', color: '#B4725E' },

  // Card form
  cardForm: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#E6C9B9',
  },
  cardFormTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontFamily: 'InstrumentSans_600SemiBold', color: '#43332E', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F8F8', borderRadius: 10, borderWidth: 1, borderColor: '#E6C9B9',
    paddingHorizontal: 14, marginBottom: 16,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, paddingVertical: 12, fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#2A201D',
  },
  rowInputs: { flexDirection: 'row' },
  demoNote: {
    flexDirection: 'row', backgroundColor: '#FFF1E8', borderRadius: 8, padding: 12, marginTop: 4,
    borderWidth: 1, borderColor: '#E6C9B9'
  },
  demoNoteText: { flex: 1, fontSize: 13, fontFamily: 'InstrumentSans_400Regular', color: '#8B4513', lineHeight: 20 },

  // Summary
  summaryCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E6C9B9' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryText: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#43332E' },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: '#E6C9B9', paddingTop: 16, marginTop: 8, marginBottom: 0 },
  summaryTotalText: { fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D' },
  summaryTotalValue: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: '#B4725E' },

  // Footer
  footer: {
    backgroundColor: '#FFFFFF', padding: 24, paddingBottom: 32,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#43332E', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10,
  },
  placeOrderBtn: {
    backgroundColor: '#B4725E', padding: 18, borderRadius: 12,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between',
  },
  placeOrderBtnDisabled: { opacity: 0.5 },
  placeOrderBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },
  placeOrderBtnAmount: { color: '#FFFFFF', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold', opacity: 0.9 },
});

export default CheckoutScreen;
