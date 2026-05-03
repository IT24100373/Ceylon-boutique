import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, ScrollView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const OrderConfirmationScreen = ({ route, navigation }) => {
  const { order } = route.params;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.successIconWrapper}>
            <View style={styles.iconCircleOuter}>
              <View style={styles.iconCircleInner}>
                <Icon name="check" size={40} color="#FFFFFF" />
              </View>
            </View>
          </View>

          <Text style={styles.title}>Thank You!</Text>
          <Text style={styles.subtitle}>Your order has been placed successfully and is being processed.</Text>

          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumberLabel}>Order Number</Text>
              <Text style={styles.orderNumberValue}>#{order.orderNumber?.toUpperCase()}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Amount</Text>
              <Text style={styles.infoValue}>LKR {order.totalAmount.toLocaleString()}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment</Text>
              <Text style={styles.infoValue}>{order.paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}</Text>
            </View>

            <View style={styles.statusBox}>
              <Icon name="clock" size={16} color="#D4A853" style={{ marginRight: 8 }} />
              <Text style={styles.statusText}>Expected delivery within 3-5 business days</Text>
            </View>
          </View>

          <Text style={styles.footerNote}>
            A confirmation email has been sent to your registered address.
          </Text>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('OrderDetail', { orderId: order.id || order._id })}
          >
            <Text style={styles.primaryBtnText}>Track Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { alignItems: 'center', padding: 30, paddingTop: 60 },
  
  successIconWrapper: { marginBottom: 30 },
  iconCircleOuter: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#F8F6F4',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#EEEADD',
  },
  iconCircleInner: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#2E2A26',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10,
  },

  title: { fontSize: 32, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#8A8178', textAlign: 'center', lineHeight: 24, paddingHorizontal: 10, marginBottom: 40 },

  orderCard: {
    width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#F0EBE5',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5,
  },
  orderHeader: { alignItems: 'center', marginBottom: 20 },
  orderNumberLabel: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#A8A19A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  orderNumberValue: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  
  divider: { height: 1, backgroundColor: '#F0EBE5', marginBottom: 20 },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  infoLabel: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#8A8178' },
  infoValue: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },
  
  statusBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDFCFB',
    padding: 14, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#EEEADD'
  },
  statusText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },

  footerNote: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#A8A19A', textAlign: 'center', marginTop: 30, lineHeight: 20 },

  buttonContainer: { padding: 30, paddingBottom: Platform.OS === 'ios' ? 40 : 30 },
  primaryBtn: { 
    backgroundColor: '#2E2A26', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 15,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  secondaryBtn: { backgroundColor: '#F8F6F4', paddingVertical: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EEEADD' },
  secondaryBtnText: { color: '#5C554F', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

export default OrderConfirmationScreen;
