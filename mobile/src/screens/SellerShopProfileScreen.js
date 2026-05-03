import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, TouchableOpacity, Alert, RefreshControl, Platform
} from 'react-native';
import Button from '../components/Button';
import apiClient from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import Icon from 'react-native-vector-icons/Feather';

const SellerShopProfileScreen = ({ navigation }) => {
  const [seller, setSeller] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchShopProfile = async () => {
    try {
      const response = await apiClient.get('/api/sellers/my-shop');
      setSeller(response.data.seller);
      setOwner(response.data.owner);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load shop profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopProfile();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchShopProfile();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShopProfile();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner />;

  const InfoRow = ({ label, value, icon }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLabelGroup}>
        <Icon name={icon} size={14} color="#8A8178" style={{ marginRight: 8 }} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );

  const statusColors = {
    pending: { dot: '#D4A853', text: '#D4A853', bg: '#D4A85315' },
    approved: { dot: '#5B6939', text: '#5B6939', bg: '#5B693915' },
    rejected: { dot: '#D32F2F', text: '#D32F2F', bg: '#D32F2F15' },
    suspended: { dot: '#D4A853', text: '#D4A853', bg: '#D4A85315' },
    removed: { dot: '#D32F2F', text: '#D32F2F', bg: '#D32F2F15' },
  };
  const sc = statusColors[seller?.verificationStatus] || statusColors.pending;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <SafeAreaView style={{ flex: 1 }}>
        

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2E2A26" />}
          style={styles.scroll}
        >
          {/* Immersive Shop Header */}
          <View style={styles.shopBranding}>
            <View style={styles.shopIconCircle}>
              <Icon name="home" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.shopName}>{seller?.shopName}</Text>
            <Text style={styles.shopCategory}>{seller?.categoryFocus || 'Boutique Collection'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: sc.dot }]} />
              <Text style={[styles.statusText, { color: sc.text }]}>
                {seller?.verificationStatus?.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{seller?.productCount ?? 0}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('SellerReviews', {
                sellerId: seller?._id,
                shopName: seller?.shopName,
              })}
              activeOpacity={0.7}
            >
              <Text style={styles.statValue}>{seller?.averageRating?.toFixed(1) ?? '0.0'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.statLabel}>Rating</Text>
                <Icon name="chevron-right" size={10} color="#A8A19A" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('SellerReviews', {
                sellerId: seller?._id,
                shopName: seller?.shopName,
              })}
              activeOpacity={0.7}
            >
              <Text style={styles.statValue}>{seller?.totalReviews ?? 0}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.statLabel}>Reviews</Text>
                <Icon name="chevron-right" size={10} color="#A8A19A" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Profile Sections */}
          <View style={styles.sectionsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Merchant Information</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.infoCard}>
              <InfoRow label="Business Reg" value={seller?.businessRegNumber} icon="file-text" />
              <InfoRow label="NIC Number" value={seller?.nicNumber} icon="credit-card" />
              <InfoRow label="Description" value={seller?.shopDescription} icon="info" />
              <InfoRow label="Member Since" value={seller?.createdAt ? new Date(seller.createdAt).toLocaleDateString() : '—'} icon="calendar" />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Owner Details</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.infoCard}>
              <InfoRow label="Owner Name" value={owner?.fullName} icon="user" />
              <InfoRow label="Email" value={owner?.email} icon="mail" />
              <InfoRow label="Phone" value={owner?.phone} icon="phone" />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Financials</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.infoCard}>
              <InfoRow label="Bank" value={seller?.bankName} icon="briefcase" />
              <InfoRow label="Account No" value={seller?.bankAccountNumber} icon="hash" />
              <InfoRow label="Holder" value={seller?.bankAccountName} icon="user-check" />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.infoCard}>
              <InfoRow label="Address" value={`${seller?.contactAddress?.addressLine1 || ''}${seller?.contactAddress?.addressLine2 ? ', ' + seller.contactAddress.addressLine2 : ''}`} icon="map-pin" />
              <InfoRow label="Region" value={`${seller?.contactAddress?.city}, ${seller?.contactAddress?.province}`} icon="globe" />
            </View>
          </View>

          {/* Edit Button */}
          {seller?.verificationStatus === 'approved' && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditShop', { seller })}
              activeOpacity={0.8}
            >
              <Icon name="edit-3" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.editBtnText}>Update Shop Identity</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },

  scroll: { flex: 1 },
  shopBranding: {
    backgroundColor: '#EEEADDFF', paddingVertical: 40, alignItems: 'center',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    marginBottom: 40
  },
  shopIconCircle: {
    width: 80, height: 80, borderRadius: 25,
    backgroundColor: '#2E2A26',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 8,
  },
  shopName: { color: '#2E2A26', fontSize: 26, fontFamily: 'Cinzel_700Bold', marginBottom: 6 },
  shopCategory: { color: '#8A8178', fontSize: 15, fontFamily: 'Montserrat_400Regular', marginBottom: 15 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, 
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  statusText: { fontFamily: 'Montserrat_700Bold', fontSize: 11, letterSpacing: 1 },

  statsBar: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 20,
    marginTop: -70, borderRadius: 24, padding: 24,
    justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#F0EBE5',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  statLabel: { fontSize: 11, color: '#8A8178', marginTop: 4, fontFamily: 'Montserrat_700Bold', textTransform: 'uppercase' },
  statDivider: { width: 1, height: 30, backgroundColor: '#F0EBE5' },

  sectionsContainer: { paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  sectionTitle: { fontSize: 14, fontFamily: 'Montserrat_700Bold', color: '#2E2A26', textTransform: 'uppercase', letterSpacing: 1, marginRight: 15 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#F0EBE5' },

  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 5 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8F6F4'
  },
  infoLabelGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  infoLabel: { fontSize: 13, color: '#8A8178', fontFamily: 'Montserrat_600SemiBold' },
  infoValue: { fontSize: 14, color: '#2E2A26', fontFamily: 'Montserrat_400Regular', flex: 1.5, textAlign: 'right' },

  editBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2E2A26', marginHorizontal: 20, marginTop: 30, paddingVertical: 18, borderRadius: 16,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8
  },
  editBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold', letterSpacing: 0.5 },
});

export default SellerShopProfileScreen;
