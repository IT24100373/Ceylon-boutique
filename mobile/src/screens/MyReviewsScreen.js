import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import apiClient from '../api/client';

// -------------------------------------------------------
// Customer — My Reviews Screen
// Shows all reviews the logged-in customer has submitted.
// Edit available within 72h; delete available always.
// Reached from: ProfileScreen → "My Reviews"
// -------------------------------------------------------

const StarDisplay = ({ rating }) => {
  const filled = Math.round(rating);
  return (
    <Text style={styles.stars}>
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
    </Text>
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
            <Text style={styles.typeBadgeText}>
              {isProduct ? '🛍️ Product' : '🏪 Seller'}
            </Text>
          </View>
          <Text style={styles.editWindow}>
            {item.canEdit
              ? `✏️ Editable · ${item.hoursUntilLock}h left`
              : '🔒 Locked'}
          </Text>
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
        <ActivityIndicator size="large" color="#8B2635" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? (
          <ActivityIndicator size="small" color="#8B2635" style={{ marginVertical: 20 }} />
        ) : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⭐</Text>
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
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: '#eee',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeProduct: { backgroundColor: '#E3F2FD' },
  typeBadgeSeller: { backgroundColor: '#F3E5F5' },
  typeBadgeText: { fontSize: 12, fontWeight: '700' },
  editWindow: { fontSize: 11, color: '#888' },
  targetName: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stars: { fontSize: 18, color: '#F57C00', marginRight: 6 },
  ratingNum: { fontSize: 13, fontWeight: '600', color: '#555' },
  editedTag: { fontSize: 12, color: '#aaa', fontStyle: 'italic', marginLeft: 4 },
  reviewText: { fontSize: 14, color: '#555', lineHeight: 21, marginBottom: 8 },
  noText: { fontSize: 13, color: '#bbb', fontStyle: 'italic', marginBottom: 8 },
  dateText: { fontSize: 12, color: '#aaa', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#8B2635',
  },
  editBtnText: { color: '#8B2635', fontWeight: '700', fontSize: 14 },
  deleteBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D32F2F',
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { color: '#D32F2F', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center' },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#333', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
});

export default MyReviewsScreen;
