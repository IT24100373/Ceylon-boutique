import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Alert,
} from 'react-native';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

// -------------------------------------------------------
// Seller Pending Verification Screen
// Shown when a seller has registered but admin hasn't
// approved them yet. They can refresh to check status.
// -------------------------------------------------------
const SellerPendingScreen = () => {
  const { user, logout, updateLocalUser } = useAuth();
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const response = await apiClient.get('/api/sellers/my-shop');
      const { seller } = response.data;

      if (seller.verificationStatus === 'approved') {
        Alert.alert('🎉 Congratulations!', 'Your shop has been approved! You can now start listing products.', [
          {
            text: 'Go to Dashboard',
            onPress: () => {
              updateLocalUser({
                ...user,
                verificationStatus: 'approved',
                shopName: seller.shopName,
                sellerId: seller.id,
              });
            },
          },
        ]);
      } else if (seller.verificationStatus === 'rejected') {
        Alert.alert(
          'Application Rejected',
          `Reason: ${seller.rejectionReason || 'No reason provided.'}\n\nPlease contact support or register again with updated information.`,
          [
            { text: 'Logout', onPress: logout },
            { text: 'OK' },
          ]
        );
      } else {
        Alert.alert('Still Under Review', 'Your application is still being reviewed. Please check back later.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not check status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
      <View style={styles.content}>
        {/* Status Icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>⏳</Text>
        </View>

        <Text style={styles.title}>Under Review</Text>
        <Text style={styles.subtitle}>
          Hi {user?.fullName?.split(' ')[0]}, your seller application for
        </Text>
        <Text style={styles.shopName}>"{user?.shopName || 'your shop'}"</Text>
        <Text style={styles.subtitle}>is currently being reviewed by our team.</Text>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 What happens next?</Text>
          <Text style={styles.infoText}>
            • Our admin team reviews your business documents{'\n'}
            • This usually takes 3-5 business days{'\n'}
            • You'll be notified once a decision is made{'\n'}
            • Once approved, you can start listing products
          </Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Current Status</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>⏳ Pending Verification</Text>
          </View>
        </View>

        {/* Actions */}
        <Button
          title={checking ? 'Checking...' : 'Refresh Status'}
          onPress={checkStatus}
          disabled={checking}
          style={styles.refreshBtn}
        />

        <Button
          title="Logout"
          onPress={logout}
          variant="secondary"
          style={styles.logoutBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  content: {
    flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center',
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  icon: { fontSize: 40 },
  title: {
    fontSize: 24, fontWeight: '800', color: '#333', marginBottom: 10,
  },
  subtitle: {
    fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22,
  },
  shopName: {
    fontSize: 17, fontWeight: '700', color: '#8B2635',
    marginVertical: 6, textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18,
    marginTop: 24, width: '100%',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  infoTitle: {
    fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10,
  },
  infoText: {
    fontSize: 13, color: '#555', lineHeight: 22,
  },
  statusCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginTop: 14, width: '100%', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  statusLabel: {
    fontSize: 13, color: '#999', fontWeight: '600', marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#FFF3E0', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeText: { color: '#E65100', fontWeight: '700', fontSize: 14 },
  refreshBtn: { marginTop: 24, width: '100%' },
  logoutBtn: { marginTop: 10, width: '100%' },
});

export default SellerPendingScreen;
