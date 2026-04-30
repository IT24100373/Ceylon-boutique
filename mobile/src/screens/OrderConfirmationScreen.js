import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

const OrderConfirmationScreen = ({ route, navigation }) => {
  const { order } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🎉</Text>
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
          onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
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
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  icon: { fontSize: 50 },
  title: { fontSize: 28, fontWeight: '800', color: '#333', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  card: { width: '100%', backgroundColor: '#f8f8f8', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  label: { fontSize: 14, color: '#666', marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '700', color: '#333' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  footer: { padding: 20 },
  primaryBtn: { backgroundColor: '#8B2635', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#f0f0f0', padding: 16, borderRadius: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#333', fontSize: 16, fontWeight: '700' },
});

export default OrderConfirmationScreen;
