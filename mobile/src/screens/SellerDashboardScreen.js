import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

// -------------------------------------------------------
// Seller Active Dashboard — Home screen for verified sellers
// Shows quick stats and navigation cards to other sections
// -------------------------------------------------------
const SellerDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/sellers/dashboard');
      setDashboard(response.data.dashboard);
    } catch (error) {
      console.log('Dashboard fetch error:', error.response?.data?.message);
    }
  }, []);

  // Fetch on first render
  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const stats = [
    { label: 'Products', value: dashboard?.productCount ?? 0, icon: 'package', color: '#8A8178' },
    { label: 'Rating', value: dashboard?.averageRating?.toFixed(1) ?? '0.0', icon: 'star', color: '#8A8178' },
    { label: 'Orders', value: dashboard?.totalOrders ?? 0, icon: 'shopping-cart', color: '#8A8178' },
    { label: 'Reviews', value: dashboard?.totalReviews ?? 0, icon: 'message-square', color: '#8A8178' },
  ];

  const menuItems = [
    { title: 'My Shop Profile', desc: 'View and edit your shop details', icon: 'home', screen: 'SellerShopProfile' },
    { title: 'My Products', desc: 'Manage your product listings', icon: 'package', screen: 'MyProducts' },
    { title: 'Orders', desc: 'View and manage customer orders', icon: 'shopping-cart', screen: 'SellerOrders' },
    { title: 'Product Reviews', desc: 'See feedback on your items', icon: 'message-circle', screen: 'SellerProductReviews', params: { sellerId: user?.sellerId, shopName: dashboard?.shopName || user?.shopName } },
    { title: 'Shop Reviews', desc: 'See what customers are saying about you', icon: 'star', screen: 'SellerReviews', params: { sellerId: user?.sellerId, shopName: dashboard?.shopName || user?.shopName } },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#EEEADDFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greet}>Hello, {user?.fullName?.split(' ')[0]} 👋</Text>
          <Text style={styles.shopLabel}>{dashboard?.shopName || user?.shopName || 'My Shop'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#EEEADDFF" />}
      >
        {/* Status Badge */}
        <View style={styles.statusRow}>
          <View style={styles.activeBadge}>
            <Icon name="check-circle" size={14} color="#2E2A26" style={{ marginRight: 6 }} />
            <Text style={styles.activeBadgeText}>Verified Seller</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <View key={idx} style={[styles.statCard, { backgroundColor: stat.color }]}>
              <View style={styles.statIconContainer}>
                <Icon name={stat.icon} size={24} color="#2E2A26" />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Cards */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.menuCard}
            onPress={() => {
              if (item.screen) {
                navigation.navigate(item.screen, item.params);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuCardLeft}>
              <View style={styles.menuIconContainer}>
                <Icon name={item.icon} size={20} color="#2E2A26" />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color="#2E2A26" />
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: '#EEEADDFF', paddingHorizontal: 20, paddingVertical: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTextContainer: { flex: 1 },
  greet: { color: '#2E2A26', fontSize: 22, fontFamily: 'Cinzel_700Bold', marginBottom: 4 },
  shopLabel: { color: '#8A8178', fontSize: 14, fontFamily: 'Montserrat_400Regular' },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#2E2A26',
  },
  logoutText: { color: '#5C554F', fontFamily: 'Montserrat_600SemiBold', fontSize: 13 },

  body: { flex: 1, padding: 16 },

  statusRow: { alignItems: 'flex-start', marginBottom: 20, marginTop: 4 },
  activeBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center',
  },
  activeBadgeText: { color: '#5C554F', fontFamily: 'Montserrat_600SemiBold', fontSize: 13 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24,
  },
  statCard: {
    width: '48%', borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statIconContainer: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEEADDFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  statValue: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#f7f5f3ff' },
  statLabel: { fontSize: 13, color: '#f8f2ecff', marginTop: 4, fontFamily: 'Montserrat_600SemiBold' },

  sectionTitle: {
    fontSize: 18, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 16,
  },

  menuCard: {
    backgroundColor: '#EEEADDFF', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  menuCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIconContainer: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEEADDFF',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  menuTextContainer: { flex: 1, paddingRight: 16 },
  menuTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26', marginBottom: 4 },
  menuDesc: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#5C554F', lineHeight: 18 },
});

export default SellerDashboardScreen;
