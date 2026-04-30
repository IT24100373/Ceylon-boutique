import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, Image,
} from 'react-native';
import apiClient from '../api/client';

// -------------------------------------------------------
// FR5.2 — Product Reviews Screen
// Paginated list of reviews for a specific product.
// Reached from: ProductDetailScreen → tap review count
// Params: productId, productName (optional for header)
// -------------------------------------------------------

const StarDisplay = ({ rating, size = 14 }) => {
  const filled = Math.round(rating);
  return (
    <Text style={{ fontSize: size, color: '#F57C00' }}>
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
    </Text>
  );
};

const RatingBar = ({ star, count, total }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{star}★</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.barCount}>{count}</Text>
    </View>
  );
};

const ReviewCard = ({ review }) => (
  <View style={styles.reviewCard}>
    <View style={styles.reviewHeader}>
      <View style={styles.reviewerAvatar}>
        <Text style={styles.reviewerInitial}>
          {review.reviewerName?.charAt(0).toUpperCase() || 'C'}
        </Text>
      </View>
      <View style={styles.reviewerMeta}>
        <Text style={styles.reviewerName}>{review.reviewerName}</Text>
        <Text style={styles.reviewDate}>
          {new Date(review.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
          {review.isEdited && <Text style={styles.editedTag}> · Edited</Text>}
        </Text>
      </View>
      <StarDisplay rating={review.rating} size={14} />
    </View>

    {review.reviewText ? (
      <Text style={styles.reviewText}>{review.reviewText}</Text>
    ) : null}

    {review.photos && review.photos.length > 0 && (
      <View style={styles.photosRow}>
        {review.photos.map((uri, i) => (
          <Image key={i} source={{ uri }} style={styles.reviewPhoto} />
        ))}
      </View>
    )}

    <TouchableOpacity style={styles.helpfulBtn}>
      <Text style={styles.helpfulText}>👍 Helpful ({review.helpfulCount})</Text>
    </TouchableOpacity>
  </View>
);

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'highest', label: 'Highest Rated' },
  { key: 'helpful', label: 'Most Helpful' },
];

const ProductReviewsScreen = ({ route }) => {
  const { productId, productName } = route.params;

  const [reviews, setReviews] = useState([]);
  const [ratingBreakdown, setRatingBreakdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  const fetchReviews = useCallback(async (pageNum = 1, sort = sortBy, reset = true) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res = await apiClient.get(`/api/reviews/product/${productId}`, {
        params: { sortBy: sort, page: pageNum, limit: 10 },
      });

      const data = res.data;
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setRatingBreakdown(data.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

      // Calculate average from breakdown
      const bd = data.ratingBreakdown || {};
      const totalCount = Object.values(bd).reduce((a, b) => a + b, 0);
      const weightedSum = Object.entries(bd).reduce((a, [star, cnt]) => a + parseInt(star) * cnt, 0);
      setAverageRating(totalCount > 0 ? (weightedSum / totalCount).toFixed(1) : 0);

      if (reset) {
        setReviews(data.reviews);
      } else {
        setReviews((prev) => [...prev, ...data.reviews]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load reviews.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [productId, sortBy]);

  useEffect(() => {
    setPage(1);
    fetchReviews(1, sortBy, true);
  }, [sortBy]);

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      const next = page + 1;
      setPage(next);
      fetchReviews(next, sortBy, false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B2635" />
      </View>
    );
  }

  const ListHeader = () => (
    <View>
      {/* Rating Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.averageNumber}>{averageRating}</Text>
          <StarDisplay rating={parseFloat(averageRating)} size={22} />
          <Text style={styles.totalCount}>{total} {total === 1 ? 'review' : 'reviews'}</Text>
        </View>
        <View style={styles.summaryRight}>
          {[5, 4, 3, 2, 1].map((star) => (
            <RatingBar key={star} star={star} count={ratingBreakdown[star] || 0} total={total} />
          ))}
        </View>
      </View>

      {/* Sort selector */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortChip, sortBy === opt.key && styles.sortChipActive]}
            onPress={() => setSortBy(opt.key)}
          >
            <Text style={[styles.sortChipText, sortBy === opt.key && styles.sortChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {reviews.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⭐</Text>
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to review this product!</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewCard review={item} />}
        ListHeaderComponent={<ListHeader />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? (
          <ActivityIndicator size="small" color="#8B2635" style={{ marginVertical: 20 }} />
        ) : null}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingBottom: 40 },
  summaryCard: {
    backgroundColor: '#fff', flexDirection: 'row', padding: 20,
    margin: 16, borderRadius: 16, borderWidth: 1, borderColor: '#eee',
  },
  summaryLeft: { alignItems: 'center', marginRight: 20, width: 80 },
  averageNumber: { fontSize: 48, fontWeight: '900', color: '#333', lineHeight: 52 },
  totalCount: { fontSize: 12, color: '#888', marginTop: 4 },
  summaryRight: { flex: 1, justifyContent: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  barLabel: { fontSize: 12, color: '#888', width: 18, marginRight: 6 },
  barTrack: { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: '#F57C00', borderRadius: 4 },
  barCount: { fontSize: 12, color: '#888', width: 24, textAlign: 'right', marginLeft: 6 },
  sortRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 10, gap: 8 },
  sortChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f0f0f0', borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  sortChipActive: { backgroundColor: '#FBE9E7', borderColor: '#8B2635' },
  sortChipText: { fontSize: 12, fontWeight: '600', color: '#888' },
  sortChipTextActive: { color: '#8B2635' },
  reviewCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eee',
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewerAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#8B2635',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  reviewerInitial: { color: '#fff', fontWeight: '800', fontSize: 16 },
  reviewerMeta: { flex: 1 },
  reviewerName: { fontSize: 14, fontWeight: '700', color: '#333' },
  reviewDate: { fontSize: 12, color: '#aaa', marginTop: 1 },
  editedTag: { color: '#aaa', fontStyle: 'italic' },
  reviewText: { fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 10 },
  photosRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  reviewPhoto: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f0f0f0' },
  helpfulBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  helpfulText: { fontSize: 13, color: '#888' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 50, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#888' },
});

export default ProductReviewsScreen;
