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
    backgroundColor: '#EEEADDFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    
    
    shadowColor: '#2E2A26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDefault: {  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { fontFamily: 'Montserrat_600SemiBold', fontSize: 16, color: '#8A8178', flex: 1 },
  defaultBadge: {
    backgroundColor: '#EEEADDFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultBadgeText: { color: '#5C554F', fontSize: 11, fontFamily: 'Montserrat_600SemiBold' },
  addressText: { color: '#5C554F', fontSize: 14, fontFamily: 'Montserrat_400Regular', marginBottom: 2 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  actionLink: { color: '#2E2A26', fontFamily: 'Montserrat_600SemiBold', fontSize: 14 },
  deleteLink: { color: '#2E2A26' },
});

export default AddressCard;
