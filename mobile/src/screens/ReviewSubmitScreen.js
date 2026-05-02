import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert, Image, StatusBar
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
          color={rating >= star ? "#2E2A26" : "#8A8178"}
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

      // Upload any local photos first
      let uploadedUrls = [...photos];
      const localPhotos = photos.filter(p => typeof p === 'object' && p.isLocal);

      if (localPhotos.length > 0) {
        const formData = new FormData();
        localPhotos.forEach((img) => {
          formData.append('images', {
            uri: img.uri,
            type: img.type,
            name: img.name || `review_${Date.now()}.jpg`,
          });
        });

        const token = await require('@react-native-async-storage/async-storage').default.getItem('ceylon_token');
        const response = await fetch(`${apiClient.defaults.baseURL}/api/upload/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
          throw new Error(responseData.message || 'Image upload failed');
        }

        // Merge uploaded URLs
        uploadedUrls = photos.map(p => {
          if (typeof p === 'string') return p;
          return responseData.images.shift() || p.uri;
        });
      }

      payload.photos = uploadedUrls;

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
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Product card */}
        <View style={styles.productCard}>
          {orderItem.productImage ? (
            <Image source={{ uri: orderItem.productImage }} style={styles.productImage} />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Icon name="image" size={24} color="#2E2A26" />
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
              <Icon name="package" size={18} color={reviewType === 'product' ? '#EEEADDFF' : '#5C554F'} style={{ marginBottom: 6 }} />
              <Text style={[styles.toggleText, reviewType === 'product' && styles.toggleTextActive]}>
                Product
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, reviewType === 'seller' && styles.toggleBtnActive]}
              onPress={() => setReviewType('seller')}
            >
              <Icon name="home" size={18} color={reviewType === 'seller' ? '#EEEADDFF' : '#5C554F'} style={{ marginBottom: 6 }} />
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
            placeholderTextColor="#8A8178"
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{reviewText.length}/1000</Text>
        </View>

        {/* Photo URLs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos <Text style={styles.optional}>(optional — max 3)</Text></Text>

          <TouchableOpacity style={styles.uploadBtn} onPress={async () => {
            const currentPhotosCount = [photo1, photo2, photo3].filter(p => p !== '').length;
            if (currentPhotosCount >= 3) {
              Alert.alert('Limit', 'Maximum 3 photos allowed.');
              return;
            }

            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
              return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
              const newPhoto = { uri: result.assets[0].uri, isLocal: true, type: result.assets[0].type || 'image/jpeg', name: result.assets[0].uri.split('/').pop() };
              if (!photo1) setPhoto1(newPhoto);
              else if (!photo2) setPhoto2(newPhoto);
              else if (!photo3) setPhoto3(newPhoto);
            }
          }}>
            <Icon name="upload" size={18} color="#2E2A26" style={{ marginRight: 8 }} />
            <Text style={styles.uploadBtnText}>Upload from Device</Text>
          </TouchableOpacity>

          {[photo1, photo2, photo3].map((photo, idx) => {
            if (!photo) return null;
            const isLocal = typeof photo === 'object' && photo.isLocal;
            const displayUrl = isLocal ? photo.uri : photo;
            return (
              <View key={`photo-${idx}`} style={styles.imageItem}>
                <Image source={{ uri: displayUrl }} style={styles.imagePreview} />
                <TextInput
                  style={[styles.urlInput, { flex: 1, marginBottom: 0,  backgroundColor: 'transparent' }]}
                  value={isLocal ? 'Local File' : photo}
                  onChangeText={val => {
                    if (idx === 0) setPhoto1(val);
                    if (idx === 1) setPhoto2(val);
                    if (idx === 2) setPhoto3(val);
                  }}
                  editable={!isLocal}
                  placeholder={`Photo URL ${idx + 1}`}
                  placeholderTextColor="#8A8178"
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <TouchableOpacity onPress={() => {
                  if (idx === 0) setPhoto1('');
                  if (idx === 1) setPhoto2('');
                  if (idx === 2) setPhoto3('');
                }} style={styles.removeBtn}>
                  <Icon name="trash-2" size={18} color="#2E2A26" />
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Keep URL inputs for empty slots if they want to paste a URL */}
          {[photo1, photo2, photo3].map((photo, idx) => {
            if (photo) return null;
            return (
              <TextInput
                key={`empty-${idx}`}
                style={[styles.urlInput, { marginTop: 10 }]}
                value=""
                onChangeText={val => {
                  if (idx === 0) setPhoto1(val);
                  if (idx === 1) setPhoto2(val);
                  if (idx === 2) setPhoto3(val);
                }}
                placeholder={`Or paste Photo URL ${idx + 1} here`}
                placeholderTextColor="#8A8178"
                autoCapitalize="none"
                keyboardType="url"
              />
            );
          })}
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },
  scroll: { padding: 16 },

  productCard: {
    flexDirection: 'row', backgroundColor: '#EEEADDFF', borderRadius: 14,
    padding: 16, marginBottom: 16,  
    alignItems: 'center', shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  productImage: { width: 64, height: 64, borderRadius: 10, marginRight: 16, backgroundColor: '#FFFFFF',  },
  productImagePlaceholder: {
    width: 64, height: 64, borderRadius: 10, marginRight: 16,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',  
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26', marginBottom: 4 },
  productVariant: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#2E2A26' },

  section: {
    backgroundColor: '#EEEADDFF', borderRadius: 14, padding: 20,
    marginBottom: 16,  
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 16 },
  optional: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#2E2A26' },

  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#FFFFFF',
  },
  toggleBtnActive: {  backgroundColor: '#EEEADDFF' },
  toggleText: { fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },
  toggleTextActive: { color: '#5C554F' },

  starRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  starBtn: { padding: 6 },
  ratingLabel: { textAlign: 'center', fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178' },

  textArea: {
      borderRadius: 10,
    padding: 16, height: 120, fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', backgroundColor: '#FFFFFF',
  },
  charCount: { textAlign: 'right', fontSize: 12, fontFamily: 'Montserrat_400Regular', color: '#5C554F', marginTop: 8 },

  urlInput: {
      borderRadius: 10,
    padding: 16, fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', backgroundColor: '#FFFFFF', marginBottom: 12,
  },

  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#EEEADDFF', paddingVertical: 14, borderRadius: 10,
    marginBottom: 16, borderWidth: 1, borderColor: '#2E2A26',
  },
  uploadBtnText: { color: '#5C554F', fontFamily: 'Montserrat_600SemiBold', fontSize: 14 },
  imageItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12,   borderRadius: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 12, marginBottom: 10
  },
  imagePreview: {
    width: 40, height: 40, borderRadius: 6, marginRight: 10, backgroundColor: '#8A8178'
  },
  removeBtn: { padding: 4 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#EEEADDFF', padding: 24, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10,
  },
  submitBtn: {
    backgroundColor: '#EEEADDFF', borderRadius: 12, paddingVertical: 18, alignItems: 'center',
    borderWidth: 1, borderColor: '#2E2A26',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#8A8178', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

export default ReviewSubmitScreen;
