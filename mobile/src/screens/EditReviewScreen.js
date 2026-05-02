import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert, StatusBar
} from 'react-native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

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

  const typeLabel = review.reviewType === 'product' ? 'Product Review' : 'Seller Review';
  const typeIcon = review.reviewType === 'product' ? 'package' : 'home';

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
        'Review Updated',
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
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Review context card */}
        <View style={styles.contextCard}>
          <View style={styles.typeRow}>
            <Icon name={typeIcon} size={14} color="#2E2A26" style={{ marginRight: 6 }} />
            <Text style={styles.typeLabel}>{typeLabel}</Text>
          </View>
          <Text style={styles.targetName} numberOfLines={2}>{targetName}</Text>
          <View style={styles.windowBadge}>
            <Icon name="clock" size={12} color="#2E2A26" style={{ marginRight: 6 }} />
            <Text style={styles.windowText}>
              {review.hoursUntilLock}h remaining to edit
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
            placeholderTextColor="#8A8178"
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
            placeholderTextColor="#8A8178"
            autoCapitalize="none"
            keyboardType="url"
          />
          <TextInput
            style={styles.urlInput}
            value={photo2}
            onChangeText={setPhoto2}
            placeholder="Photo URL 2"
            placeholderTextColor="#8A8178"
            autoCapitalize="none"
            keyboardType="url"
          />
          <TextInput
            style={styles.urlInput}
            value={photo3}
            onChangeText={setPhoto3}
            placeholder="Photo URL 3"
            placeholderTextColor="#8A8178"
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
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Update Review</Text>
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

  contextCard: {
    backgroundColor: '#EEEADDFF', borderRadius: 14, padding: 20,
    marginBottom: 16,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  typeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  typeLabel: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178' },
  targetName: { fontSize: 16, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 16, lineHeight: 22 },

  windowBadge: {
    alignSelf: 'flex-start', backgroundColor: '#EEEADDFF',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center',
  },
  windowText: { fontSize: 12, color: '#5C554F', fontFamily: 'Montserrat_600SemiBold' },

  section: {
    backgroundColor: '#EEEADDFF', borderRadius: 14, padding: 20,
    marginBottom: 16,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 16 },
  optional: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#2E2A26' },

  starRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  starBtn: { padding: 6 },
  ratingLabel: { textAlign: 'center', fontSize: 16, fontFamily: 'Montserrat_600SemiBold', color: '#6c5f52ff' },

  textArea: {
    borderRadius: 10,
    padding: 16, height: 120, fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', backgroundColor: '#FFFFFF',
  },
  charCount: { textAlign: 'right', fontSize: 12, fontFamily: 'Montserrat_400Regular', color: '#5C554F', marginTop: 8 },

  urlInput: {
    borderRadius: 10,
    padding: 16, fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', backgroundColor: '#FFFFFF', marginBottom: 12,
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#EEEADDFF', padding: 24, paddingBottom: 32, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10,
  },
  saveBtn: {
    backgroundColor: '#EEEADDFF', borderRadius: 12, paddingVertical: 18, alignItems: 'center',
    borderWidth: 1, borderColor: '#2E2A26',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#5C554F', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});

export default EditReviewScreen;
