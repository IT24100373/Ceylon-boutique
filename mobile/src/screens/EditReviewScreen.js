import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import apiClient from '../api/client';

// -------------------------------------------------------
// FR5.4 — Edit Review Screen
// Pre-filled with existing review data.
// Only available within 72 hours of original submission.
// Reached from: MyReviewsScreen → "Edit" button
// Params: review (full review object from getMyReviews)
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

const EditReviewScreen = ({ route, navigation }) => {
  const { review } = route.params;

  const [rating, setRating] = useState(review.rating || 0);
  const [reviewText, setReviewText] = useState(review.reviewText || '');
  const [photo1, setPhoto1] = useState(review.photos?.[0] || '');
  const [photo2, setPhoto2] = useState(review.photos?.[1] || '');
  const [photo3, setPhoto3] = useState(review.photos?.[2] || '');
  const [saving, setSaving] = useState(false);

  // Determine display name for what's being reviewed
  const targetName = review.reviewType === 'product'
    ? (review.product?.name || 'Product')
    : (review.seller?.shopName || 'Seller');
  const typeLabel = review.reviewType === 'product' ? '🛍️ Product Review' : '🏪 Seller Review';

  const handleUpdate = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }

    const photos = [photo1, photo2, photo3].filter((p) => p.trim() !== '');

    try {
      setSaving(true);
      await apiClient.put(`/api/reviews/${review.id}`, {
        rating,
        reviewText: reviewText.trim(),
        photos,
      });

      Alert.alert(
        '✅ Review Updated',
        'Your review has been updated successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update review.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Review context card */}
        <View style={styles.contextCard}>
          <Text style={styles.typeLabel}>{typeLabel}</Text>
          <Text style={styles.targetName} numberOfLines={2}>{targetName}</Text>
          <View style={styles.windowBadge}>
            <Text style={styles.windowText}>
              ⏱️ {review.hoursUntilLock}h remaining to edit
            </Text>
          </View>
        </View>

        {/* Star rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Your Rating *</Text>
          <StarSelector rating={rating} onSelect={setRating} />
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
          )}
        </View>

        {/* Review text */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Your Review <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.textArea}
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share your experience..."
            placeholderTextColor="#aaa"
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{reviewText.length}/1000</Text>
        </View>

        {/* Photo URLs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Photos <Text style={styles.optional}>(optional — max 3 URLs)</Text></Text>
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

      {/* Save footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, (saving || rating === 0) && styles.saveBtnDisabled]}
          onPress={handleUpdate}
          disabled={saving || rating === 0}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Update Review</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  scroll: { padding: 16 },
  contextCard: {
    backgroundColor: '#FBE9E7', borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#FFCCBC',
  },
  typeLabel: { fontSize: 12, fontWeight: '700', color: '#8B2635', marginBottom: 4 },
  targetName: { fontSize: 16, fontWeight: '800', color: '#333', marginBottom: 10 },
  windowBadge: {
    alignSelf: 'flex-start', backgroundColor: '#fff',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  windowText: { fontSize: 12, color: '#F57C00', fontWeight: '600' },
  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#eee',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 12 },
  optional: { fontSize: 12, fontWeight: '400', color: '#aaa' },
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
  saveBtn: {
    backgroundColor: '#8B2635', borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default EditReviewScreen;
