import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, SafeAreaView, ImageBackground, Dimensions } from 'react-native';
import Button from '../components/Button';
import Icon from 'react-native-vector-icons/Feather';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={require('../../assets/welcome_bg.png')}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safe}>
            {/* Brand Section */}
            <View style={styles.brandSection}>
              <View style={styles.iconContainer}>
                <Icon name="shopping-bag" size={64} color="#faf9f8ff" />
              </View>
              <Text style={styles.brandName}>Ceylon{'\n'}Boutique</Text>
              <Text style={styles.tagline}>Sri Lanka's Authentic Clothing Marketplace</Text>
            </View>

            {/* Action Section */}
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.getStartedBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.getStartedBtnText}>Get Started →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('SellerLogin')}
                style={styles.sellerBtn}
              >
                <Text style={styles.sellerBtnText}>Seller Login</Text>
              </TouchableOpacity>

              {/* Decorative Divider */}
              <View style={styles.footerDecoration}>
                <View style={styles.line} />
                <Icon name="sun" size={14} color="#faf9f8ff" style={styles.sunIcon} />
                <View style={styles.line} />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Black background to avoid white flickering/footer
  },
  bgImage: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Darker overlay for premium look and text contrast
    paddingBottom: 20, // Add some padding to bottom to lift content slightly from edge
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
  },
  brandSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  iconContainer: {
    marginBottom: 30,
    opacity: 1,
  },
  brandName: {
    color: '#faf9f8ff',
    fontFamily: 'Cinzel_700Bold',
    fontSize: 54,
    textAlign: 'center',
    lineHeight: 60,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    color: '#faf9f8ff', // Soft beige for tagline
    fontFamily: 'Cinzel_400Regular',
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 50,
    lineHeight: 28,
    opacity: 0.9,
  },
  actionSection: {
    paddingHorizontal: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  getStartedBtn: {
    width: '100%',
    backgroundColor: '#EEEADDFF', // Brand brown
    borderRadius: 40,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2E2A26',
    shadowColor: '#2E2A26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  getStartedBtnText: {
    color: '#2E2A26',
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
  },
  sellerBtn: {
    width: '100%',
    height: 60,
    borderRadius: 40,
    
    
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#EEEADDFF',
    marginBottom: 40,
  },
  sellerBtnText: {
    color: '#faf9f8ff',
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 16,
  },
  footerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    opacity: 0.6,
  },
  line: {
    height: 1,
    backgroundColor: '#EEEADDFF',
    width: 40,
  },
  sunIcon: {
    marginHorizontal: 12,
  },
});

export default WelcomeScreen;
