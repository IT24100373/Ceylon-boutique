import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const OrderConfirmationScreen = ({ route, navigation }) => {
  const { order } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="check-circle" size={48} color="#B4725E" />
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
  container: { flex: 1, backgroundColor: '#FFF1E8' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F7D9C4', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 12 },
  subtitle: { fontSize: 16, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', marginBottom: 40, opacity: 0.8 },
  card: { width: '100%', backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#E6C9B9', shadowColor: '#43332E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 5 },
  label: { fontSize: 14, fontFamily: 'InstrumentSans_600SemiBold', color: '#8C7A74', marginBottom: 6 },
  value: { fontSize: 18, fontFamily: 'PlayfairDisplay_600SemiBold', color: '#2A201D' },
  divider: { height: 1, backgroundColor: '#E6C9B9', marginVertical: 16 },
  footer: { padding: 24, paddingBottom: 32 },
  primaryBtn: { backgroundColor: '#B4725E', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },
  secondaryBtn: { backgroundColor: '#F7D9C4', padding: 18, borderRadius: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#B4725E', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },
});

export default OrderConfirmationScreen;
