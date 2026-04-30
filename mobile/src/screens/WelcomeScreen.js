import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, SafeAreaView } from 'react-native';
import Button from '../components/Button';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B2635" />

      {/* Brand Section */}
      <View style={styles.brandSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>CB</Text>
        </View>
        <Text style={styles.brandName}>Ceylon Boutique</Text>
        <Text style={styles.tagline}>Sri Lanka's Authentic Clothing Marketplace</Text>
      </View>

      {/* Action Section */}
      <View style={styles.actionSection}>
        <Button
          title="Login"
          onPress={() => navigation.navigate('Login')}
          style={styles.loginBtn}
        />
        <Button
          title="Create Account"
          onPress={() => navigation.navigate('Register')}
          variant="secondary"
          style={styles.registerBtn}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('SellerLogin')}
          style={styles.sellerLink}
        >
          <Text style={styles.sellerLinkText}>Want to sell? Register as a Seller →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8B2635',
    justifyContent: 'space-between',
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  logoText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  brandName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  tagline: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  actionSection: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingBottom: 40,
  },
  loginBtn: { marginBottom: 12 },
  registerBtn: {},
  sellerLink: { marginTop: 20, alignItems: 'center' },
  sellerLinkText: { color: '#8B2635', fontWeight: '600', fontSize: 14 },
});

export default WelcomeScreen;
