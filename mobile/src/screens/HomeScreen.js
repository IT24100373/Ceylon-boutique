import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Feather';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <View style={styles.container}>
        {/* Welcome banner */}
        <View style={styles.banner}>
          <Text style={styles.greet}>Hello, {user?.fullName?.split(' ')[0]}</Text>
          <Text style={styles.bannerSub}>Discover authentic Sri Lankan boutique fashion</Text>
        </View>

        {/* Placeholder for Module 3 - Product Browse */}
        <View style={styles.placeholder}>
          <Icon name="shopping-bag" size={48} color="#2E2A26" style={styles.placeholderIcon} />
          <Text style={styles.placeholderTitle}>Products Coming Soon</Text>
          <Text style={styles.placeholderText}>
            Product browsing will be built in Module 3. For now, explore your profile and account settings.
          </Text>
        </View>

        {/* Quick link to profile */}
        <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.profileContent}>
            <Icon name="user" size={20} color="#2E2A26" />
            <Text style={styles.profileCardText}>View My Profile</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#2E2A26" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, padding: 24 },
  banner: {
    backgroundColor: '#EEEADDFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#2E2A26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  greet: { color: '#2E2A26', fontFamily: 'Cinzel_700Bold', fontSize: 26, marginBottom: 6 },
  bannerSub: { color: '#8A8178', fontFamily: 'Montserrat_400Regular', fontSize: 15, opacity: 0.9 },
  placeholder: {
    flex: 1,
    backgroundColor: '#EEEADDFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginBottom: 16,
  },
  placeholderIcon: { marginBottom: 16 },
  placeholderTitle: { fontFamily: 'Cinzel_700Bold', fontSize: 20, color: '#8A8178', marginBottom: 10 },
  placeholderText: { fontFamily: 'Montserrat_400Regular', fontSize: 15, color: '#8A8178', textAlign: 'center', lineHeight: 22, opacity: 0.8 },
  profileCard: {
    backgroundColor: '#EEEADDFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCardText: { fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: '#5C554F', marginLeft: 12 },
});

export default HomeScreen;
