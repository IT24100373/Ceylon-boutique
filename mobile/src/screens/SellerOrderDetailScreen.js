import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, TextInput, StatusBar
} from 'react-native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#F57C00';
    case 'confirmed': return '#1976D2';
    case 'shipped': return '#7B1FA2';
    case 'delivered': return '#388E3C';
    case 'cancelled': return '#D32F2F';
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
        <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
        <ActivityIndicator size="large" color="#EEEADDFF" />
      </View>
    );
  }

  const { customer, shippingAddress } = order;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />

      

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header / Status */}
        <View style={styles.headerCard}>
          <View style={styles.orderNumberContainer}>
            <Icon name="file-text" size={24} color="#2E2A26" style={{ marginRight: 8 }} />
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          </View>
          <Text style={styles.dateText}>Placed on {new Date(order.createdAt).toLocaleDateString()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoRow}>
            <Icon name="user" size={16} color="#2E2A26" style={styles.infoIcon} />
            <Text style={styles.infoText}>{customer?.fullName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="mail" size={16} color="#2E2A26" style={styles.infoIcon} />
            <Text style={styles.infoText}>{customer?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="phone" size={16} color="#2E2A26" style={styles.infoIcon} />
            <Text style={styles.infoText}>{customer?.phone}</Text>
          </View>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Icon name="map-pin" size={16} color="#2E2A26" style={{ marginRight: 6 }} />
              <Text style={styles.addressLabel}>{shippingAddress.label}</Text>
            </View>
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
            <View style={styles.inputContainer}>
              <Icon name="truck" size={20} color="#2E2A26" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Courier Name (e.g., DHL, FedEx)"
                placeholderTextColor="#5C554F"
                value={courierName}
                onChangeText={setCourierName}
              />
            </View>
            <View style={styles.inputContainer}>
              <Icon name="hash" size={20} color="#2E2A26" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Tracking Number"
                placeholderTextColor="#5C554F"
                value={trackingNumber}
                onChangeText={setTrackingNumber}
              />
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Action Footer */}
      {order.status === 'pending' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, updating && styles.btnDisabled]}
            disabled={updating}
            onPress={handleConfirmOrder}
          >
            {updating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Confirm Order</Text>}
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
            {updating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Mark as Shipped</Text>}
          </TouchableOpacity>
        </View>
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

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },

  headerCard: { backgroundColor: '#EEEADDFF', padding: 24, alignItems: 'center',   marginBottom: 8 },
  orderNumberContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  orderNumber: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  dateText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#5C554F', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },

  section: { backgroundColor: '#EEEADDFF', padding: 20, marginTop: 12,   },
  sectionTitle: { fontSize: 18, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 16 },

  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoIcon: { width: 24 },
  infoText: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#5C554F', flex: 1 },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',   paddingBottom: 16, marginBottom: 16 },
  itemDetails: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26', marginBottom: 6 },
  itemVariant: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', marginBottom: 2 },
  itemPrice: { fontSize: 16, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },

  addressBox: { backgroundColor: '#EEEADDFF', padding: 16, borderRadius: 10,  },
  addressLabel: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178' },
  addressText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#5C554F', marginBottom: 4, lineHeight: 20 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',   borderRadius: 10, paddingHorizontal: 14, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#2E2A26' },

  footer: { backgroundColor: '#FFFFFF', padding: 20,  },
  primaryBtn: { backgroundColor: '#EEEADDFF', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2E2A26' },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#5C554F', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

export default SellerOrderDetailScreen;
