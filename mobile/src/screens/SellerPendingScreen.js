import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, Alert,
} from 'react-native';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
      <View style={styles.content}>
        {/* Status Icon */}
        <View style={styles.iconCircle}>
          <Icon name="clock" size={40} color="#D4A853" />
        </View>

        <Text style={styles.title}>Under Review</Text>
        <Text style={styles.subtitle}>
          Hi {user?.fullName?.split(' ')[0]}, your seller application for
        </Text>
        <Text style={styles.shopName}>"{user?.shopName || 'your shop'}"</Text>
        <Text style={styles.subtitle}>is currently being reviewed by our team.</Text>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="file-text" size={18} color="#B4725E" style={{ marginRight: 8 }} />
            <Text style={styles.infoTitle}>What happens next?</Text>
          </View>
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
            <Icon name="loader" size={16} color="#D4A853" style={{ marginRight: 6 }} />
            <Text style={styles.statusBadgeText}>Pending Verification</Text>
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
  container: { flex: 1, backgroundColor: '#FFF1E8' },
  content: {
    flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center',
  },
  iconCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#FFF5EE', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, borderWidth: 1, borderColor: '#E6C9B9'
  },
  title: {
    fontSize: 26, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 12,
  },
  subtitle: {
    fontSize: 16, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', textAlign: 'center', lineHeight: 24,
  },
  shopName: {
    fontSize: 18, fontFamily: 'PlayfairDisplay_700Bold', color: '#B4725E',
    marginVertical: 8, textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20,
    marginTop: 30, width: '100%',
    borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoTitle: {
    fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D',
  },
  infoText: {
    fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', lineHeight: 24,
  },
  statusCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20,
    marginTop: 16, width: '100%', alignItems: 'center',
    borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statusLabel: {
    fontSize: 14, color: '#8C7A74', fontFamily: 'InstrumentSans_600SemiBold', marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF5EE', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: '#E6C9B9'
  },
  statusBadgeText: { color: '#D4A853', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14 },
  refreshBtn: { marginTop: 32, width: '100%', backgroundColor: '#B4725E' },
  logoutBtn: { marginTop: 12, width: '100%' },
});

export default SellerPendingScreen;
