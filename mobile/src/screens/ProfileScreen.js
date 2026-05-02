import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, SafeAreaView, StatusBar
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Feather';

const ProfileRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value || '—'}</Text>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Account',
      'This will deactivate your account. Your order history will be retained. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => navigation.navigate('DeactivateConfirm'), // handled in screen below
        },
      ]
    );
  };

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.fullName}</Text>
          <Text style={styles.role}>Customer Account</Text>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <ProfileRow label="Email" value={user?.email} />
          <View style={styles.divider} />
          <ProfileRow label="Phone" value={user?.phone} />
          <View style={styles.divider} />
          <ProfileRow label="Member Since" value={joined} />
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('MyOrders')}>
            <View style={styles.actionLeft}>
              <Icon name="package" size={18} color="#2E2A26" style={styles.actionIcon} />
              <Text style={styles.actionText}>My Orders</Text>
            </View>
            <Icon name="chevron-right" size={18} color="#2E2A26" />
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('MyReviews')}>
            <View style={styles.actionLeft}>
              <Icon name="star" size={18} color="#2E2A26" style={styles.actionIcon} />
              <Text style={styles.actionText}>My Reviews</Text>
            </View>
            <Icon name="chevron-right" size={18} color="#2E2A26" />
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('EditProfile')}>
            <View style={styles.actionLeft}>
              <Icon name="edit-2" size={18} color="#2E2A26" style={styles.actionIcon} />
              <Text style={styles.actionText}>Edit Profile</Text>
            </View>
            <Icon name="chevron-right" size={18} color="#2E2A26" />
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ChangePassword')}>
            <View style={styles.actionLeft}>
              <Icon name="lock" size={18} color="#2E2A26" style={styles.actionIcon} />
              <Text style={styles.actionText}>Change Password</Text>
            </View>
            <Icon name="chevron-right" size={18} color="#2E2A26" />
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Addresses')}>
            <View style={styles.actionLeft}>
              <Icon name="map-pin" size={18} color="#2E2A26" style={styles.actionIcon} />
              <Text style={styles.actionText}>My Addresses</Text>
            </View>
            <Icon name="chevron-right" size={18} color="#2E2A26" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="log-out" size={18} color="#2E2A26" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deactivateBtn} onPress={handleDeactivate}>
          <Text style={styles.deactivateText}>Deactivate Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  container: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#EEEADDFF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#5C554F', fontSize: 32, fontFamily: 'Cinzel_700Bold' },
  name: { fontSize: 22, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  role: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', marginTop: 4 },

  card: {
    backgroundColor: '#EEEADDFF', borderRadius: 14,
    paddingHorizontal: 16, marginBottom: 20,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 16,
  },
  rowLabel: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#8A8178' },
  rowValue: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F', flexShrink: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#EEEADDFF' },

  actionsCard: {
    backgroundColor: '#EEEADDFF', borderRadius: 14,
    paddingHorizontal: 16, marginBottom: 16,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  actionItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { marginRight: 12 },
  actionText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },

  logoutBtn: {
    backgroundColor: '#EEEADDFF', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2E2A26',
    marginBottom: 16,
  },
  logoutText: { color: '#5C554F', fontFamily: 'Montserrat_600SemiBold', fontSize: 16 },

  deactivateBtn: { alignItems: 'center', padding: 12 },
  deactivateText: { color: '#5C554F', fontSize: 14, fontFamily: 'Montserrat_400Regular', textDecorationLine: 'underline' },
});

export default ProfileScreen;
