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
          color={rating >= star ? "#B4725E" : "#E6C9B9"}
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#43332E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Review</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Review context card */}
        <View style={styles.contextCard}>
          <View style={styles.typeRow}>
            <Icon name={typeIcon} size={14} color="#B4725E" style={{ marginRight: 6 }} />
            <Text style={styles.typeLabel}>{typeLabel}</Text>
          </View>
          <Text style={styles.targetName} numberOfLines={2}>{targetName}</Text>
          <View style={styles.windowBadge}>
            <Icon name="clock" size={12} color="#D4A853" style={{ marginRight: 6 }} />
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
            placeholderTextColor="#A0938E"
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
  container: { flex: 1, backgroundColor: '#FFF1E8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF1E8'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },
  scroll: { padding: 16 },

  contextCard: {
    backgroundColor: '#FFF5EE', borderRadius: 14, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  typeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  typeLabel: { fontSize: 13, fontFamily: 'InstrumentSans_600SemiBold', color: '#B4725E' },
  targetName: { fontSize: 16, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 16, lineHeight: 22 },

  windowBadge: {
    alignSelf: 'flex-start', backgroundColor: '#FFFFFF',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E6C9B9',
  },
  windowText: { fontSize: 12, color: '#D4A853', fontFamily: 'InstrumentSans_600SemiBold' },

  section: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 16 },
  optional: { fontSize: 13, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74' },

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
  saveBtn: {
    backgroundColor: '#B4725E', borderRadius: 12, paddingVertical: 18, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },
});

export default EditReviewScreen;
