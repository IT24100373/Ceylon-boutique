import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import Button from '../components/Button';
import apiClient from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import Icon from 'react-native-vector-icons/Feather';

// -------------------------------------------------------
// FR2.3 — View Seller's Own Shop Profile
// -------------------------------------------------------
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

  // Refresh when coming back from EditShop
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

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );

  const statusColors = {
    pending: { bg: '#FFF5EE', text: '#D4A853', border: '#E6C9B9' },
    approved: { bg: '#E8F5E9', text: '#2E7D32', border: '#C8E6C9' },
    rejected: { bg: '#FFEBEE', text: '#C62828', border: '#FFCDD2' },
    suspended: { bg: '#FFF5EE', text: '#D4A853', border: '#E6C9B9' },
    removed: { bg: '#FFEBEE', text: '#C62828', border: '#FFCDD2' },
  };
  const sc = statusColors[seller?.verificationStatus] || statusColors.pending;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#B4725E" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B4725E" />}
      >
        {/* Shop Header Card */}
        <View style={styles.shopHeader}>
          <View style={styles.shopIconCircle}>
            <Icon name="home" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.shopName}>{seller?.shopName}</Text>
          <Text style={styles.shopCategory}>{seller?.categoryFocus || 'General Clothing'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>
              {seller?.verificationStatus?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Stats Section — Rating is tappable to view all reviews */}
        <View style={styles.statsRow}>
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
            <Text style={styles.statLabel}>Rating <Icon name="chevron-right" size={12} /></Text>
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
            <Text style={styles.statLabel}>Reviews <Icon name="chevron-right" size={12} /></Text>
          </TouchableOpacity>
        </View>

        {/* Shop Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Information</Text>
          <InfoRow label="Shop Name" value={seller?.shopName} />
          <InfoRow label="Description" value={seller?.shopDescription} />
          <InfoRow label="Category Focus" value={seller?.categoryFocus} />
          <InfoRow label="Member Since" value={seller?.createdAt ? new Date(seller.createdAt).toLocaleDateString() : '—'} />
        </View>

        {/* Owner Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Owner Details</Text>
          <InfoRow label="Full Name" value={owner?.fullName} />
          <InfoRow label="Email" value={owner?.email} />
          <InfoRow label="Phone" value={owner?.phone} />
        </View>

        {/* Business Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Documents</Text>
          <InfoRow label="Business Reg. No." value={seller?.businessRegNumber} />
          <InfoRow label="NIC Number" value={seller?.nicNumber} />
        </View>

        {/* Bank Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Details</Text>
          <InfoRow label="Bank" value={seller?.bankName} />
          <InfoRow label="Branch" value={seller?.bankBranch} />
          <InfoRow label="Account No." value={seller?.bankAccountNumber} />
          <InfoRow label="Account Name" value={seller?.bankAccountName} />
        </View>

        {/* Contact Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Address</Text>
          <InfoRow label="Address" value={`${seller?.contactAddress?.addressLine1 || ''}${seller?.contactAddress?.addressLine2 ? ', ' + seller.contactAddress.addressLine2 : ''}`} />
          <InfoRow label="City" value={seller?.contactAddress?.city} />
          <InfoRow label="Province" value={seller?.contactAddress?.province} />
          <InfoRow label="Postal Code" value={seller?.contactAddress?.postalCode} />
        </View>

        {/* Edit Button */}
        {seller?.verificationStatus === 'approved' && (
          <View style={styles.editSection}>
            <Button
              title="Edit Shop Info"
              onPress={() => navigation.navigate('EditShop', { seller })}
              style={styles.editBtn}
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF1E8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#B4725E'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: '#FFFFFF' },

  shopHeader: {
    backgroundColor: '#B4725E', paddingVertical: 30, alignItems: 'center',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  shopIconCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
  },
  shopName: { color: '#FFFFFF', fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', marginBottom: 4 },
  shopCategory: { color: '#F7D9C4', fontSize: 14, fontFamily: 'InstrumentSans_400Regular', marginBottom: 12 },
  statusBadge: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1
  },
  statusText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 12 },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 16,
    marginTop: -20, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E6C9B9', justifyContent: 'space-around',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: '#B4725E' },
  statLabel: { fontSize: 12, color: '#8C7A74', marginTop: 4, fontFamily: 'InstrumentSans_600SemiBold' },
  statDivider: { width: 1, backgroundColor: '#E6C9B9' },

  section: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 16,
    borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: {
    fontSize: 16, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F8F8F8', paddingBottom: 10,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8F8F8',
  },
  infoLabel: { fontSize: 13, color: '#8C7A74', fontFamily: 'InstrumentSans_600SemiBold', flex: 1 },
  infoValue: { fontSize: 13, color: '#2A201D', fontFamily: 'InstrumentSans_400Regular', flex: 1.5, textAlign: 'right' },

  editSection: { padding: 16, marginTop: 8 },
  editBtn: { backgroundColor: '#B4725E', borderRadius: 12, paddingVertical: 16 },
});

export default SellerShopProfileScreen;
