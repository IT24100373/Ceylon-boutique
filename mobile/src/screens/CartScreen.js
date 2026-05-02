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
        <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={24} color="#43332E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shopping Bag</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="shopping-bag" size={40} color="#B4725E" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#43332E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Bag</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {cartItems.map((item, index) => (
          <View key={index} style={styles.cartItem}>
            <View style={styles.imageContainer}>
              {item.productImage ? (
                <Image source={{ uri: item.productImage }} style={styles.itemImage} resizeMode="cover" />
              ) : (
                <Icon name="image" size={24} color="#E6C9B9" />
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
                  <Icon name="x" size={20} color="#8C7A74" />
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
                    <Icon name="minus" size={16} color="#43332E" />
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.product, item.size, item.color, item.quantity + 1)}
                  >
                    <Icon name="plus" size={16} color="#43332E" />
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
          <Icon name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
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
  scroll: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingBottom: 60 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F7D9C4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 12 },
  emptySubtitle: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', textAlign: 'center', marginBottom: 32, opacity: 0.8 },
  shopBtn: { backgroundColor: '#B4725E', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 8 },
  shopBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },

  cartItem: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 12,
    borderRadius: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#E6C9B9',
  },
  imageContainer: {
    width: 90, height: 110, borderRadius: 8, backgroundColor: '#F8F8F8',
    marginRight: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
  },
  itemImage: { width: '100%', height: '100%' },
  itemDetails: { flex: 1, justifyContent: 'space-between', paddingVertical: 4 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 16, fontFamily: 'PlayfairDisplay_600SemiBold', color: '#2A201D', flex: 1, marginRight: 10 },
  itemVariant: { fontSize: 13, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', marginTop: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  itemPrice: { fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold', color: '#B4725E' },

  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5EE', borderRadius: 8, borderWidth: 1, borderColor: '#E6C9B9' },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyValue: { width: 30, textAlign: 'center', fontSize: 14, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D' },
  removeBtn: { padding: 4, marginRight: -4, marginTop: -4 },

  footer: {
    backgroundColor: '#FFFFFF', padding: 24, paddingBottom: 32,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#43332E', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 10,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  totalLabel: { fontSize: 16, fontFamily: 'InstrumentSans_400Regular', color: '#43332E' },
  totalValue: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },
  checkoutBtn: {
    backgroundColor: '#B4725E', padding: 18, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center'
  },
  checkoutBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },
});

export default CartScreen;
