import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);

  // Load cart on startup
  useEffect(() => {
    loadCart();
  }, []);

  // Update total whenever items change
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setCartTotal(total);
    saveCart(cartItems);
  }, [cartItems]);

  const loadCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem('ceylon_cart');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (e) {
      console.log('Failed to load cart', e);
    }
  };

  const saveCart = async (items) => {
    try {
      await AsyncStorage.setItem('ceylon_cart', JSON.stringify(items));
    } catch (e) {
      console.log('Failed to save cart', e);
    }
  };

  const addToCart = (product, size, color, quantity = 1) => {
    setCartItems((prevItems) => {
      // Check if variant already in cart
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product === product._id && item.size === size && item.color === color
      );

      if (existingItemIndex >= 0) {
        // Update quantity
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      } else {
        // Add new item
        return [
          ...prevItems,
          {
            product: product._id,
            productName: product.name,
            productImage: product.images && product.images.length > 0 ? product.images[0] : '',
            category: product.category,
            price: product.price,
            seller: product.seller?._id,
            size,
            color,
            quantity,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId, size, color, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product === productId && item.size === size && item.color === color
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId, size, color) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.product === productId && item.size === size && item.color === color)
      )
    );
  };

  const clearCart = async () => {
    setCartItems([]);
    await AsyncStorage.removeItem('ceylon_cart');
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
