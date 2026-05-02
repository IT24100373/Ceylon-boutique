import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/Feather';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7D9C4" />
      <View style={styles.container}>
        {/* Welcome banner */}
        <View style={styles.banner}>
          <Text style={styles.greet}>Hello, {user?.fullName?.split(' ')[0]}</Text>
          <Text style={styles.bannerSub}>Discover authentic Sri Lankan boutique fashion</Text>
        </View>

        {/* Placeholder for Module 3 - Product Browse */}
        <View style={styles.placeholder}>
          <Icon name="shopping-bag" size={48} color="#B4725E" style={styles.placeholderIcon} />
          <Text style={styles.placeholderTitle}>Products Coming Soon</Text>
          <Text style={styles.placeholderText}>
            Product browsing will be built in Module 3. For now, explore your profile and account settings.
          </Text>
        </View>

        {/* Quick link to profile */}
        <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.profileContent}>
            <Icon name="user" size={20} color="#43332E" />
            <Text style={styles.profileCardText}>View My Profile</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#B4725E" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7D9C4' },
  container: { flex: 1, padding: 24 },
  banner: {
    backgroundColor: '#B4725E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#43332E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  greet: { color: '#FFFFFF', fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, marginBottom: 6 },
  bannerSub: { color: '#FFFFFF', fontFamily: 'InstrumentSans_400Regular', fontSize: 15, opacity: 0.9 },
  placeholder: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginBottom: 16,
  },
  placeholderIcon: { marginBottom: 16 },
  placeholderTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: '#2A201D', marginBottom: 10 },
  placeholderText: { fontFamily: 'InstrumentSans_400Regular', fontSize: 15, color: '#43332E', textAlign: 'center', lineHeight: 22, opacity: 0.8 },
  profileCard: {
    backgroundColor: '#FFFFFF',
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
  profileCardText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16, color: '#43332E', marginLeft: 12 },
});

export default HomeScreen;
