import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert, Image, StatusBar
} from 'react-native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

// -------------------------------------------------------
// FR5.1 — Review Submission Screen
// Reached from: OrderDetailScreen → "Write Review" card
// Params: orderId, orderItem (the full item object), reviewType (optional preselect)
// -------------------------------------------------------

const StarSelector = ({ rating, onSelect }) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity key={star} onPress={() => onSelect(star)} style={styles.starBtn}>
        <Icon
          name="star"
          size={36}
          color={rating >= star ? "#B4725E" : "#E6C9B9"}
          solid={rating >= star}
        />
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
        'Review Submitted!',
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#43332E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Review</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Product card */}
        <View style={styles.productCard}>
          {orderItem.productImage ? (
            <Image source={{ uri: orderItem.productImage }} style={styles.productImage} />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Icon name="image" size={24} color="#E6C9B9" />
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
              <Icon name="package" size={18} color={reviewType === 'product' ? '#B4725E' : '#8C7A74'} style={{ marginBottom: 6 }} />
              <Text style={[styles.toggleText, reviewType === 'product' && styles.toggleTextActive]}>
                Product
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, reviewType === 'seller' && styles.toggleBtnActive]}
              onPress={() => setReviewType('seller')}
            >
              <Icon name="home" size={18} color={reviewType === 'seller' ? '#B4725E' : '#8C7A74'} style={{ marginBottom: 6 }} />
              <Text style={[styles.toggleText, reviewType === 'seller' && styles.toggleTextActive]}>
                Seller
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
            placeholderTextColor="#A0938E"
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
            placeholderTextColor="#A0938E"
            autoCapitalize="none"
            keyboardType="url"
          />
          <TextInput
            style={styles.urlInput}
            value={photo2}
            onChangeText={setPhoto2}
            placeholder="Photo URL 2"
            placeholderTextColor="#A0938E"
            autoCapitalize="none"
            keyboardType="url"
          />
          <TextInput
            style={styles.urlInput}
            value={photo3}
            onChangeText={setPhoto3}
            placeholder="Photo URL 3"
            placeholderTextColor="#A0938E"
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
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF1E8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF1E8'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },
  scroll: { padding: 16 },

  productCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E6C9B9',
    alignItems: 'center', shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  productImage: { width: 64, height: 64, borderRadius: 10, marginRight: 16, backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#E6C9B9' },
  productImagePlaceholder: {
    width: 64, height: 64, borderRadius: 10, marginRight: 16,
    backgroundColor: '#F8F8F8', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E6C9B9'
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D', marginBottom: 4 },
  productVariant: { fontSize: 13, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74' },

  section: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 16 },
  optional: { fontSize: 13, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74' },

  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#E6C9B9', backgroundColor: '#F8F8F8',
  },
  toggleBtnActive: { borderColor: '#B4725E', backgroundColor: '#FFF5EE' },
  toggleText: { fontSize: 14, fontFamily: 'InstrumentSans_600SemiBold', color: '#8C7A74' },
  toggleTextActive: { color: '#B4725E' },

  starRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  starBtn: { padding: 6 },
  ratingLabel: { textAlign: 'center', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold', color: '#B4725E' },

  textArea: {
    borderWidth: 1, borderColor: '#E6C9B9', borderRadius: 10,
    padding: 16, height: 120, fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#2A201D', backgroundColor: '#F8F8F8',
  },
  charCount: { textAlign: 'right', fontSize: 12, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', marginTop: 8 },

  urlInput: {
    borderWidth: 1, borderColor: '#E6C9B9', borderRadius: 10,
    padding: 16, fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#2A201D', backgroundColor: '#F8F8F8', marginBottom: 12,
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', padding: 24, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#43332E', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10,
  },
  submitBtn: {
    backgroundColor: '#B4725E', borderRadius: 12, paddingVertical: 18, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },
});

export default ReviewSubmitScreen;
