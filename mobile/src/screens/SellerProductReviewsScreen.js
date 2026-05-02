import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, Image, StatusBar, ScrollView
} from 'react-native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

const StarDisplay = ({ rating, size = 14 }) => {
  const filled = Math.round(rating);
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="star"
          size={size}
          color={star <= filled ? "#EEEADDFF" : "#EEEADDFF"}
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
      <Text style={styles.barLabel}>{star} <Icon name="star" size={10} color="#2E2A26" solid /></Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.barCount}>{count}</Text>
    </View>
  );
};

const ReviewCard = ({ review }) => (
  <View style={styles.reviewCard}>
    {/* Product info banner at the top of the review */}
    <View style={styles.productBanner}>
      {review.productImage ? (
        <Image source={{ uri: review.productImage }} style={styles.productBannerImg} />
      ) : (
        <View style={styles.productBannerPlaceholder}>
          <Icon name="package" size={16} color="#2E2A26" />
        </View>
      )}
      <Text style={styles.productBannerName} numberOfLines={1}>{review.productName}</Text>
    </View>

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
      <Icon name="thumbs-up" size={14} color="#2E2A26" style={{ marginRight: 6 }} />
      <Text style={styles.helpfulText}>Helpful ({review.helpfulCount})</Text>
    </TouchableOpacity>
  </View>
);

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'highest', label: 'Highest Rated' },
  { key: 'helpful', label: 'Most Helpful' },
];

const SellerProductReviewsScreen = ({ route, navigation }) => {
  const { sellerId, shopName } = route.params;

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

      const res = await apiClient.get(`/api/reviews/seller/${sellerId}/products`, {
        params: { sortBy: sort, page: pageNum, limit: 10 },
      });

      const data = res.data;
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setRatingBreakdown(data.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

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
      Alert.alert('Error', 'Failed to load product reviews.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sellerId, sortBy]);

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
        <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
        <ActivityIndicator size="large" color="#EEEADDFF" />
      </View>
    );
  }

  const ListHeader = () => (
    <View>
      {/* Shop name header */}
      {shopName && (
        <View style={styles.shopHeader}>
          <Icon name="package" size={20} color="#2E2A26" style={{ marginRight: 10 }} />
          <Text style={styles.shopName}>Product Reviews for {shopName}</Text>
        </View>
      )}

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
            <Icon name="star" size={40} color="#2E2A26" />
          </View>
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptySubtitle}>Your products haven't received any reviews yet.</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#2E2A26" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Reviews</Text>
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
          <ActivityIndicator size="small" color="#EEEADDFF" style={{ marginVertical: 20 }} />
        ) : null}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  list: { paddingBottom: 40 },

  shopHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, backgroundcolor: '#2E2A26',  
  },
  shopName: { fontSize: 16, fontFamily: 'Cinzel_700Bold', color: '#2E2A26' },

  summaryCard: {
    backgroundColor: '#EEEADDFF', flexDirection: 'row', padding: 24,
    margin: 16, borderRadius: 16,  
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', marginRight: 24, width: 90 },
  averageNumber: { fontSize: 48, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', lineHeight: 52 },
  totalCount: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', marginTop: 4 },
  summaryRight: { flex: 1, justifyContent: 'center' },

  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  barLabel: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', width: 24, marginRight: 8, flexDirection: 'row', alignItems: 'center' },
  barTrack: { flex: 1, height: 8, backgroundColor: '#FFFFFF', borderRadius: 4, overflow: 'hidden',  },
  barFill: { height: 8, backgroundColor: '#EEEADDFF', borderRadius: 4 },
  barCount: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#5C554F', width: 24, textAlign: 'right', marginLeft: 8 },

  sortRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  sortChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#EEEADDFF',  
    marginRight: 8,
  },
  sortChipActive: { backgroundColor: '#EEEADDFF', },
  sortChipText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },
  sortChipTextActive: { color: '#5C554F' },

  reviewCard: {
    backgroundColor: '#EEEADDFF', marginHorizontal: 16, marginBottom: 16,
    borderRadius: 14, padding: 20,  
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  productBanner: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
    paddingBottom: 12,  
  },
  productBannerImg: { width: 36, height: 36, borderRadius: 6, marginRight: 12,  },
  productBannerPlaceholder: { width: 36, height: 36, borderRadius: 6, marginRight: 12, backgroundColor: '#EEEADDFF', alignItems: 'center', justifyContent: 'center',  },
  productBannerName: { flex: 1, fontSize: 14, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },

  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewerAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEEADDFF',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,  
  },
  reviewerInitial: { color: '#2E2A26', fontFamily: 'Cinzel_700Bold', fontSize: 18 },
  reviewerMeta: { flex: 1 },
  reviewerName: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },
  reviewDate: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#2E2A26', marginTop: 2 },
  editedTag: { color: '#2E2A26', fontStyle: 'italic' },

  reviewText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#5C554F', lineHeight: 22, marginBottom: 12 },

  photosRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  reviewPhoto: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#FFFFFF',  },

  helpfulBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#EEEADDFF', borderRadius: 8, flexDirection: 'row', alignItems: 'center',  },
  helpfulText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEEADDFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, fontFamily: 'Montserrat_400Regular', color: '#8A8178' },
});

export default SellerProductReviewsScreen;
