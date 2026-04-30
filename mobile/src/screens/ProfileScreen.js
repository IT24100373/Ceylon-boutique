import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

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
      <ScrollView contentContainerStyle={styles.container}>
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
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.actionText}>✏️  Edit Profile</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ChangePassword')}>
            <Text style={styles.actionText}>🔒  Change Password</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Addresses')}>
            <Text style={styles.actionText}>📍  My Addresses</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
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
  safe: { flex: 1, backgroundColor: '#f8f8f8' },
  container: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#8B2635',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { fontSize: 20, fontWeight: '800', color: '#222' },
  role: { fontSize: 13, color: '#888', marginTop: 2 },
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#eee',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 14,
  },
  rowLabel: { fontSize: 14, color: '#888', fontWeight: '600' },
  rowValue: { fontSize: 14, color: '#222', fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#f0f0f0' },
  actionsCard: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#eee',
  },
  actionItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 16,
  },
  actionText: { fontSize: 15, color: '#222', fontWeight: '500' },
  chevron: { fontSize: 20, color: '#bbb' },
  logoutBtn: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#8B2635',
    marginBottom: 12,
  },
  logoutText: { color: '#8B2635', fontWeight: '700', fontSize: 15 },
  deactivateBtn: {
    alignItems: 'center', padding: 12,
  },
  deactivateText: { color: '#c53030', fontSize: 13, fontWeight: '600' },
});

export default ProfileScreen;
