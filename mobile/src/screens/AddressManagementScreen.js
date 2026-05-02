import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList,
  Alert, Modal, SafeAreaView, KeyboardAvoidingView,
  Platform, TouchableOpacity, StatusBar
} from 'react-native';
import apiClient from '../api/client';
import AddressCard from '../components/AddressCard';
import InputField from '../components/InputField';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import Icon from 'react-native-vector-icons/Feather';

const PROVINCES = [
  'Western', 'Central', 'Southern', 'Northern', 'Eastern',
  'North Western', 'North Central', 'Uva', 'Sabaragamuwa',
];

const emptyForm = {
  label: 'Home', addressLine1: '', addressLine2: '',
  city: '', province: 'Western', postalCode: '',
};

const AddressManagementScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = add new
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showProvincePicker, setShowProvincePicker] = useState(false);

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/users/addresses');
      setAddresses(res.data.addresses);
    } catch (err) {
      Alert.alert('Error', 'Failed to load addresses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
    setModalVisible(true);
  };

  const openEdit = (address) => {
    setForm({
      label: address.label || 'Home',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
    });
    setEditingId(address._id);
    setErrors({});
    setModalVisible(true);
  };

  const validate = () => {
    const e = {};
    if (!form.addressLine1.trim()) e.addressLine1 = 'Address line 1 is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.province) e.province = 'Province is required';
    if (!form.postalCode.trim()) e.postalCode = 'Postal code is required';
    else if (!/^[0-9]{5}$/.test(form.postalCode)) e.postalCode = 'Must be a 5-digit postal code';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.put(`/api/users/addresses/${editingId}`, form);
      } else {
        await apiClient.post('/api/users/addresses', form);
      }
      setModalVisible(false);
      fetchAddresses();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Address', 'Are you sure you want to delete this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/api/users/addresses/${id}`);
            fetchAddresses();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete address.');
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (id) => {
    try {
      await apiClient.put(`/api/users/addresses/${id}/default`);
      fetchAddresses();
    } catch (err) {
      Alert.alert('Error', 'Failed to update default address.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF1E8" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color="#43332E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {addresses.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconCircle}>
              <Icon name="map-pin" size={40} color="#B4725E" />
            </View>
            <Text style={styles.emptyTitle}>No addresses yet</Text>
            <Text style={styles.emptyText}>Add a delivery address to use at checkout.</Text>
          </View>
        ) : (
          addresses.map((addr) => (
            <AddressCard
              key={addr._id}
              address={addr}
              onEdit={openEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))
        )}

        <Button title="+ Add New Address" onPress={openAdd} style={styles.addBtn} />
      </ScrollView>

      {/* Add / Edit Address Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.modalContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingId ? 'Edit Address' : 'Add New Address'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Icon name="x" size={24} color="#8C7A74" style={styles.modalClose} />
                </TouchableOpacity>
              </View>

              <InputField label="Label (e.g. Home, Work)" value={form.label}
                onChangeText={set('label')} placeholder="Home" autoCapitalize="words" />
              <InputField label="Address Line 1 *" value={form.addressLine1}
                onChangeText={set('addressLine1')} placeholder="Street number and name"
                autoCapitalize="words" error={errors.addressLine1} />
              <InputField label="Address Line 2" value={form.addressLine2}
                onChangeText={set('addressLine2')} placeholder="Apartment, floor, etc." autoCapitalize="words" />
              <InputField label="City *" value={form.city}
                onChangeText={set('city')} placeholder="e.g. Colombo"
                autoCapitalize="words" error={errors.city} />

              {/* Province Picker */}
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Province *</Text>
                <TouchableOpacity
                  style={[styles.pickerBtn, errors.province && styles.pickerBtnError]}
                  onPress={() => setShowProvincePicker(!showProvincePicker)}
                >
                  <Text style={styles.pickerBtnText}>{form.province || 'Select Province'}</Text>
                  <Icon name={showProvincePicker ? "chevron-up" : "chevron-down"} size={20} color="#8C7A74" />
                </TouchableOpacity>
                {errors.province ? <Text style={styles.errorText}>{errors.province}</Text> : null}
                {showProvincePicker && (
                  <View style={styles.provinceList}>
                    {PROVINCES.map((p) => (
                      <TouchableOpacity key={p} style={styles.provinceItem}
                        onPress={() => { set('province')(p); setShowProvincePicker(false); }}>
                        <Text style={[styles.provinceItemText, form.province === p && styles.provinceSelected]}>
                          {p}
                        </Text>
                        {form.province === p && <Icon name="check" size={16} color="#B4725E" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <InputField label="Postal Code *" value={form.postalCode}
                onChangeText={set('postalCode')} placeholder="e.g. 10100"
                keyboardType="numeric" error={errors.postalCode} />

              <Button title={editingId ? 'Save Changes' : 'Add Address'} onPress={handleSave} disabled={saving} style={styles.saveBtn} />
              <Button title="Cancel" onPress={() => setModalVisible(false)} variant="secondary" style={styles.cancelBtn} />
              <View style={{ height: 20 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF1E8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF1E8'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },

  container: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, marginTop: 40 },
  emptyIconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#F7D9C4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D', marginBottom: 8 },
  emptyText: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#43332E', textAlign: 'center' },
  addBtn: { marginTop: 12, backgroundColor: '#B4725E', borderRadius: 12 },

  // Modal
  modalSafe: { flex: 1, backgroundColor: '#FFFFFF' },
  modalContainer: { padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', color: '#2A201D' },
  modalClose: { padding: 4 },

  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontFamily: 'InstrumentSans_600SemiBold', color: '#43332E', marginBottom: 8, marginTop: 4 },
  pickerBtn: {
    borderWidth: 1, borderColor: '#E6C9B9', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  pickerBtnError: { borderColor: '#E53E3E' },
  pickerBtnText: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#2A201D' },
  provinceList: {
    borderWidth: 1, borderColor: '#E6C9B9', borderRadius: 10,
    marginTop: 6, backgroundColor: '#FFFFFF', overflow: 'hidden',
  },
  provinceItem: { paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F8F8F8' },
  provinceItemText: { fontSize: 15, fontFamily: 'InstrumentSans_400Regular', color: '#2A201D' },
  provinceSelected: { color: '#B4725E', fontFamily: 'InstrumentSans_600SemiBold' },
  errorText: { color: '#E53E3E', fontSize: 12, fontFamily: 'InstrumentSans_400Regular', marginTop: 4 },

  saveBtn: { marginTop: 16, backgroundColor: '#B4725E', borderRadius: 12 },
  cancelBtn: { marginTop: 12, borderRadius: 12 },
});

export default AddressManagementScreen;
