import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import apiClient from '../api/client';

// -------------------------------------------------------
// Seller — Manage Stock Screen
// Shows all variants with editable stock quantities
// -------------------------------------------------------
const ManageStockScreen = ({ route, navigation }) => {
  const { productId, productName } = route.params;
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await apiClient.get(`/api/products/${productId}`);
        setVariants(response.data.product.variants || []);
      } catch (error) {
        Alert.alert('Error', 'Failed to load product stock data.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, navigation]);

  const updateStock = (index, value) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], stock: parseInt(value) || 0 };
    setVariants(updated);
  };

  const getTotalStock = () => {
    return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanVariants = variants.map((v) => ({
        size: v.size,
        color: v.color,
        stock: v.stock,
      }));

      await apiClient.put(`/api/products/${productId}/stock`, { variants: cleanVariants });
      Alert.alert('Success! ✅', 'Stock quantities updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update stock.');
    } finally {
      setSaving(false);
    }
  };

  const setAllStock = (value) => {
    const num = parseInt(value) || 0;
    setVariants(variants.map((v) => ({ ...v, stock: num })));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B2635" />
        <Text style={styles.loadingText}>Loading stock data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Product Name Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>📦 {productName}</Text>
          <Text style={styles.bannerSub}>
            {variants.length} variant(s) · Total stock: {getTotalStock()}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickLabel}>Set all variants to:</Text>
          <View style={styles.quickBtns}>
            {[0, 5, 10, 20, 50].map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.quickBtn}
                onPress={() => setAllStock(val)}
              >
                <Text style={styles.quickBtnText}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Variant Table */}
        <View style={styles.card}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, { flex: 1 }]}>Size</Text>
            <Text style={[styles.headerText, { flex: 1 }]}>Color</Text>
            <Text style={[styles.headerText, { flex: 0.8, textAlign: 'center' }]}>Stock</Text>
          </View>

          {variants.map((v, idx) => (
            <View
              key={v._id || idx}
              style={[styles.tableRow, v.stock === 0 && styles.outOfStockRow]}
            >
              <Text style={[styles.cellText, { flex: 1 }]}>{v.size}</Text>
              <Text style={[styles.cellText, { flex: 1 }]}>{v.color}</Text>
              <TextInput
                style={[styles.stockInput, v.stock === 0 && styles.stockInputZero]}
                value={String(v.stock)}
                onChangeText={(val) => updateStock(idx, val)}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>
          ))}
        </View>

        {/* Total Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Stock Across All Variants</Text>
          <Text style={[styles.summaryValue, getTotalStock() === 0 && styles.summaryZero]}>
            {getTotalStock()}
          </Text>
          {getTotalStock() === 0 && (
            <Text style={styles.summaryWarning}>
              ⚠️ Product will show as "Out of Stock" to customers
            </Text>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>💾 Save Stock Changes</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  scroll: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8f8' },
  loadingText: { marginTop: 12, color: '#888', fontSize: 14 },
  banner: {
    backgroundColor: '#8B2635', borderRadius: 14, padding: 18, marginBottom: 16,
  },
  bannerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  quickActions: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0',
  },
  quickLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 10 },
  quickBtns: { flexDirection: 'row', justifyContent: 'space-around' },
  quickBtn: {
    backgroundColor: '#f1f1f1', paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0',
  },
  quickBtnText: { fontSize: 14, fontWeight: '700', color: '#333' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0',
  },
  tableHeader: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 6,
    backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 6,
  },
  headerText: { fontSize: 12, fontWeight: '800', color: '#555' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  outOfStockRow: { backgroundColor: '#FFF8E1' },
  cellText: { fontSize: 14, color: '#333', fontWeight: '500' },
  stockInput: {
    flex: 0.8, backgroundColor: '#f7f7f7', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 15,
    borderWidth: 1, borderColor: '#e2e8f0', textAlign: 'center',
    fontWeight: '700', color: '#333',
  },
  stockInputZero: { borderColor: '#F57C00', backgroundColor: '#FFF3E0' },
  summaryCard: {
    backgroundColor: '#E8F5E9', borderRadius: 14, padding: 20,
    alignItems: 'center', marginBottom: 16,
  },
  summaryLabel: { fontSize: 13, color: '#2E7D32', fontWeight: '600', marginBottom: 6 },
  summaryValue: { fontSize: 36, fontWeight: '900', color: '#2E7D32' },
  summaryZero: { color: '#D32F2F' },
  summaryWarning: { fontSize: 12, color: '#F57C00', marginTop: 8, fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#8B2635', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default ManageStockScreen;
