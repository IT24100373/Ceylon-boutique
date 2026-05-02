import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, StatusBar
} from 'react-native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

// -------------------------------------------------------
// Customer — My Reviews Screen
// Shows all reviews the logged-in customer has submitted.
// Edit available within 72h; delete available always.
// Reached from: ProfileScreen → "My Reviews"
// -------------------------------------------------------

const StarDisplay = ({ rating }) => {
  const filled = Math.round(rating);
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="star"
          size={16}
          color={star <= filled ? "#B4725E" : "#E6C9B9"}
          style={styles.starIcon}
          solid={star <= filled}
        />
      ))}
    </View>
  );
};

const MyReviewsScreen = ({ navigation }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchReviews = useCallback(async (pageNum = 1, reset = true) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await apiClient.get('/api/reviews/my-reviews', {
        params: { page: pageNum, limit: 10 },
      });

      setTotalPages(res.data.totalPages);

      if (reset) {
        setReviews(res.data.reviews);
      } else {
        setReviews((prev) => [...prev, ...res.data.reviews]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load your reviews.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchReviews(1, true);
      setPage(1);
    });
    return unsubscribe;
  }, [navigation, fetchReviews]);

  const handleDelete = (reviewId) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(reviewId);
              await apiClient.delete(`/api/reviews/${reviewId}`);
              setReviews((prev) => prev.filter((r) => r.id !== reviewId));
              Alert.alert('Deleted', 'Your review has been deleted.');
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete review.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      const next = page + 1;
      setPage(next);
      fetchReviews(next, false);
    }
  };

  const renderItem = ({ item }) => {
    const isProduct = item.reviewType === 'product';
    const targetName = isProduct
      ? (item.product?.name || 'Product')
      : (item.seller?.shopName || 'Seller');

    const isDeleting = deletingId === item.id;

    return (
      <View style={styles.card}>
        {/* Header: type badge + target name */}
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, isProduct ? styles.typeBadgeProduct : styles.typeBadgeSeller]}>
            <Icon name={isProduct ? "package" : "home"} size={12} color={isProduct ? "#2A201D" : "#4A148C"} style={{ marginRight: 6 }} />
            <Text style={[styles.typeBadgeText, { color: isProduct ? '#2A201D' : '#4A148C' }]}>
              {isProduct ? 'Product' : 'Seller'}
            </Text>
          </View>
          <View style={styles.editWindowBadge}>
            <Icon name={item.canEdit ? "edit-2" : "lock"} size={12} color="#8C7A74" style={{ marginRight: 4 }} />
            <Text style={styles.editWindow}>
              {item.canEdit
                ? `${item.hoursUntilLock}h left to edit`
                : 'Locked'}
            </Text>
          </View>
        </View>

        <Text style={styles.targetName} numberOfLines={2}>{targetName}</Text>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <StarDisplay rating={item.rating} />
          <Text style={styles.ratingNum}>{item.rating}/5</Text>
          {item.isEdited && <Text style={styles.editedTag}> · Edited</Text>}
        </View>

        {/* Review text */}
        {item.reviewText ? (
          <Text style={styles.reviewText} numberOfLines={3}>{item.reviewText}</Text>
        ) : (
          <Text style={styles.noText}>No written review.</Text>
        )}

        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </Text>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {item.canEdit && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditReview', { review: item })}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.deleteBtn, isDeleting && styles.deleteBtnDisabled]}
            onPress={() => handleDelete(item.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#D32F2F" />
            ) : (
              <Text style={styles.deleteBtnText}>Delete</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
        <ActivityIndicator size="large" color="#B4725E" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#43332E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? (
          <ActivityIndicator size="small" color="#B4725E" style={{ marginVertical: 20 }} />
        ) : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Icon name="star" size={40} color="#B4725E" />
            </View>
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptySubtitle}>
              After your orders are delivered, you can rate your purchases here.
            </Text>
          </View>
        }
        contentContainerStyle={reviews.length === 0 ? styles.emptyContainer : styles.list}
        showsVerticalScrollIndicator={false}
      />
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF1E8' },

  list: { padding: 16, paddingBottom: 40 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, paddingBottom: 80 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  typeBadgeProduct: { backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#E6C9B9' },
  typeBadgeSeller: { backgroundColor: '#F3E5F5', borderWidth: 1, borderColor: '#E1BEE7' },
  typeBadgeText: { fontSize: 12, fontFamily: 'InstrumentSans_600SemiBold' },

  editWindowBadge: { flexDirection: 'row', alignItems: 'center' },
  editWindow: { fontSize: 12, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74' },

  targetName: { fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D', marginBottom: 8, lineHeight: 22 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  starRow: { flexDirection: 'row', marginRight: 8 },
  starIcon: { marginRight: 2 },
  ratingNum: { fontSize: 14, fontFamily: 'InstrumentSans_600SemiBold', color: '#43332E' },
  editedTag: { fontSize: 12, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', fontStyle: 'italic', marginLeft: 4 },

  reviewText: { fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', lineHeight: 22, marginBottom: 12 },
  noText: { fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', fontStyle: 'italic', marginBottom: 12 },
  dateText: { fontSize: 12, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', marginBottom: 16 },

  actionRow: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  editBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#B4725E',
  },
  editBtnText: { color: '#B4725E', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14 },
  deleteBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D32F2F',
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { color: '#D32F2F', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14 },

  emptyState: { alignItems: 'center' },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F7D9C4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 12 },
  emptySubtitle: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', textAlign: 'center', lineHeight: 22, opacity: 0.8 },
});

export default MyReviewsScreen;
