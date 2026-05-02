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
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
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
              <Icon name="package" size={20} color="#B4725E" style={styles.actionIcon} />
              <Text style={styles.actionText}>My Orders</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#8C7A74" />
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('MyReviews')}>
            <View style={styles.actionLeft}>
              <Icon name="star" size={20} color="#B4725E" style={styles.actionIcon} />
              <Text style={styles.actionText}>My Reviews</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#8C7A74" />
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('EditProfile')}>
            <View style={styles.actionLeft}>
              <Icon name="edit-2" size={20} color="#B4725E" style={styles.actionIcon} />
              <Text style={styles.actionText}>Edit Profile</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#8C7A74" />
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('ChangePassword')}>
            <View style={styles.actionLeft}>
              <Icon name="lock" size={20} color="#B4725E" style={styles.actionIcon} />
              <Text style={styles.actionText}>Change Password</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#8C7A74" />
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('Addresses')}>
            <View style={styles.actionLeft}>
              <Icon name="map-pin" size={20} color="#B4725E" style={styles.actionIcon} />
              <Text style={styles.actionText}>My Addresses</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#8C7A74" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Icon name="log-out" size={18} color="#B4725E" style={{ marginRight: 8 }} />
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
  safe: { flex: 1, backgroundColor: '#FFF1E8' },
  header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFF1E8' },
  headerTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },
  container: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#F7D9C4',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#B4725E', fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold' },
  name: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },
  role: { fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', marginTop: 4 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingHorizontal: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 16,
  },
  rowLabel: { fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74' },
  rowValue: { fontSize: 15, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D', flexShrink: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#E6C9B9' },

  actionsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingHorizontal: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  actionItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 16,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { marginRight: 12 },
  actionText: { fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D' },

  logoutBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#B4725E',
    marginBottom: 16,
  },
  logoutText: { color: '#B4725E', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16 },

  deactivateBtn: { alignItems: 'center', padding: 12 },
  deactivateText: { color: '#D32F2F', fontSize: 14, fontFamily: 'InstrumentSans_400Regular', textDecorationLine: 'underline' },
});

export default ProfileScreen;
