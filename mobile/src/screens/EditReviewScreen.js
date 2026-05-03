import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert, Image, StatusBar, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/FontAwesome';
import FeatherIcon from 'react-native-vector-icons/Feather';

const StarSelector = ({ rating, onSelect }) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity key={star} onPress={() => onSelect(star)} style={styles.starBtn}>
        <Icon
          name={rating >= star ? "star" : "star-o"}
          size={40}
          color={rating >= star ? "#D4A853" : "#EEEADD"}
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

  const targetName = review.reviewType === 'product'
    ? (review.product?.name || 'Product')
    : (review.seller?.shopName || 'Seller');

  const typeLabel = review.reviewType === 'product' ? 'Product Experience' : 'Seller Service';
  const typeIcon = review.reviewType === 'product' ? 'package' : 'home';

  const handleUpdate = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating.');
      return;
    }

    const photos = [photo1, photo2, photo3].filter((p) => {
      if (!p) return false;
      if (typeof p === 'string') return p.trim() !== '';
      return true;
    });

    try {
      setSaving(true);

      let uploadedUrls = [...photos];
      const localPhotos = photos.filter(p => typeof p === 'object' && p.isLocal);

      if (localPhotos.length > 0) {
        const formData = new FormData();
        localPhotos.forEach((img) => {
          formData.append('images', {
            uri: img.uri,
            type: img.type,
            name: img.name || `review_edit_${Date.now()}.jpg`,
          });
        });

        const token = await require('@react-native-async-storage/async-storage').default.getItem('ceylon_token');
        const response = await fetch(`${apiClient.defaults.baseURL}/api/upload/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: formData,
        });

        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
          throw new Error(responseData.message || 'Image upload failed');
        }

        uploadedUrls = photos.map(p => {
          if (typeof p === 'string') return p;
          return responseData.images.shift() || p.uri;
        });
      }

      await apiClient.put(`/api/reviews/${review.id || review._id}`, {
        rating,
        reviewText: reviewText.trim(),
        photos: uploadedUrls,
      });

      Alert.alert(
        'Review Updated',
        'Your feedback has been successfully modified.',
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Context Card */}
          <View style={styles.contextCard}>
            <View style={styles.typeBadge}>
              <FeatherIcon name={typeIcon} size={12} color="#8A8178" style={{ marginRight: 6 }} />
              <Text style={styles.typeLabel}>{typeLabel.toUpperCase()}</Text>
            </View>
            <Text style={styles.targetName}>{targetName}</Text>
            <View style={styles.timeBadge}>
              <FeatherIcon name="clock" size={12} color="#D4A853" style={{ marginRight: 6 }} />
              <Text style={styles.timeText}>{review.hoursUntilLock}h remaining to edit</Text>
            </View>
          </View>

          {/* Rating Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Satisfaction Score</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.ratingCard}>
              <StarSelector rating={rating} onSelect={setRating} />
              {rating > 0 && (
                <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
              )}
            </View>
          </View>

          {/* Review Text Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Written Feedback</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.textArea}
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="Share more details about your experience..."
                placeholderTextColor="#A8A19A"
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{reviewText.length} / 1000 characters</Text>
            </View>
          </View>

          {/* Media Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Visual Gallery</Text>
              <View style={styles.sectionLine} />
            </View>
            
            <TouchableOpacity style={styles.uploadBtn} onPress={async () => {
              const currentPhotosCount = [photo1, photo2, photo3].filter(p => p !== '').length;
              if (currentPhotosCount >= 3) {
                Alert.alert('Limit reached', 'You can upload up to 3 photos.');
                return;
              }
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission required', 'We need access to your gallery to upload photos.');
                return;
              }
              let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });
              if (!result.canceled && result.assets && result.assets.length > 0) {
                const newPhoto = { uri: result.assets[0].uri, isLocal: true, type: 'image/jpeg', name: result.assets[0].uri.split('/').pop() || 'image.jpg' };
                if (!photo1) setPhoto1(newPhoto);
                else if (!photo2) setPhoto2(newPhoto);
                else if (!photo3) setPhoto3(newPhoto);
              }
            }}>
              <FeatherIcon name="camera" size={18} color="#2E2A26" style={{ marginRight: 10 }} />
              <Text style={styles.uploadBtnText}>Add Photos from Gallery</Text>
            </TouchableOpacity>

            <View style={styles.mediaGrid}>
              {[photo1, photo2, photo3].map((photo, idx) => {
                if (!photo) return null;
                const isLocal = typeof photo === 'object' && photo.isLocal;
                const displayUrl = isLocal ? photo.uri : photo;
                return (
                  <View key={`photo-${idx}`} style={styles.mediaItem}>
                    <Image source={{ uri: displayUrl }} style={styles.mediaPreview} />
                    <TouchableOpacity 
                      onPress={() => {
                        if (idx === 0) setPhoto1('');
                        if (idx === 1) setPhoto2('');
                        if (idx === 2) setPhoto3('');
                      }} 
                      style={styles.removeMediaBtn}
                    >
                      <FeatherIcon name="x" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* URL Fallback */}
            {[photo1, photo2, photo3].map((photo, idx) => {
              if (photo) return null;
              return (
                <TextInput
                  key={`url-${idx}`}
                  style={styles.urlInput}
                  value=""
                  onChangeText={val => {
                    if (idx === 0) setPhoto1(val);
                    if (idx === 1) setPhoto2(val);
                    if (idx === 2) setPhoto3(val);
                  }}
                  placeholder={`Or paste Image URL ${idx + 1}...`}
                  placeholderTextColor="#A8A19A"
                  autoCapitalize="none"
                />
              );
            })}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Footer Action */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.updateBtn, (saving || rating === 0) && styles.disabledBtn]}
            onPress={handleUpdate}
            disabled={saving || rating === 0}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <FeatherIcon name="check-circle" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
                <Text style={styles.updateBtnText}>Save Modifications</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },

  contextCard: {
    backgroundColor: '#F8F6F4', borderRadius: 24, padding: 24, marginBottom: 25,
    borderWidth: 1, borderColor: '#EEEADD'
  },
  typeBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  typeLabel: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#8A8178', letterSpacing: 1 },
  targetName: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 15 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#F0EBE5' },
  timeText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#D4A853' },

  section: { marginBottom: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#2E2A26', textTransform: 'uppercase', letterSpacing: 1.5, marginRight: 15 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#F0EBE5' },

  ratingCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#F0EBE5' },
  starRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  starBtn: { padding: 4 },
  ratingLabel: { fontSize: 16, fontFamily: 'Cinzel_700Bold', color: '#D4A853' },

  inputCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F0EBE5' },
  textArea: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', minHeight: 120, lineHeight: 22 },
  charCount: { textAlign: 'right', fontSize: 11, fontFamily: 'Montserrat_600SemiBold', color: '#A8A19A', marginTop: 15 },

  uploadBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    backgroundColor: '#F8F6F4', paddingVertical: 16, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#EEEADD' 
  },
  uploadBtnText: { color: '#2E2A26', fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  mediaGrid: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  mediaItem: { position: 'relative', width: 80, height: 80 },
  mediaPreview: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#F8F6F4' },
  removeMediaBtn: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  urlInput: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', borderWidth: 1, borderColor: '#F0EBE5', marginBottom: 12 },

  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', 
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, borderTopWidth: 1, borderTopColor: '#F0EBE5'
  },
  updateBtn: { 
    backgroundColor: '#2E2A26', paddingVertical: 18, borderRadius: 16, alignItems: 'center', 
    flexDirection: 'row', justifyContent: 'center', shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 
  },
  updateBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  disabledBtn: { opacity: 0.6 },
});

export default EditReviewScreen;
