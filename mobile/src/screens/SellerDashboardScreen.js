import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, TouchableOpacity, RefreshControl, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

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

  React.useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const stats = [
    { label: 'Products', value: dashboard?.productCount ?? 0, icon: 'package' },
    { label: 'Rating', value: dashboard?.averageRating?.toFixed(1) ?? '0.0', icon: 'star' },
    { label: 'Orders', value: dashboard?.totalOrders ?? 0, icon: 'shopping-cart' },
    { label: 'Reviews', value: dashboard?.totalReviews ?? 0, icon: 'message-square' },
  ];

  const menuItems = [
    { title: 'My Shop Profile', desc: 'Refine your shop identity and details', icon: 'home', screen: 'SellerShopProfile' },
    { title: 'My Products', desc: 'List new items or update inventory', icon: 'package', screen: 'MyProducts' },
    { title: 'Orders', desc: 'Track and fulfill customer purchases', icon: 'shopping-bag', screen: 'SellerOrders' },
    { title: 'Product Reviews', desc: 'Feedback on individual listings', icon: 'message-circle', screen: 'SellerProductReviews', params: { sellerId: user?.sellerId, shopName: dashboard?.shopName || user?.shopName } },
    { title: 'Shop Reviews', desc: 'Customer satisfaction and testimonials', icon: 'award', screen: 'SellerReviews', params: { sellerId: user?.sellerId, shopName: dashboard?.shopName || user?.shopName } },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.fullName?.split(' ')[0]} 👋</Text>
            </View>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Icon name="log-out" size={18} color="#2E2A26" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.shopCard}>
            <View style={styles.shopInfo}>
              <View style={styles.shopIconBox}>
                <Icon name="shopping-bag" size={24} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.shopName}>{dashboard?.shopName || user?.shopName || 'Ceylon Boutique'}</Text>
                <View style={styles.verifiedBadge}>
                  <Icon name="check-circle" size={12} color="#5B6939" style={{ marginRight: 4 }} />
                  <Text style={styles.verifiedText}>Verified Merchant</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E2A26" />}
        >
          {/* Stats Grid */}
          <View style={styles.statsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.statsGrid}>
              {stats.map((stat, idx) => (
                <View key={idx} style={styles.statCard}>
                  <View style={styles.statIconWrapper}>
                    <Icon name={stat.icon} size={20} color="#2E2A26" />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Management</Text>
              <View style={styles.sectionLine} />
            </View>
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.menuCard}
                onPress={() => {
                  if (item.screen) {
                    navigation.navigate(item.screen, item.params);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.menuIconBox}>
                  <Icon name={item.icon} size={22} color="#2E2A26" />
                </View>
                <View style={styles.menuTextContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDesc}>{item.desc}</Text>
                </View>
                <Icon name="chevron-right" size={18} color="#A8A19A" />
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: '#EEEADDFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  greetText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#5C554F' },
  userName: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  logoutBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#EEEADD'
  },
  
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5,
  },
  shopInfo: { flexDirection: 'row', alignItems: 'center' },
  shopIconBox: {
    width: 50, height: 50, borderRadius: 15, backgroundColor: '#2E2A26',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  shopName: { fontSize: 18, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center' },
  verifiedText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#5B6939' },

  body: { flex: 1, paddingHorizontal: 20 },
  
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  sectionTitle: { fontSize: 14, fontFamily: 'Montserrat_700Bold', color: '#2E2A26', textTransform: 'uppercase', letterSpacing: 1, marginRight: 15 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#F0EBE5' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#F0EBE5',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  statIconWrapper: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F8F6F4',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  statValue: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  statLabel: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', marginTop: 4 },

  menuCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 16, marginBottom: 15,
    borderWidth: 1, borderColor: '#F0EBE5',
  },
  menuIconBox: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: '#F8F6F4',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  menuTextContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26', marginBottom: 4 },
  menuDesc: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#8A8178', lineHeight: 18 },
});

export default SellerDashboardScreen;
