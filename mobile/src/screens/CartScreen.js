import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, Alert, StatusBar
} from 'react-native';
import { useCart } from '../context/CartContext';
import Icon from 'react-native-vector-icons/Feather';

const CartScreen = ({ navigation }) => {
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart();

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
        

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="shopping-bag" size={40} color="#2E2A26" />
          </View>
          <Text style={styles.emptyTitle}>Your bag is empty</Text>
          <Text style={styles.emptySubtitle}>Looks like you haven't added any items to your bag yet.</Text>
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
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {cartItems.map((item, index) => (
          <View key={index} style={styles.cartItem}>
            <View style={styles.imageContainer}>
              {item.productImage ? (
                <Image source={{ uri: item.productImage }} style={styles.itemImage} resizeMode="cover" />
              ) : (
                <Icon name="image" size={24} color="#2E2A26" />
              )}
            </View>

            <View style={styles.itemDetails}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.productName}
                </Text>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => {
                    Alert.alert('Remove Item', 'Are you sure you want to remove this item?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => removeFromCart(item.product, item.size, item.color),
                      },
                    ]);
                  }}
                >
                  <Icon name="x" size={20} color="#2E2A26" />
                </TouchableOpacity>
              </View>

              <Text style={styles.itemVariant}>
                {item.color} · Size {item.size}
              </Text>

              <View style={styles.priceRow}>
                <Text style={styles.itemPrice}>
                  LKR {item.price.toLocaleString()}
                </Text>

                <View style={styles.qtyBox}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => {
                      if (item.quantity > 1) {
                        updateQuantity(item.product, item.size, item.color, item.quantity - 1);
                      }
                    }}
                  >
                    <Icon name="minus" size={16} color="#2E2A26" />
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.product, item.size, item.color, item.quantity + 1)}
                  >
                    <Icon name="plus" size={16} color="#2E2A26" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>LKR {cartTotal.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Icon name="arrow-right" size={20} color="#2E2A26" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', marginTop: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingBottom: 60 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEEADDFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 12 },
  emptySubtitle: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#8A8178', textAlign: 'center', marginBottom: 32, opacity: 0.8 },
  shopBtn: {
    backgroundColor: '#EEEADDFF', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8,
    borderWidth: 1, borderColor: '#2E2A26',
  },
  shopBtnText: { color: '#5C554F', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },

  cartItem: {
    flexDirection: 'row', backgroundColor: '#EEEADDFF', padding: 12,
    borderRadius: 12, marginBottom: 16,
     
  },
  imageContainer: {
    width: 90, height: 110, borderRadius: 8, backgroundColor: '#FFFFFF',
    marginRight: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
  },
  itemImage: { width: '100%', height: '100%' },
  itemDetails: { flex: 1, justifyContent: 'space-between', paddingVertical: 4 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 16, fontFamily: 'Cinzel_600SemiBold', color: '#2E2A26', flex: 1, marginRight: 10 },
  itemVariant: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', marginTop: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  itemPrice: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },

  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEEADDFF', borderRadius: 8,  },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyValue: { width: 30, textAlign: 'center', fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },
  removeBtn: { padding: 4, marginRight: -4, marginTop: -4 },

  footer: {
    backgroundColor: '#EEEADDFF', padding: 24, paddingBottom: 32,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 10,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  totalLabel: { fontSize: 16, fontFamily: 'Montserrat_400Regular', color: '#8A8178' },
  totalValue: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  checkoutBtn: {
    backgroundColor: '#EEEADDFF', padding: 18, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2E2A26',
  },
  checkoutBtnText: { color: '#5C554F', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

export default CartScreen;
