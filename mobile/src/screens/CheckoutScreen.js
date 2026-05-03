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
        <ActivityIndicator size="large" color="#EEEADDFF" />
      </View>
    );
  }

  // Payment processing overlay
  if (processingPayment) {
    return (
      <View style={styles.processingOverlay}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.processingCard}>
          <View style={styles.processingIconContainer}>
            <ActivityIndicator size="large" color="#2E2A26" />
          </View>
          <Text style={styles.processingTitle}>Securing Payment</Text>
          <Text style={styles.processingSubtitle}>
            We're processing your transaction securely. Please do not close this screen or navigate away.
          </Text>
        </View>
      </View>
    );
  }

  const isFormReady = selectedAddressId && !placingOrder;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />


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
                  {selectedAddressId === address._id && <Icon name="check-circle" size={18} color="#2E2A26" />}
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
            <Icon name="credit-card" size={22} color="#2E2A26" style={{ marginRight: 10 }} />
            <Text style={styles.paymentBadgeText}>Credit / Debit Card</Text>
          </View>

          {/* ── Card Details Form ── */}
          <View style={styles.cardForm}>
            <Text style={styles.cardFormTitle}>Enter Card Details</Text>

            {/* Card Number */}
            <Text style={styles.fieldLabel}>Card Number</Text>
            <View style={styles.inputContainer}>
              <Icon name="credit-card" size={16} color="#2E2A26" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor="#8A8178"
                keyboardType="numeric"
                value={cardNumber}
                onChangeText={(v) => setCardNumber(formatCardNumber(v))}
                maxLength={19}
              />
            </View>

            {/* Cardholder Name */}
            <Text style={styles.fieldLabel}>Cardholder Name</Text>
            <View style={styles.inputContainer}>
              <Icon name="user" size={16} color="#2E2A26" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Name as on card"
                placeholderTextColor="#8A8178"
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
                  <Icon name="calendar" size={16} color="#2E2A26" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    placeholderTextColor="#8A8178"
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
                  <Icon name="lock" size={16} color="#2E2A26" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="•••"
                    placeholderTextColor="#8A8178"
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
              <Icon name="info" size={14} color="#2E2A26" style={{ marginRight: 6, marginTop: 2 }} />
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
          <View style={styles.footerPriceRow}>
            <View>
              <Text style={styles.footerTotalLabel}>Total Amount</Text>
              <Text style={styles.footerTotalValue}>LKR {cartTotal.toLocaleString()}</Text>
            </View>
            <View style={styles.securePaymentBadge}>
              <Icon name="shield" size={14} color="#8A8178" style={{ marginRight: 6 }} />
              <Text style={styles.secureText}>Secure Payment</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.placeOrderBtn, !isFormReady && styles.placeOrderBtnDisabled]}
            disabled={!isFormReady}
            onPress={handlePlaceOrder}
          >
            {placingOrder ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.placeOrderBtnText}>Pay & Place Order</Text>
                <Icon name="arrow-right" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // Processing overlay
  processingOverlay: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  processingCard: {
    backgroundColor: '#EEEADDFF', padding: 40, borderRadius: 20, alignItems: 'center',
    shadowColor: '#2E2A26', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  processingTitle: { fontSize: 22, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginTop: 24, marginBottom: 8 },
  processingSubtitle: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#8A8178', textAlign: 'center' },

  // Section titles
  sectionTitle: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginTop: 16, marginBottom: 16 },

  // Address
  noAddressContainer: { padding: 24, backgroundColor: '#FFFFFF', borderRadius: 12, alignItems: 'center', },
  noAddressText: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#5C554F', marginBottom: 16 },
  addAddressBtn: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#EEEADDFF', borderRadius: 8 },
  addAddressBtnText: { color: '#5C554F', fontFamily: 'Montserrat_600SemiBold' },
  addressCard: {
    backgroundColor: '#EEEADDFF', padding: 16, borderRadius: 12, marginBottom: 12,

  },
  addressCardSelected: { backgroundColor: '#EEEADDFF' },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addressLabel: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178' },
  addressText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#5C554F', marginBottom: 4, lineHeight: 20 },

  // Payment badge
  paymentBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EEEADDFF',
    borderRadius: 12, padding: 16, marginBottom: 16,
  },
  paymentBadgeText: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },

  // Card form
  cardForm: {
    backgroundColor: '#EEEADDFF', borderRadius: 14, padding: 20, marginBottom: 16,

  },
  cardFormTitle: { fontSize: 18, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 10,
    paddingHorizontal: 14, marginBottom: 16,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, paddingVertical: 12, fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#2E2A26',
  },
  rowInputs: { flexDirection: 'row' },
  demoNote: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12, marginTop: 4,

  },
  demoNoteText: { flex: 1, fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#5C554F', lineHeight: 20 },

  // Summary
  summaryCard: {
    backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16,
    borderWidth: 1, borderColor: '#F0EBE5',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryText: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#5C554F' },
  summaryTotalRow: { paddingTop: 16, marginTop: 8, marginBottom: 0 },
  summaryTotalText: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },
  summaryTotalValue: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },

  // Footer
  footer: {
    backgroundColor: '#FFFFFF', padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 25,
    borderWidth: 1, borderColor: '#F0EBE5',
  },
  footerPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  footerTotalLabel: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#8A8178', textTransform: 'uppercase', letterSpacing: 1 },
  footerTotalValue: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  securePaymentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F6F4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  secureText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178' },
  placeOrderBtn: {
    backgroundColor: '#2E2A26', padding: 18, borderRadius: 16,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  placeOrderBtnDisabled: { backgroundColor: '#A8A19A', shadowOpacity: 0 },
  placeOrderBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginRight: 10 },
});

export default CheckoutScreen;
