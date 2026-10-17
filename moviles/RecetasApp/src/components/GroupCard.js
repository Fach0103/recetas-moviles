// src/components/GroupCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import Typography from '../theme/typography';

export default function GroupCard({ group, recipeCount, onPress, onEdit, onDelete }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="folder" size={22} color={Colors.secondary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
          {group.description ? (
            <Text style={styles.description} numberOfLines={1}>
              {group.description}
            </Text>
          ) : null}
          <Text style={styles.count}>
            {recipeCount !== undefined ? `${recipeCount} receta${recipeCount !== 1 ? 's' : ''}` : ''}
          </Text>
        </View>
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onEdit(); }}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="create-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onDelete(); }}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.tagBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: { flex: 1 },
  name: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  description: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  count: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
