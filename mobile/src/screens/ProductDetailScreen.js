import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Image, TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import apiClient from '../api/client';

// -------------------------------------------------------
// Customer — Product Detail Screen
// Full product view with image gallery, size/color selectors,
// stock status, description, and seller info
// -------------------------------------------------------
const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await apiClient.get(`/api/products/${productId}`);
        const p = response.data.product;
        setProduct(p);
        // Auto-select first size and color
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

  // Get stock for the selected variant
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B2635" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Product not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
                <Image key={idx} source={{ uri: img }} style={styles.galleryImage} />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.galleryImage, styles.noImage]}>
              <Text style={styles.noImageText}>🛍️</Text>
            </View>
          )}

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

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>LKR {product.price?.toLocaleString()}</Text>

          {/* Rating */}
          {product.averageRating > 0 && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStars}>
                {'★'.repeat(Math.round(product.averageRating))}
                {'☆'.repeat(5 - Math.round(product.averageRating))}
              </Text>
              <Text style={styles.ratingValue}>{product.averageRating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({product.totalReviews} reviews)</Text>
            </View>
          )}
        </View>

        {/* Size Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Size</Text>
          <View style={styles.chipRow}>
            {product.sizes?.map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.sizeChip, selectedSize === size && styles.sizeChipActive]}
                onPress={() => setSelectedSize(size)}
              >
                <Text style={[styles.sizeText, selectedSize === size && styles.sizeTextActive]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Color</Text>
          <View style={styles.chipRow}>
            {product.colors?.map((color, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.colorChip, selectedColor === color.name && styles.colorChipActive]}
                onPress={() => setSelectedColor(color.name)}
              >
                <Text style={[styles.colorText, selectedColor === color.name && styles.colorTextActive]}>
                  {color.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stock Status */}
        <View style={styles.section}>
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Availability:</Text>
            {isVariantOutOfStock ? (
              <View style={styles.stockBadgeOut}>
                <Text style={styles.stockBadgeOutText}>Out of Stock</Text>
              </View>
            ) : (
              <View style={styles.stockBadgeIn}>
                <Text style={styles.stockBadgeInText}>In Stock ({variantStock} available)</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* Seller Info */}
        {product.seller && (
          <TouchableOpacity
            style={styles.sellerCard}
            onPress={() => {
              // Navigate to shop profile if available
              if (product.seller._id) {
                navigation.navigate('ShopProfile', { sellerId: product.seller._id });
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerIcon}>🏪</Text>
              <View>
                <Text style={styles.sellerName}>{product.seller.shopName}</Text>
                {product.seller.averageRating > 0 && (
                  <Text style={styles.sellerRating}>
                    ⭐ {product.seller.averageRating?.toFixed(1)} · {product.seller.totalReviews} reviews
                  </Text>
                )}
              </View>
            </View>
            <Text style={styles.sellerArrow}>→</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.cartBtn, (isOutOfStock || isVariantOutOfStock) && styles.btnDisabled]}
          disabled={isOutOfStock || isVariantOutOfStock}
          onPress={() => {
            // Module 4 placeholder
            alert('🛒 Cart functionality will be available in Module 4!');
          }}
        >
          <Text style={styles.cartBtnText}>🛒 Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buyBtn, (isOutOfStock || isVariantOutOfStock) && styles.btnDisabled]}
          disabled={isOutOfStock || isVariantOutOfStock}
          onPress={() => {
            // Module 4 placeholder
            alert('⚡ Buy Now functionality will be available in Module 4!');
          }}
        >
          <Text style={styles.buyBtnText}>⚡ Buy Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { fontSize: 16, color: '#888' },
  imageGallery: { position: 'relative' },
  galleryImage: { width, height: 350, backgroundColor: '#f1f1f1' },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  noImageText: { fontSize: 60 },
  dotsRow: {
    flexDirection: 'row', justifyContent: 'center',
    position: 'absolute', bottom: 12, left: 0, right: 0,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 4,
  },
  dotActive: { backgroundColor: '#fff', width: 20 },
  outOfStockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  outOfStockText: {
    color: '#fff', fontSize: 22, fontWeight: '900',
    backgroundColor: '#D32F2F', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 8,
  },
  infoSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  category: {
    fontSize: 12, color: '#8B2635', fontWeight: '700',
    textTransform: 'uppercase', marginBottom: 6,
  },
  name: { fontSize: 22, fontWeight: '800', color: '#333', marginBottom: 8 },
  price: { fontSize: 26, fontWeight: '900', color: '#8B2635', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingStars: { color: '#F57C00', fontSize: 16, marginRight: 6 },
  ratingValue: { fontSize: 14, fontWeight: '700', color: '#333', marginRight: 4 },
  reviewCount: { fontSize: 13, color: '#888' },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#333', marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  sizeChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#f5f5f5', marginRight: 10, marginBottom: 10,
    borderWidth: 2, borderColor: '#e2e8f0',
  },
  sizeChipActive: { borderColor: '#8B2635', backgroundColor: '#FBE9E7' },
  sizeText: { fontSize: 14, fontWeight: '600', color: '#666' },
  sizeTextActive: { color: '#8B2635', fontWeight: '800' },
  colorChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#f5f5f5', marginRight: 10, marginBottom: 10,
    borderWidth: 2, borderColor: '#e2e8f0',
  },
  colorChipActive: { borderColor: '#8B2635', backgroundColor: '#FBE9E7' },
  colorText: { fontSize: 14, fontWeight: '600', color: '#666' },
  colorTextActive: { color: '#8B2635', fontWeight: '800' },
  stockRow: { flexDirection: 'row', alignItems: 'center' },
  stockLabel: { fontSize: 14, fontWeight: '700', color: '#555', marginRight: 10 },
  stockBadgeIn: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  stockBadgeInText: { color: '#2E7D32', fontWeight: '700', fontSize: 13 },
  stockBadgeOut: { backgroundColor: '#FFEBEE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  stockBadgeOutText: { color: '#D32F2F', fontWeight: '700', fontSize: 13 },
  description: { fontSize: 14, color: '#555', lineHeight: 22 },
  sellerCard: {
    margin: 20, padding: 16, backgroundColor: '#f8f8f8',
    borderRadius: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1, borderColor: '#e2e8f0',
  },
  sellerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sellerIcon: { fontSize: 30, marginRight: 12 },
  sellerName: { fontSize: 15, fontWeight: '700', color: '#333' },
  sellerRating: { fontSize: 12, color: '#888', marginTop: 2 },
  sellerArrow: { fontSize: 20, color: '#ccc', fontWeight: '700' },
  bottomBar: {
    flexDirection: 'row', padding: 16,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  cartBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#fff', alignItems: 'center',
    marginRight: 10, borderWidth: 2, borderColor: '#8B2635',
  },
  cartBtnText: { color: '#8B2635', fontSize: 15, fontWeight: '800' },
  buyBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#8B2635', alignItems: 'center',
  },
  buyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnDisabled: { opacity: 0.4 },
});

export default ProductDetailScreen;
