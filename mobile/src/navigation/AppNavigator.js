import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

// --- Module 1 Screens ---
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import AddressManagementScreen from '../screens/AddressManagementScreen';

// --- Module 2 Screens ---
import SellerRegisterScreen from '../screens/SellerRegisterScreen';
import SellerLoginScreen from '../screens/SellerLoginScreen';
import SellerPendingScreen from '../screens/SellerPendingScreen';
import SellerDashboardScreen from '../screens/SellerDashboardScreen';
import SellerShopProfileScreen from '../screens/SellerShopProfileScreen';
import EditShopScreen from '../screens/EditShopScreen';

// --- Module 3 Screens (Seller — Product Management) ---
import MyProductsScreen from '../screens/MyProductsScreen';
import AddProductScreen from '../screens/AddProductScreen';
import EditProductScreen from '../screens/EditProductScreen';
import ManageStockScreen from '../screens/ManageStockScreen';

// --- Module 3 Screens (Customer — Product Browsing) ---
import ProductBrowseScreen from '../screens/ProductBrowseScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SearchFilterScreen from '../screens/SearchFilterScreen';

// --- Module 4 Screens (Customer — Orders & Cart) ---
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';

// --- Module 4 Screens (Seller — Order Management) ---
import SellerOrdersScreen from '../screens/SellerOrdersScreen';
import SellerOrderDetailScreen from '../screens/SellerOrderDetailScreen';

// --- Module 5 Screens (Reviews & Ratings) ---
import ReviewSubmitScreen from '../screens/ReviewSubmitScreen';
import ProductReviewsScreen from '../screens/ProductReviewsScreen';
import SellerReviewsScreen from '../screens/SellerReviewsScreen';
import MyReviewsScreen from '../screens/MyReviewsScreen';
import EditReviewScreen from '../screens/EditReviewScreen';

const Stack = createNativeStackNavigator();

// -------------------------------------------------------
// Auth Stack — shown when user is NOT logged in
// Includes both customer and seller auth entry points
// -------------------------------------------------------
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="SellerLogin" component={SellerLoginScreen} />
    <Stack.Screen name="SellerRegister" component={SellerRegisterScreen} />
  </Stack.Navigator>
);

// -------------------------------------------------------
// Customer App Stack — shown when a CUSTOMER is logged in
// Includes Module 1 profile screens + Module 3 product browsing
// -------------------------------------------------------
const CustomerAppStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#8B2635' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    {/* Module 3 — Product Browsing (replaces placeholder Home) */}
    <Stack.Screen name="Home" component={ProductBrowseScreen} options={{ title: 'Ceylon Boutique' }} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product Details' }} />
    <Stack.Screen name="SearchFilter" component={SearchFilterScreen} options={{ title: 'Search & Filter' }} />

    {/* Module 1 — Profile Management */}
    <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
    <Stack.Screen name="Addresses" component={AddressManagementScreen} options={{ title: 'My Addresses' }} />

    {/* Module 4 — Cart & Orders */}
    <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'My Cart' }} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
    <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ headerShown: false }} />
    <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My Orders' }} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />

    {/* Module 5 — Reviews & Ratings */}
    <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} options={{ title: 'Write a Review' }} />
    <Stack.Screen name="ProductReviews" component={ProductReviewsScreen} options={{ title: 'Product Reviews' }} />
    <Stack.Screen name="SellerReviews" component={SellerReviewsScreen} options={{ title: 'Shop Reviews' }} />
    <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ title: 'My Reviews' }} />
    <Stack.Screen name="EditReview" component={EditReviewScreen} options={{ title: 'Edit Review' }} />
  </Stack.Navigator>
);

// -------------------------------------------------------
// Seller Pending Stack — shown when seller is awaiting verification
// -------------------------------------------------------
const SellerPendingStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SellerPending" component={SellerPendingScreen} />
  </Stack.Navigator>
);

// -------------------------------------------------------
// Seller App Stack — shown when a VERIFIED SELLER is logged in
// Includes Module 2 shop screens + Module 3 product management
// -------------------------------------------------------
const SellerAppStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#8B2635' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    {/* Module 2 — Shop Management */}
    <Stack.Screen name="SellerDashboard" component={SellerDashboardScreen} options={{ headerShown: false }} />
    <Stack.Screen name="SellerShopProfile" component={SellerShopProfileScreen} options={{ title: 'My Shop' }} />
    <Stack.Screen name="EditShop" component={EditShopScreen} options={{ title: 'Edit Shop' }} />

    {/* Module 3 — Product Management */}
    <Stack.Screen name="MyProducts" component={MyProductsScreen} options={{ title: 'My Products' }} />
    <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Add Product' }} />
    <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Edit Product' }} />
    <Stack.Screen name="ManageStock" component={ManageStockScreen} options={{ title: 'Manage Stock' }} />

    {/* Module 4 — Order Management */}
    <Stack.Screen name="SellerOrders" component={SellerOrdersScreen} options={{ title: 'Manage Orders' }} />
    <Stack.Screen name="SellerOrderDetail" component={SellerOrderDetailScreen} options={{ title: 'Order Details' }} />

    {/* Module 5 — Seller can view their own shop reviews */}
    <Stack.Screen name="SellerReviews" component={SellerReviewsScreen} options={{ title: 'Shop Reviews' }} />
  </Stack.Navigator>
);

// -------------------------------------------------------
// Main Navigator — decides which stack to show
// -------------------------------------------------------
const AppNavigator = () => {
  const { user, isLoading } = useAuth();

  // Show spinner while restoring session from AsyncStorage
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#8B2635' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Decide which stack to render based on user state
  const getActiveStack = () => {
    // Not logged in → show auth screens
    if (!user) return <AuthStack />;

    // Seller flow
    if (user.role === 'seller') {
      // Check verification status
      if (user.verificationStatus === 'approved') {
        return <SellerAppStack />;
      }
      // Pending, rejected, or any other status → pending screen
      return <SellerPendingStack />;
    }

    // Customer flow (default)
    return <CustomerAppStack />;
  };

  return (
    <NavigationContainer>
      {getActiveStack()}
    </NavigationContainer>
  );
};

export default AppNavigator;
