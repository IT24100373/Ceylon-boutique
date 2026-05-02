import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Image, TouchableOpacity, ActivityIndicator, Dimensions, Alert, StatusBar
} from 'react-native';
import apiClient from '../api/client';
import { useCart } from '../context/CartContext';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

const colorMap = {
  'Red': '#D32F2F', 'Blue': '#1976D2', 'Green': '#388E3C', 'Black': '#2E2A26',
  'White': '#FFFFFF', 'Yellow': '#FBC02D', 'Pink': '#E91E63', 'Purple': '#7B1FA2',
  'Terracotta': '#EEEADDFF', 'Beige': '#EEEADDFF', 'Olive': '#5B6939', 'Brown': '#5C554F'
};

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await apiClient.get(`/api/products/${productId}`);
        const p = response.data.product;
        setProduct(p);
        if (p.sizes && p.sizes.length > 0) setSelectedSize(p.sizes[0]);
        if (p.colors && p.colors.length > 0) setSelectedColor(p.colors[0].name);
      } catch (error) {
        console.log('Product detail error:', error.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const getVariantStock = () => {
    if (!product || !selectedSize || !selectedColor) return 0;
    const variant = product.variants?.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    );
    return variant ? variant.stock : 0;
  };

  const variantStock = product ? getVariantStock() : 0;
  const isOutOfStock = product ? product.totalStock === 0 : false;
  const isVariantOutOfStock = variantStock === 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
        <ActivityIndicator size="large" color="#EEEADDFF" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
        <Text style={styles.errorText}>Product not found.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#5C554F', fontFamily: 'Montserrat_600SemiBold' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Image Gallery */}
        <View style={styles.imageGallery}>
          {product.images && product.images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(idx);
              }}
            >
              {product.images.map((img, idx) => (
                <Image key={idx} source={{ uri: img }} style={styles.galleryImage} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.galleryImage, styles.noImage]}>
              <Icon name="image" size={48} color="#2E2A26" />
            </View>
          )}

          {/* Overlay Buttons */}
          <View style={styles.overlayHeader}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={20} color="#2E2A26" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle}>
              <Icon name="heart" size={20} color="#2E2A26" />
            </TouchableOpacity>
          </View>

          {/* Image Indicator Dots */}
          {product.images && product.images.length > 1 && (
            <View style={styles.dotsRow}>
              {product.images.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.dot, currentImageIndex === idx && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.name}>{product.name}</Text>

          <TouchableOpacity
            style={styles.ratingRow}
            onPress={() => navigation.navigate('ProductReviews', {
              productId: product._id,
              productName: product.name,
            })}
            activeOpacity={0.7}
          >
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Icon key={s} name="star" size={14} color="#2E2A26" style={product.averageRating >= s ? { fill: '#D4A853' } : {}} />
              ))}
            </View>
            <Text style={styles.reviewCount}>({product.totalReviews} Reviews)</Text>
          </TouchableOpacity>

          <Text style={styles.price}>LKR {product.price?.toLocaleString()}</Text>
        </View>

        <View style={styles.divider} />

        {/* Color Selector */}
        {product.colors && product.colors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Color</Text>
              <Text style={styles.selectedValueText}>{selectedColor}</Text>
            </View>
            <View style={styles.chipRow}>
              {product.colors.map((color, idx) => {
                const isSelected = selectedColor === color.name;
                const bgColor = colorMap[color.name] || '#8A8178';
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.colorCircleWrapper, isSelected && styles.colorCircleWrapperActive]}
                    onPress={() => setSelectedColor(color.name)}
                  >
                    <View style={[styles.colorCircle, { backgroundColor: bgColor }]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Size Selector */}
        {product.sizes && product.sizes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Size</Text>
              <Text style={styles.sizeGuideText}>Size Guide</Text>
            </View>
            <View style={styles.chipRow}>
              {product.sizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <TouchableOpacity
                    key={size}
                    style={[styles.sizeSquare, isSelected && styles.sizeSquareActive]}
                    onPress={() => setSelectedSize(size)}
                  >
                    <Text style={[styles.sizeText, isSelected && styles.sizeTextActive]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Stock Status (only visible if warning) */}
        {product.totalStock > 0 && variantStock < 5 && (
          <View style={[styles.section, { paddingTop: 0 }]}>
            <Text style={{ fontFamily: 'Montserrat_400Regular', color: '#5C554F', fontSize: 13 }}>
              {isVariantOutOfStock ? 'This variant is out of stock' : `Only ${variantStock} left in stock!`}
            </Text>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {/* Mock bullet points based on image */}
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletText}>• 100% locally sourced organic cotton</Text>
            <Text style={styles.bulletText}>• Natural, low-impact dyes</Text>
            <Text style={styles.bulletText}>• Relaxed fit, dropped shoulder</Text>
            <Text style={styles.bulletText}>• Hand wash recommended</Text>
          </View>
        </View>

        {/* Seller Info */}
        {product.seller && (
          <TouchableOpacity
            style={styles.sellerCard}
            onPress={() => {
              if (product.seller._id) {
                navigation.navigate('SellerShopProfile', { sellerId: product.seller._id });
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.sellerIconCircle}>
              <Text style={styles.sellerIconText}>{product.seller.shopName.charAt(0)}</Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{product.seller.shopName}</Text>
              {product.seller.averageRating > 0 && (
                <View style={styles.sellerRatingRow}>
                  <Icon name="star" size={12} color="#2E2A26" style={{ fill: '#D4A853' }} />
                  <Text style={styles.sellerRatingText}>
                    {product.seller.averageRating?.toFixed(1)} Seller Rating
                  </Text>
                </View>
              )}
            </View>
            <Icon name="chevron-right" size={20} color="#2E2A26" />
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bookmarkBtn}>
          <Icon name="bookmark" size={22} color="#2E2A26" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cartBtn, (isOutOfStock || isVariantOutOfStock) && styles.btnDisabled]}
          disabled={isOutOfStock || isVariantOutOfStock}
          onPress={() => {
            if (!selectedSize || !selectedColor) {
              Alert.alert('Error', 'Please select a size and color.');
              return;
            }
            addToCart(product, selectedSize, selectedColor, 1);
            Alert.alert('Added', 'Item added to your cart.');
          }}
        >
          <Icon name="shopping-bag" size={18} color="#2E2A26" style={{ marginRight: 8 }} />
          <Text style={styles.cartBtnText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  errorText: { fontSize: 16, color: '#5C554F', fontFamily: 'Montserrat_400Regular' },
  imageGallery: { position: 'relative', width: '100%' },
  galleryImage: { width, height: 450, backgroundColor: '#EEEADDFF' },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  overlayHeader: {
    position: 'absolute', top: 40, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    position: 'absolute', bottom: 16, left: 0, right: 0,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)', marginHorizontal: 4,
  },
  dotActive: { backgroundColor: '#EEEADDFF', width: 6 },
  outOfStockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  outOfStockText: {
    color: '#2E2A26', fontSize: 16, fontFamily: 'Montserrat_600SemiBold',
    backgroundColor: '#D32F2F', paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 4,
  },
  infoSection: { padding: 20, paddingBottom: 16 },
  name: { fontSize: 28, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  starsContainer: { flexDirection: 'row', marginRight: 8 },
  reviewCount: { fontSize: 13, color: '#2E2A26', fontFamily: 'Montserrat_400Regular' },
  price: { fontSize: 24, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  divider: { height: 1, backgroundColor: '#EEEADDFF', marginHorizontal: 20, marginVertical: 4 },
  section: { paddingHorizontal: 20, paddingVertical: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  selectedValueText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#5C554F' },
  sizeGuideText: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#5C554F', textDecorationLine: 'underline' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },

  colorCircleWrapper: {
    width: 38, height: 38, borderRadius: 19,
     
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, marginBottom: 10,
  },
  colorCircleWrapperActive: {
     
  },
  colorCircle: {
    width: 28, height: 28, borderRadius: 14,
  },

  sizeSquare: {
    width: 48, height: 48, borderRadius: 8,
    backgroundColor: '#EEEADDFF', marginRight: 12, marginBottom: 12,
     
    alignItems: 'center', justifyContent: 'center',
  },
  sizeSquareActive: {   backgroundColor: '#EEEADDFF' },
  sizeText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },
  sizeTextActive: { color: '#5C554F' },

  description: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#5C554F', lineHeight: 24, marginTop: 8 },
  bulletPoints: { marginTop: 16, marginLeft: 8 },
  bulletText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#5C554F', lineHeight: 24 },

  sellerCard: {
    marginHorizontal: 20, marginTop: 8, padding: 16,
    backgroundColor: '#EEEADDFF', borderRadius: 12,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sellerIconCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEEADDFF',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  sellerIconText: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#5C554F' },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26', marginBottom: 4 },
  sellerRatingRow: { flexDirection: 'row', alignItems: 'center' },
  sellerRatingText: { fontSize: 12, fontFamily: 'Montserrat_400Regular', color: '#5C554F', marginLeft: 4 },

  bottomBar: {
    flexDirection: 'row', padding: 16, paddingBottom: 24,
    backgroundcolor: '#2E2A26',  
  },
  bookmarkBtn: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: '#EEEADDFF', alignItems: 'center', justifyContent: 'center',
      marginRight: 16,
  },
  cartBtn: {
    flex: 1, height: 56, borderRadius: 12,
    backgroundColor: '#EEEADDFF', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2E2A26',
  },
  cartBtnText: { color: '#5C554F', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  btnDisabled: { opacity: 0.5 },
});

export default ProductDetailScreen;
