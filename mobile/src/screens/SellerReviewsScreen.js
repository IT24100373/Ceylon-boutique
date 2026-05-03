import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, Image, StatusBar, ScrollView, Platform
} from 'react-native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/FontAwesome';
import FeatherIcon from 'react-native-vector-icons/Feather';

const StarDisplay = ({ rating, size = 12 }) => {
  const filled = Math.round(rating);
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name={star <= filled ? "star" : "star-o"}
          size={size}
          color={star <= filled ? "#D4A853" : "#EEEADD"}
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
      <Text style={styles.barLabel}>{star} <Icon name="star" size={10} color="#8A8178" /></Text>
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
        </Text>
      </View>
      <StarDisplay rating={review.rating} size={14} />
    </View>

    {review.reviewText ? (
      <Text style={styles.reviewText}>{review.reviewText}</Text>
    ) : null}

    {review.photos && review.photos.length > 0 && (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
        {review.photos.map((uri, i) => (
          <Image key={i} source={{ uri }} style={styles.reviewPhoto} />
        ))}
      </ScrollView>
    )}

    <View style={styles.reviewFooter}>
      <View style={styles.helpfulBadge}>
        <FeatherIcon name="thumbs-up" size={12} color="#8A8178" style={{ marginRight: 6 }} />
        <Text style={styles.helpfulText}>{review.helpfulCount || 0} Helpful</Text>
      </View>
    </View>
  </View>
);

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'highest', label: 'Highest' },
  { key: 'helpful', label: 'Helpful' },
];

const SellerReviewsScreen = ({ route, navigation }) => {
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

      const res = await apiClient.get(`/api/reviews/seller/${sellerId}`, {
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
      Alert.alert('Error', 'Failed to load seller reviews.');
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
        <ActivityIndicator size="large" color="#2E2A26" />
      </View>
    );
  }

  const ListHeader = () => (
    <View style={styles.headerContent}>
      {/* Shop name header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Shop Performance</Text>
        <View style={styles.sectionLine} />
      </View>

      {/* Rating Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.averageNumber}>{averageRating}</Text>
          <View style={{ marginVertical: 6 }}>
            <StarDisplay rating={parseFloat(averageRating)} size={16} />
          </View>
          <Text style={styles.totalCount}>{total} Shop Reviews</Text>
        </View>
        <View style={styles.summaryRight}>
          {[5, 4, 3, 2, 1].map((star) => (
            <RatingBar key={star} star={star} count={ratingBreakdown[star] || 0} total={total} />
          ))}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Customer Feedback</Text>
        <View style={styles.sectionLine} />
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
          <View style={styles.emptyIconCircle}>
            <FeatherIcon name="award" size={40} color="#2E2A26" />
          </View>
          <Text style={styles.emptyTitle}>No Reviews Yet</Text>
          <Text style={styles.emptySubtitle}>Service reviews for your shop will appear here as customers share their satisfaction.</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id || item._id}
        renderItem={({ item }) => <ReviewCard review={item} />}
        ListHeaderComponent={<ListHeader />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? (
          <ActivityIndicator size="small" color="#2E2A26" style={{ marginVertical: 20 }} />
        ) : null}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  headerContent: { paddingHorizontal: 20 },
  list: { paddingBottom: 40 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  sectionTitle: { fontSize: 14, fontFamily: 'Montserrat_700Bold', color: '#2E2A26', textTransform: 'uppercase', letterSpacing: 1, marginRight: 15 },
  sectionLine: { flex: 1, height: 1, backgroundColor: '#F0EBE5' },

  summaryCard: {
    backgroundColor: '#FFFFFF', flexDirection: 'row', padding: 24,
    borderRadius: 24, marginBottom: 10,
    borderWidth: 1, borderColor: '#F0EBE5',
    shadowColor: '#2E2A26', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5,
  },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', marginRight: 24, width: 100 },
  averageNumber: { fontSize: 44, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', lineHeight: 48 },
  totalCount: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', marginTop: 4, textAlign: 'center' },
  summaryRight: { flex: 1, justifyContent: 'center' },

  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  barLabel: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178', width: 22, marginRight: 8 },
  barTrack: { flex: 1, height: 6, backgroundColor: '#F8F6F4', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: '#D4A853', borderRadius: 3 },
  barCount: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold', color: '#A8A19A', width: 22, textAlign: 'right', marginLeft: 8 },

  sortRow: { flexDirection: 'row', marginBottom: 20 },
  sortChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#F8F6F4', marginRight: 10, borderWidth: 1, borderColor: '#EEEADD'
  },
  sortChipActive: { backgroundColor: '#2E2A26', borderColor: '#2E2A26' },
  sortChipText: { fontSize: 13, fontFamily: 'Montserrat_600SemiBold', color: '#5C554F' },
  sortChipTextActive: { color: '#FFFFFF' },

  reviewCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 20,
    borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F0EBE5',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewerAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8F6F4',
    alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: '#EEEADD'
  },
  reviewerInitial: { color: '#2E2A26', fontFamily: 'Cinzel_700Bold', fontSize: 16 },
  reviewerMeta: { flex: 1 },
  reviewerName: { fontSize: 15, fontFamily: 'Montserrat_600SemiBold', color: '#2E2A26' },
  reviewDate: { fontSize: 12, fontFamily: 'Montserrat_400Regular', color: '#8A8178', marginTop: 2 },

  reviewText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#5C554F', lineHeight: 22, marginBottom: 15 },

  photosRow: { flexDirection: 'row', marginBottom: 15 },
  reviewPhoto: { width: 90, height: 90, borderRadius: 12, marginRight: 10, backgroundColor: '#F8F6F4' },

  reviewFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
  helpfulBadge: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#F8F6F4', borderRadius: 8, borderWidth: 1, borderColor: '#EEEADD' },
  helpfulText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#8A8178' },

  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIconCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#F8F6F4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#EEEADD'
  },
  emptyTitle: { fontSize: 22, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 10 },
  emptySubtitle: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#8A8178', textAlign: 'center', lineHeight: 22 },
});

export default SellerReviewsScreen;
