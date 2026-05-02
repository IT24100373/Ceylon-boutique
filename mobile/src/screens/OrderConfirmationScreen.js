import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const OrderConfirmationScreen = ({ route, navigation }) => {
  const { order } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="check-circle" size={48} color="#2E2A26" />
        </View>
        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.subtitle}>Thank you for your purchase.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Order Number</Text>
          <Text style={styles.value}>{order.orderNumber}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Total Amount</Text>
          <Text style={styles.value}>LKR {order.totalAmount.toLocaleString()}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Payment Method</Text>
          <Text style={styles.value}>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Credit / Debit Card'}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('OrderDetail', { orderId: order.id || order._id })}
        >
          <Text style={styles.primaryBtnText}>View Order Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 12 },
  subtitle: { fontSize: 16, fontFamily: 'Montserrat_400Regular', color: '#8A8178', marginBottom: 40, opacity: 0.8 },
  card: { width: '100%', backgroundColor: '#EEEADDFF', padding: 24, borderRadius: 16,   shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 5 },
  label: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', marginBottom: 6 },
  value: { fontSize: 18, fontFamily: 'Cinzel_600SemiBold', color: '#2E2A26' },
  divider: { height: 1, backgroundColor: '#EEEADDFF', marginVertical: 16 },
  footer: { padding: 24, paddingBottom: 32 },
  primaryBtn: { backgroundColor: '#EEEADDFF', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: '#5C554F', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  secondaryBtn: { backgroundColor: '#EEEADDFF', padding: 18, borderRadius: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#5C554F', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

export default OrderConfirmationScreen;
