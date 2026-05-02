import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const AddressCard = ({ address, onEdit, onDelete, onSetDefault }) => {
  return (
    <View style={[styles.card, address.isDefault && styles.cardDefault]}>
      <View style={styles.header}>
        <Text style={styles.label}>{address.label || 'Address'}</Text>
        {address.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Default</Text>
          </View>
        )}
      </View>

      <Text style={styles.addressText}>{address.addressLine1}</Text>
      {address.addressLine2 ? (
        <Text style={styles.addressText}>{address.addressLine2}</Text>
      ) : null}
      <Text style={styles.addressText}>
        {address.city}, {address.province} {address.postalCode}
      </Text>

      <View style={styles.actions}>
        {!address.isDefault && (
          <TouchableOpacity onPress={() => onSetDefault(address._id)}>
            <Text style={styles.actionLink}>Set Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => onEdit(address)}>
          <Text style={styles.actionLink}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(address._id)}>
          <Text style={[styles.actionLink, styles.deleteLink]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6C9B9',
    shadowColor: '#43332E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDefault: { borderColor: '#B4725E', borderWidth: 2 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16, color: '#2A201D', flex: 1 },
  defaultBadge: {
    backgroundColor: '#B4725E',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultBadgeText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'InstrumentSans_600SemiBold' },
  addressText: { color: '#43332E', fontSize: 14, fontFamily: 'InstrumentSans_400Regular', marginBottom: 2 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  actionLink: { color: '#B4725E', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14 },
  deleteLink: { color: '#D32F2F' },
});

export default AddressCard;
