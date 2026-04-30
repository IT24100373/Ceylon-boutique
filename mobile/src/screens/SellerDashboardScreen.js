import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

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
    { label: 'Products', value: dashboard?.productCount ?? 0, icon: '📦', color: '#E3F2FD' },
    { label: 'Rating', value: dashboard?.averageRating?.toFixed(1) ?? '0.0', icon: '⭐', color: '#FFF8E1' },
    { label: 'Orders', value: dashboard?.totalOrders ?? 0, icon: '🛒', color: '#E8F5E9' },
    { label: 'Reviews', value: dashboard?.totalReviews ?? 0, icon: '💬', color: '#F3E5F5' },
  ];

  const menuItems = [
    { title: 'My Shop Profile', desc: 'View and edit your shop details', icon: '🏪', screen: 'SellerShopProfile' },
    { title: 'My Products', desc: 'Manage your product listings', icon: '📦', screen: 'MyProducts' },
    { title: 'Orders', desc: 'View and manage customer orders', icon: '🛒', screen: null, placeholder: 'Module 4' },
    { title: 'Reviews', desc: 'See what customers are saying', icon: '⭐', screen: null, placeholder: 'Module 5' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B2635" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greet}>Hello, {user?.fullName?.split(' ')[0]} 👋</Text>
          <Text style={styles.shopLabel}>{dashboard?.shopName || user?.shopName || 'My Shop'}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B2635" />}
      >
        {/* Status Badge */}
        <View style={styles.statusRow}>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>✅ Verified Seller</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <View key={idx} style={[styles.statCard, { backgroundColor: stat.color }]}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
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
                navigation.navigate(item.screen);
              } else {
                // Placeholder for future modules
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuCardLeft}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDesc}>
                  {item.placeholder ? `Coming soon (${item.placeholder})` : item.desc}
                </Text>
              </View>
            </View>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: {
    backgroundColor: '#8B2635', paddingHorizontal: 20, paddingVertical: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greet: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  shopLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 20,
  },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  body: { flex: 1, padding: 16 },
  statusRow: { alignItems: 'flex-start', marginBottom: 16 },
  activeBadge: {
    backgroundColor: '#E8F5E9', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  activeBadgeText: { color: '#2E7D32', fontWeight: '700', fontSize: 13 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20,
  },
  statCard: {
    width: '48%', borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 10,
  },
  statIcon: { fontSize: 28, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2, fontWeight: '600' },
  sectionTitle: {
    fontSize: 17, fontWeight: '800', color: '#333', marginBottom: 12,
  },
  menuCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0',
  },
  menuCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIcon: { fontSize: 28, marginRight: 14 },
  menuTitle: { fontSize: 15, fontWeight: '700', color: '#333' },
  menuDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  menuArrow: { fontSize: 18, color: '#ccc', fontWeight: '700' },
});

export default SellerDashboardScreen;
