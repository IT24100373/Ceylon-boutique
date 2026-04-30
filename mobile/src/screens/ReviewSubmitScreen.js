import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert, Image,
} from 'react-native';
import apiClient from '../api/client';

// -------------------------------------------------------
// FR5.1 — Review Submission Screen
// Reached from: OrderDetailScreen → "Write Review" card
// Params: orderId, orderItem (the full item object), reviewType (optional preselect)
// -------------------------------------------------------

const StarSelector = ({ rating, onSelect }) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity key={star} onPress={() => onSelect(star)} style={styles.starBtn}>
        <Text style={[styles.star, rating >= star && styles.starFilled]}>
          {rating >= star ? '★' : '☆'}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

const ReviewSubmitScreen = ({ route, navigation }) => {
  const { orderId, orderItem, initialReviewType = 'product' } = route.params;

  const [reviewType, setReviewType] = useState(initialReviewType);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [photo1, setPhoto1] = useState('');
  const [photo2, setPhoto2] = useState('');
  const [photo3, setPhoto3] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }

    const photos = [photo1, photo2, photo3].filter((p) => p.trim() !== '');

    const payload = {
      orderId,
      orderItemId: orderItem._id,
      reviewType,
      rating,
      reviewText: reviewText.trim(),
      photos,
    };

    if (reviewType === 'product') {
      payload.productId = orderItem.product?._id || orderItem.product;
    } else {
      payload.sellerId = orderItem.seller?._id || orderItem.seller;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/api/reviews', payload);
      Alert.alert(
        '✅ Review Submitted!',
        'Thank you for your feedback. Your review is now live.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to submit review. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Product card */}
        <View style={styles.productCard}>
          {orderItem.productImage ? (
            <Image source={{ uri: orderItem.productImage }} style={styles.productImage} />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={{ fontSize: 28 }}>🛍️</Text>
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{orderItem.productName}</Text>
            <Text style={styles.productVariant}>
              {orderItem.size} · {orderItem.color} · Qty {orderItem.quantity}
            </Text>
          </View>
        </View>

        {/* Review type toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are you reviewing?</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, reviewType === 'product' && styles.toggleBtnActive]}
              onPress={() => setReviewType('product')}
            >
              <Text style={[styles.toggleText, reviewType === 'product' && styles.toggleTextActive]}>
                🛍️ Product
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, reviewType === 'seller' && styles.toggleBtnActive]}
              onPress={() => setReviewType('seller')}
            >
              <Text style={[styles.toggleText, reviewType === 'seller' && styles.toggleTextActive]}>
                🏪 Seller
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Star rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rating *</Text>
          <StarSelector rating={rating} onSelect={setRating} />
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
          )}
        </View>

        {/* Review text */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Review <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.textArea}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share your experience with this product or seller..."
            placeholderTextColor="#aaa"
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{reviewText.length}/1000</Text>
        </View>

        {/* Photo URLs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos <Text style={styles.optional}>(optional — max 3 URLs)</Text></Text>
          <TextInput
            style={styles.urlInput}
            value={photo1}
            onChangeText={setPhoto1}
            placeholder="Photo URL 1"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            keyboardType="url"
          />
          <TextInput
            style={styles.urlInput}
            value={photo2}
            onChangeText={setPhoto2}
            placeholder="Photo URL 2"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            keyboardType="url"
          />
          <TextInput
            style={styles.urlInput}
            value={photo3}
            onChangeText={setPhoto3}
            placeholder="Photo URL 3"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Submit footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (submitting || rating === 0) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting || rating === 0}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  scroll: { padding: 16 },
  productCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
    padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#eee',
    alignItems: 'center',
  },
  productImage: { width: 64, height: 64, borderRadius: 10, marginRight: 14, backgroundColor: '#f0f0f0' },
  productImagePlaceholder: {
    width: 64, height: 64, borderRadius: 10, marginRight: 14,
    backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 4 },
  productVariant: { fontSize: 12, color: '#888' },
  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#eee',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 12 },
  optional: { fontSize: 12, fontWeight: '400', color: '#aaa' },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#f8f8f8',
  },
  toggleBtnActive: { borderColor: '#8B2635', backgroundColor: '#FBE9E7' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#888' },
  toggleTextActive: { color: '#8B2635', fontWeight: '800' },
  starRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  starBtn: { padding: 6 },
  star: { fontSize: 40, color: '#ddd' },
  starFilled: { color: '#F57C00' },
  ratingLabel: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#F57C00' },
  textArea: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 12, height: 120, fontSize: 14, color: '#333', backgroundColor: '#fafafa',
  },
  charCount: { textAlign: 'right', fontSize: 12, color: '#aaa', marginTop: 4 },
  urlInput: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    padding: 12, fontSize: 13, color: '#333', backgroundColor: '#fafafa', marginBottom: 10,
  },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#eee',
  },
  submitBtn: {
    backgroundColor: '#8B2635', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default ReviewSubmitScreen;
