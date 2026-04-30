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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  cardDefault: { borderColor: '#8B2635' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { fontWeight: '700', fontSize: 15, color: '#222', flex: 1 },
  defaultBadge: {
    backgroundColor: '#8B2635',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  addressText: { color: '#555', fontSize: 14, marginBottom: 2 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  actionLink: { color: '#8B2635', fontWeight: '600', fontSize: 14 },
  deleteLink: { color: '#c53030' },
});

export default AddressCard;
