import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, Alert
} from 'react-native';
import { useCart } from '../context/CartContext';

const CartScreen = ({ navigation }) => {
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart();

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Looks like you haven't added anything yet.</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {cartItems.map((item, index) => (
          <View key={index} style={styles.cartItem}>
            <Image
              source={item.productImage ? { uri: item.productImage } : null}
              style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.productName}
              </Text>
              <Text style={styles.itemVariant}>
                {item.size} | {item.color}
              </Text>
              <Text style={styles.itemPrice}>
                LKR {item.price.toLocaleString()}
              </Text>

              <View style={styles.actionsRow}>
                <View style={styles.qtyBox}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => {
                      if (item.quantity > 1) {
                        updateQuantity(item.product, item.size, item.color, item.quantity - 1);
                      }
                    }}
                  >
                    <Text style={styles.qtyText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.product, item.size, item.color, item.quantity + 1)}
                  >
                    <Text style={styles.qtyText}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => {
                    Alert.alert('Remove Item', 'Are you sure?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => removeFromCart(item.product, item.size, item.color),
                      },
                    ]);
                  }}
                >
                  <Text style={styles.removeText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>LKR {cartTotal.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  scroll: { flex: 1, padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyIcon: { fontSize: 80, marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 10 },
  emptySubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  shopBtn: { backgroundColor: '#8B2635', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 10 },
  shopBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cartItem: {
    flexDirection: 'row', backgroundColor: '#fff', padding: 12,
    borderRadius: 12, marginBottom: 16, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  itemImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f0f0f0', marginRight: 12 },
  itemDetails: { flex: 1, justifyContent: 'space-between' },
  itemName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 4 },
  itemVariant: { fontSize: 13, color: '#666', marginBottom: 6 },
  itemPrice: { fontSize: 16, fontWeight: '800', color: '#8B2635', marginBottom: 8 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 8 },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 18, fontWeight: '600', color: '#333' },
  qtyValue: { width: 30, textAlign: 'center', fontSize: 15, fontWeight: '600', color: '#333' },
  removeBtn: { padding: 6 },
  removeText: { fontSize: 18 },
  footer: {
    backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { fontSize: 18, color: '#666', fontWeight: '600' },
  totalValue: { fontSize: 22, color: '#8B2635', fontWeight: '800' },
  checkoutBtn: { backgroundColor: '#8B2635', padding: 16, borderRadius: 12, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default CartScreen;
