// src/components/RecipeCard.js
// Tarjeta de receta para listados
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import Typography from '../theme/typography';

export default function RecipeCard({ recipe, onPress, showAuthor = false }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Encabezado */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="restaurant" size={22} color={Colors.primary} />
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={2}>{recipe.title}</Text>
          {recipe.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{recipe.category}</Text>
            </View>
          ) : null}
        </View>
        {recipe.isPublic && (
          <Ionicons name="globe-outline" size={16} color={Colors.secondary} />
        )}
      </View>

      {/* Descripción */}
      {recipe.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {recipe.description}
        </Text>
      ) : null}

      {/* Meta: tiempo + porciones */}
      <View style={styles.meta}>
        {recipe.prepTime ? (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{recipe.prepTime} min</Text>
          </View>
        ) : null}
        {recipe.servings ? (
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{recipe.servings} porciones</Text>
          </View>
        ) : null}
        <View style={styles.metaItem}>
          <Ionicons name="list-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.metaText}>{recipe.ingredients?.length || 0} ing.</Text>
        </View>
      </View>

      {/* Grupos */}
      {recipe.groups && recipe.groups.length > 0 && (
        <View style={styles.groupsRow}>
          <Ionicons name="folder-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.groupsText}>
            {recipe.groups.length} grupo{recipe.groups.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
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
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleWrap: { flex: 1 },
  title: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeightMd,
  },
  categoryBadge: {
    marginTop: 4,
    backgroundColor: Colors.tagBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: Typography.xs,
    color: Colors.tagText,
    fontWeight: Typography.medium,
  },
  description: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeightSm,
    marginBottom: 10,
  },
  meta: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  groupsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  groupsText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
});
