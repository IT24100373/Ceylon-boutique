import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Welcome banner */}
        <View style={styles.banner}>
          <Text style={styles.greet}>Hello, {user?.fullName?.split(' ')[0]} 👋</Text>
          <Text style={styles.bannerSub}>Discover authentic Sri Lankan boutique fashion</Text>
        </View>

        {/* Placeholder for Module 3 - Product Browse */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>🛍️</Text>
          <Text style={styles.placeholderTitle}>Products Coming Soon</Text>
          <Text style={styles.placeholderText}>
            Product browsing will be built in Module 3. For now, explore your profile and account settings.
          </Text>
        </View>

        {/* Quick link to profile */}
        <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileCardText}>👤  View My Profile →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f8f8' },
  container: { flex: 1, padding: 20 },
  banner: {
    backgroundColor: '#8B2635',
    borderRadius: 16,
    padding: 22,
    marginBottom: 20,
  },
  greet: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  placeholder: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  placeholderIcon: { fontSize: 48, marginBottom: 14 },
  placeholderTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 10 },
  placeholderText: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 21 },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileCardText: { fontSize: 16, color: '#8B2635', fontWeight: '600' },
});

export default HomeScreen;
