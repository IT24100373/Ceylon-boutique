import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, Image, StatusBar
} from 'react-native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

// -------------------------------------------------------
// FR5.2 — Product Reviews Screen
// Paginated list of reviews for a specific product.
// Reached from: ProductDetailScreen → tap review count
// Params: productId, productName (optional for header)
// -------------------------------------------------------

const StarDisplay = ({ rating, size = 14 }) => {
  const filled = Math.round(rating);
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="star"
          size={size}
          color={star <= filled ? "#B4725E" : "#E6C9B9"}
          solid={star <= filled}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
};

const RatingBar = ({ star, count, total }) => {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{star} <Icon name="star" size={10} color="#8C7A74" solid /></Text>
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
      <Icon name="thumbs-up" size={14} color="#8C7A74" style={{ marginRight: 6 }} />
      <Text style={styles.helpfulText}>Helpful ({review.helpfulCount})</Text>
    </TouchableOpacity>
  </View>
);

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'highest', label: 'Highest Rated' },
  { key: 'helpful', label: 'Most Helpful' },
];

const ProductReviewsScreen = ({ route, navigation }) => {
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
        <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
        <ActivityIndicator size="large" color="#B4725E" />
      </View>
    );
  }

  const ListHeader = () => (
    <View>
      {/* Rating Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.averageNumber}>{averageRating}</Text>
          <View style={{ marginVertical: 8 }}>
            <StarDisplay rating={parseFloat(averageRating)} size={16} />
          </View>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
        </ScrollView>
      </View>

      {reviews.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Icon name="star" size={40} color="#B4725E" />
          </View>
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to review this product!</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#43332E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{productName || 'Reviews'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewCard review={item} />}
        ListHeaderComponent={<ListHeader />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? (
          <ActivityIndicator size="small" color="#B4725E" style={{ marginVertical: 20 }} />
        ) : null}
        contentContainerStyle={styles.list}
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
  headerTitle: { flex: 1, fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', textAlign: 'center', paddingHorizontal: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF1E8' },
  list: { paddingBottom: 40 },

  summaryCard: {
    backgroundColor: '#FFFFFF', flexDirection: 'row', padding: 24,
    margin: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', marginRight: 24, width: 90 },
  averageNumber: { fontSize: 48, fontFamily: 'PlayfairDisplay_700Bold', color: '#B4725E', lineHeight: 52 },
  totalCount: { fontSize: 13, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', marginTop: 4 },
  summaryRight: { flex: 1, justifyContent: 'center' },

  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  barLabel: { fontSize: 13, fontFamily: 'InstrumentSans_600SemiBold', color: '#43332E', width: 24, marginRight: 8, flexDirection: 'row', alignItems: 'center' },
  barTrack: { flex: 1, height: 8, backgroundColor: '#F8F8F8', borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#E6C9B9' },
  barFill: { height: 8, backgroundColor: '#B4725E', borderRadius: 4 },
  barCount: { fontSize: 13, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', width: 24, textAlign: 'right', marginLeft: 8 },

  sortRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  sortChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6C9B9',
    marginRight: 8,
  },
  sortChipActive: { backgroundColor: '#FFF5EE', borderColor: '#B4725E' },
  sortChipText: { fontSize: 13, fontFamily: 'InstrumentSans_600SemiBold', color: '#8C7A74' },
  sortChipTextActive: { color: '#B4725E' },

  reviewCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 16,
    borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#E6C9B9',
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewerAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF5EE',
    alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#E6C9B9'
  },
  reviewerInitial: { color: '#B4725E', fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18 },
  reviewerMeta: { flex: 1 },
  reviewerName: { fontSize: 15, fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D' },
  reviewDate: { fontSize: 13, fontFamily: 'InstrumentSans_400Regular', color: '#8C7A74', marginTop: 2 },
  editedTag: { color: '#8C7A74', fontStyle: 'italic' },

  reviewText: { fontSize: 14, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', lineHeight: 22, marginBottom: 12 },

  photosRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  reviewPhoto: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#E6C9B9' },

  helpfulBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F8F8F8', borderRadius: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E6C9B9' },
  helpfulText: { fontSize: 13, fontFamily: 'InstrumentSans_600SemiBold', color: '#8C7A74' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F7D9C4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#43332E' },
});

export default ProductReviewsScreen;
