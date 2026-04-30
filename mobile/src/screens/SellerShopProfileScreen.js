import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  StatusBar, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import Button from '../components/Button';
import apiClient from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

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
    pending: { bg: '#FFF3E0', text: '#E65100' },
    approved: { bg: '#E8F5E9', text: '#2E7D32' },
    rejected: { bg: '#FFEBEE', text: '#C62828' },
    suspended: { bg: '#FFF3E0', text: '#E65100' },
    removed: { bg: '#FFEBEE', text: '#C62828' },
  };
  const sc = statusColors[seller?.verificationStatus] || statusColors.pending;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B2635" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8B2635" />}
      >
        {/* Shop Header Card */}
        <View style={styles.shopHeader}>
          <View style={styles.shopIconCircle}>
            <Text style={styles.shopIcon}>🏪</Text>
          </View>
          <Text style={styles.shopName}>{seller?.shopName}</Text>
          <Text style={styles.shopCategory}>{seller?.categoryFocus || 'General Clothing'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>
              {seller?.verificationStatus?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Shop Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Information</Text>
          <InfoRow label="Shop Name" value={seller?.shopName} />
          <InfoRow label="Description" value={seller?.shopDescription} />
          <InfoRow label="Category Focus" value={seller?.categoryFocus} />
          <InfoRow label="Member Since" value={seller?.createdAt ? new Date(seller.createdAt).toLocaleDateString() : '—'} />
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
            <Text style={styles.statLabel}>Rating ›</Text>
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
            <Text style={styles.statLabel}>Reviews ›</Text>
          </TouchableOpacity>
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

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  shopHeader: {
    backgroundColor: '#8B2635', paddingVertical: 30, alignItems: 'center',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  shopIconCircle: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  shopIcon: { fontSize: 32 },
  shopName: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  shopCategory: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 10 },
  statusBadge: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  statusText: { fontWeight: '700', fontSize: 12 },
  section: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: '#333', marginBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  infoLabel: { fontSize: 13, color: '#888', fontWeight: '600', flex: 1 },
  infoValue: { fontSize: 13, color: '#333', fontWeight: '500', flex: 1.5, textAlign: 'right' },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16,
    marginTop: 14, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: '#8B2635' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: '#e2e8f0' },
  editSection: { padding: 16 },
  editBtn: {},
});

export default SellerShopProfileScreen;
