import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar
} from 'react-native';
import apiClient from '../api/client';
import Icon from 'react-native-vector-icons/Feather';

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
      Alert.alert('Success!', 'Stock quantities updated successfully.', [
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
        <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />
        <ActivityIndicator size="large" color="#B4725E" />
        <Text style={styles.loadingText}>Loading stock data...</Text>
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
        <Text style={styles.headerTitle}>Manage Stock</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Product Name Banner */}
        <View style={styles.banner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Icon name="package" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.bannerTitle}>{productName}</Text>
          </View>
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
        <View style={[styles.summaryCard, getTotalStock() === 0 && styles.summaryCardZero]}>
          <Text style={[styles.summaryLabel, getTotalStock() === 0 && styles.summaryLabelZero]}>Total Stock Across All Variants</Text>
          <Text style={[styles.summaryValue, getTotalStock() === 0 && styles.summaryZero]}>
            {getTotalStock()}
          </Text>
          {getTotalStock() === 0 && (
            <View style={styles.warningContainer}>
              <Icon name="alert-triangle" size={16} color="#B4725E" style={{ marginRight: 6 }} />
              <Text style={styles.summaryWarning}>
                Product will show as "Out of Stock"
              </Text>
            </View>
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
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="save" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Stock Changes</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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

  scroll: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF1E8' },
  loadingText: { marginTop: 12, color: '#8C7A74', fontFamily: 'InstrumentSans_400Regular', fontSize: 15 },

  banner: {
    backgroundColor: '#B4725E', borderRadius: 14, padding: 20, marginBottom: 16,
    shadowColor: '#43332E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  bannerTitle: { color: '#FFFFFF', fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', flex: 1 },
  bannerSub: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontFamily: 'InstrumentSans_400Regular' },

  quickActions: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: '#E6C9B9',
  },
  quickLabel: { fontSize: 14, fontFamily: 'InstrumentSans_600SemiBold', color: '#43332E', marginBottom: 12 },
  quickBtns: { flexDirection: 'row', justifyContent: 'space-around' },
  quickBtn: {
    backgroundColor: '#FFF5EE', paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: '#E6C9B9',
  },
  quickBtnText: { fontSize: 15, fontFamily: 'InstrumentSans_600SemiBold', color: '#43332E' },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#E6C9B9',
  },
  tableHeader: {
    flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8,
    backgroundColor: '#F8F8F8', borderRadius: 8, marginBottom: 6,
  },
  headerText: { fontSize: 13, fontFamily: 'InstrumentSans_600SemiBold', color: '#8C7A74' },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F8F8F8',
  },
  outOfStockRow: { backgroundColor: '#FFF5EE', borderRadius: 8 },
  cellText: { fontSize: 15, color: '#2A201D', fontFamily: 'InstrumentSans_400Regular' },
  stockInput: {
    flex: 0.8, backgroundColor: '#FFFFFF', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 15,
    borderWidth: 1, borderColor: '#E6C9B9', textAlign: 'center',
    fontFamily: 'InstrumentSans_600SemiBold', color: '#2A201D',
  },
  stockInputZero: { borderColor: '#B4725E', backgroundColor: '#FFFFFF', color: '#B4725E' },

  summaryCard: {
    backgroundColor: '#E8F5E9', borderRadius: 14, padding: 20,
    alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#C8E6C9'
  },
  summaryCardZero: { backgroundColor: '#FFF5EE', borderColor: '#E6C9B9' },
  summaryLabel: { fontSize: 14, color: '#2E7D32', fontFamily: 'InstrumentSans_600SemiBold', marginBottom: 8 },
  summaryLabelZero: { color: '#B4725E' },
  summaryValue: { fontSize: 40, fontFamily: 'PlayfairDisplay_700Bold', color: '#2E7D32' },
  summaryZero: { color: '#B4725E' },
  warningContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  summaryWarning: { fontSize: 13, color: '#B4725E', fontFamily: 'InstrumentSans_600SemiBold' },

  saveBtn: {
    backgroundColor: '#B4725E', paddingVertical: 16, borderRadius: 14,
    alignItems: 'center', shadowColor: '#43332E', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'InstrumentSans_600SemiBold' },
});

export default ManageStockScreen;
