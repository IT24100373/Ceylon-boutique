import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, SafeAreaView, StatusBar, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Feather';

const ProfileRow = ({ label, value, icon }) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <Icon name={icon} size={16} color="#8A8178" style={{ marginRight: 12 }} />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Text style={styles.rowValue} numberOfLines={1}>{value || '—'}</Text>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of your boutique account?', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeactivate = () => {
    Alert.alert(
      'Deactivate Account',
      'This will temporarily disable your account features. Your order history will be preserved. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => navigation.navigate('DeactivateConfirm'),
        },
      ]
    );
  };

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Immersive Profile Header */}
          <View style={styles.profileBranding}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarShadow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editAvatarBtn} onPress={() => navigation.navigate('EditProfile')}>
                <Icon name="camera" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user?.fullName}</Text>
            <Text style={styles.userRole}>Boutique Member</Text>
          </View>

          {/* Account Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Account Details</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.infoCard}>
              <ProfileRow label="Email" value={user?.email} icon="mail" />
              <ProfileRow label="Phone" value={user?.phone} icon="phone" />
              <ProfileRow label="Member Since" value={joined} icon="calendar" />
            </View>
          </View>

          {/* Activity & Management */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Activity & Management</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MyOrders')}>
                <View style={styles.actionIconBox}>
                  <Icon name="package" size={20} color="#2E2A26" />
                </View>
                <Text style={styles.actionCardLabel}>My Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MyReviews')}>
                <View style={styles.actionIconBox}>
                  <Icon name="star" size={20} color="#2E2A26" />
                </View>
                <Text style={styles.actionCardLabel}>My Reviews</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Addresses')}>
                <View style={styles.actionIconBox}>
                  <Icon name="map-pin" size={20} color="#2E2A26" />
                </View>
                <Text style={styles.actionCardLabel}>Addresses</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ChangePassword')}>
                <View style={styles.actionIconBox}>
                  <Icon name="shield" size={20} color="#2E2A26" />
                </View>
                <Text style={styles.actionCardLabel}>Security</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Support Zone */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Preferences</Text>
              <View style={styles.sectionLine} />
            </View>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconBox}>
                  <Icon name="user" size={18} color="#8A8178" />
                </View>
                <Text style={styles.menuText}>Personal Information</Text>
              </View>
              <Icon name="chevron-right" size={18} color="#A8A19A" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Icon name="log-out" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deactivateBtn} onPress={handleDeactivate}>
              <Text style={styles.deactivateText}>Deactivate Account</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1 },
  
  profileBranding: {
    backgroundColor: '#EEEADDFF', paddingVertical: 40, alignItems: 'center',
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40, marginBottom: 20
  },
  avatarWrapper: { position: 'relative', marginBottom: 20 },
  avatarShadow: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFFFFF',
    padding: 4, shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10
  },
  avatar: {
    width: '100%', height: '100%', borderRadius: 46, backgroundColor: '#2E2A26',
    justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { color: '#FFFFFF', fontSize: 36, fontFamily: 'Cinzel_700Bold' },
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#D4A853', justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: '#EEEADDFF'
  },
  userName: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 6 },
  userRole: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', letterSpacing: 0.5 },

  section: { paddingHorizontal: 20, marginVertical: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#2E2A26', textTransform: 'uppercase', letterSpacing: 1.5, marginRight: 15 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#F0EBE5' },

  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 10, borderWidth: 1, borderColor: '#F0EBE5' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F8F6F4' },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178' },
  rowValue: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', flex: 1, textAlign: 'right', marginLeft: 20 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: {
    width: '48%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 15,
    borderWidth: 1, borderColor: '#F0EBE5', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2
  },
  actionIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F8F6F4', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  actionCardLabel: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },

  menuItem: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#F0EBE5'
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8F6F4', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },

  logoutBtn: {
    backgroundColor: '#2E2A26', borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8,
    marginTop: 10
  },
  logoutText: { color: '#FFFFFF', fontFamily: 'Montserrat_600SemiBold', fontSize: 16 },

  deactivateBtn: { alignItems: 'center', padding: 20, marginTop: 10 },
  deactivateText: { color: '#D32F2F', fontSize: 13, fontFamily: 'Montserrat_600SemiBold' },
});

export default ProfileScreen;
