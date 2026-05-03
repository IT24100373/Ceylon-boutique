import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, StatusBar, Platform
} from 'react-native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/FontAwesome';
import FeatherIcon from 'react-native-vector-icons/Feather';

const StarDisplay = ({ rating, size = 14 }) => {
  const filled = Math.round(rating);
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name={star <= filled ? "star" : "star-o"}
          size={size}
          color={star <= filled ? "#D4A853" : "#EEEADD"}
          style={styles.starIcon}
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
              setReviews((prev) => prev.filter((r) => r.id !== reviewId && r._id !== reviewId));
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
      ? (item.product?.name || 'Product Review')
      : (item.seller?.shopName || 'Seller Feedback');

    const isDeleting = deletingId === (item.id || item._id);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, isProduct ? styles.typeBadgeProduct : styles.typeBadgeSeller]}>
            <FeatherIcon name={isProduct ? "package" : "home"} size={10} color={isProduct ? "#2E2A26" : "#5B6939"} style={{ marginRight: 6 }} />
            <Text style={[styles.typeBadgeText, { color: isProduct ? '#2E2A26' : '#5B6939' }]}>
              {isProduct ? 'PRODUCT' : 'SERVICE'}
            </Text>
          </View>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </View>

        <Text style={styles.targetName} numberOfLines={1}>{targetName}</Text>

        <View style={styles.ratingRow}>
          <StarDisplay rating={item.rating} size={14} />
          {item.isEdited && <View style={styles.editedBadge}><Text style={styles.editedText}>Edited</Text></View>}
        </View>

        {item.reviewText ? (
          <Text style={styles.reviewText} numberOfLines={3}>{item.reviewText}</Text>
        ) : (
          <Text style={styles.noText}>Rating provided without comment.</Text>
        )}

        <View style={styles.footerRow}>
          <View style={styles.editWindowInfo}>
            <FeatherIcon name={item.canEdit ? "clock" : "lock"} size={12} color={item.canEdit ? "#D4A853" : "#A8A19A"} style={{ marginRight: 4 }} />
            <Text style={[styles.editWindowText, !item.canEdit && { color: '#A8A19A' }]}>
              {item.canEdit ? `${item.hoursUntilLock}h left to edit` : 'Locked'}
            </Text>
          </View>
          
          <View style={styles.actions}>
            {item.canEdit && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('EditReview', { review: item })}
              >
                <FeatherIcon name="edit-2" size={16} color="#2E2A26" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteAction]}
              onPress={() => handleDelete(item.id || item._id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#D32F2F" />
              ) : (
                <FeatherIcon name="trash-2" size={16} color="#D32F2F" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
        <ActivityIndicator size="large" color="#2E2A26" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEEADDFF" />
      
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id || item._id}
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          reviews.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>My Contributions</Text>
              <View style={styles.listLine} />
            </View>
          ) : null
        }
        ListFooterComponent={loadingMore ? (
          <ActivityIndicator size="small" color="#2E2A26" style={{ marginVertical: 20 }} />
        ) : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <FeatherIcon name="message-square" size={40} color="#2E2A26" />
            </View>
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptySubtitle}>
              Your feedback helps our boutique community. Rate your purchases after delivery to see them here.
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },

  listHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 20 },
  listTitle: { fontSize: 12, fontFamily: 'Montserrat_700Bold', color: '#A8A19A', textTransform: 'uppercase', letterSpacing: 1.5, marginRight: 15 },
  listLine: { flex: 1, height: 1, backgroundColor: '#F0EBE5' },

  list: { paddingBottom: 40 },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: 40 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginHorizontal: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#F0EBE5',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#F8F6F4' },
  typeBadgeProduct: { backgroundColor: '#F8F6F4' },
  typeBadgeSeller: { backgroundColor: '#5B693910' },
  typeBadgeText: { fontSize: 9, fontFamily: 'Montserrat_700Bold', letterSpacing: 0.5 },

  dateContainer: { backgroundColor: '#F8F6F4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  dateText: { fontSize: 10, fontFamily: 'Montserrat_700Bold', color: '#8A8178' },

  targetName: { fontSize: 16, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 8 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  starRow: { flexDirection: 'row', marginRight: 10 },
  starIcon: { marginRight: 2 },
  editedBadge: { backgroundColor: '#EEEADD', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  editedText: { fontSize: 9, fontFamily: 'Montserrat_700Bold', color: '#8A8178', textTransform: 'uppercase' },

  reviewText: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#5C554F', lineHeight: 22, marginBottom: 15 },
  noText: { fontSize: 13, fontFamily: 'Montserrat_400Regular', color: '#A8A19A', fontStyle: 'italic', marginBottom: 15 },

  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F8F6F4', paddingTop: 15 },
  editWindowInfo: { flexDirection: 'row', alignItems: 'center' },
  editWindowText: { fontSize: 11, fontFamily: 'Montserrat_600SemiBold', color: '#D4A853' },

  actions: { flexDirection: 'row', gap: 15 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8F6F4', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#EEEADD' },
  deleteAction: { backgroundColor: '#D32F2F10', borderColor: '#D32F2F20' },

  emptyState: { alignItems: 'center', paddingHorizontal: 20 },
  emptyIconCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#F8F6F4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    borderWidth: 1, borderColor: '#EEEADD'
  },
  emptyTitle: { fontSize: 22, fontFamily: 'Cinzel_700Bold', color: '#2E2A26', marginBottom: 12 },
  emptySubtitle: { fontSize: 14, fontFamily: 'Montserrat_400Regular', color: '#8A8178', textAlign: 'center', lineHeight: 22 },
});

export default MyReviewsScreen;
