// app/recipe/[id].js
// Pantalla de detalle de receta con ingredientes interactivos, pasos y acciones CRUD
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../src/components/ScreenHeader';
import LoadingScreen from '../../src/components/LoadingScreen';
import EmptyState from '../../src/components/EmptyState';
import Colors from '../../src/theme/colors';
import Typography from '../../src/theme/typography';
import { recipesApi } from '../../src/api/recipes';
import { groupsApi } from '../../src/api/groups';
import { useAuth } from '../../src/context/AuthContext';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [recipe,       setRecipe]       = useState(null);
  const [allGroups,    setAllGroups]    = useState([]);
  const [checkedIngs,  setCheckedIngs]  = useState({});
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);

  const fetchRecipe = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [resRecipe, resGroups] = await Promise.all([
        recipesApi.getById(id),
        groupsApi.listMine().catch(() => ({ groups: [] })),
      ]);
      setRecipe(resRecipe.recipe);
      setAllGroups(resGroups.groups || []);
    } catch (err) {
      if (err.isCanceled || (err.message && err.message.toLowerCase().includes('cancel'))) return;
      setError(err.message || 'Error al cargar la receta');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) fetchRecipe();
    }, [id])
  );

  const isOwner = Boolean(
    user && recipe && (
      (recipe.author?.id && recipe.author.id === user.id) ||
      (recipe.author?._id && recipe.author._id === user.id) ||
      (typeof recipe.author === 'string' && recipe.author === user.id)
    )
  );

  const toggleIngredientCheck = (idx) => {
    setCheckedIngs((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Receta',
      `¿Estás seguro de que deseas eliminar permanentemente "${recipe.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await recipesApi.remove(id);
              Alert.alert('Eliminada', 'La receta fue eliminada con éxito');
              router.replace('/(tabs)/my-recipes');
            } catch (err) {
              Alert.alert('Error', err.message || 'No se pudo eliminar la receta');
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return <LoadingScreen message="Cargando receta..." />;
  }

  if (error || !recipe) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Detalle de Receta" showBack />
        <EmptyState
          icon="alert-circle-outline"
          title="No se pudo cargar la receta"
          subtitle={error || 'La receta solicitada no existe o no tienes permiso para verla.'}
        >
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.retryBtnText}>Regresar</Text>
          </TouchableOpacity>
        </EmptyState>
      </View>
    );
  }

  // Grupos asignados a esta receta
  const assignedGroupIds = recipe.groups || [];
  const assignedGroups = allGroups.filter((g) => assignedGroupIds.includes(g.id));

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={recipe.title}
        showBack
        rightAction={
          isOwner
            ? {
                icon: 'create-outline',
                onPress: () => router.push(`/recipe/edit/${id}`),
              }
            : null
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchRecipe(true);
            }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Banner Hero */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['rgba(201, 151, 74, 0.16)', 'rgba(176, 92, 48, 0.08)']}
            style={styles.heroGradient}
          />
          <View style={styles.iconBigWrap}>
            <Ionicons name="restaurant" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>{recipe.title}</Text>

          {/* Badges y metadatos */}
          <View style={styles.metaRow}>
            {recipe.category ? (
              <View style={styles.badge}>
                <Ionicons name="pricetag-outline" size={13} color={Colors.primaryLight} />
                <Text style={styles.badgeText}>{recipe.category}</Text>
              </View>
            ) : null}

            <View
              style={[
                styles.badge,
                recipe.isPublic ? styles.badgePublic : styles.badgePrivate,
              ]}
            >
              <Ionicons
                name={recipe.isPublic ? 'globe-outline' : 'lock-closed-outline'}
                size={13}
                color={recipe.isPublic ? Colors.secondaryLight : Colors.textMuted}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: recipe.isPublic ? Colors.secondaryLight : Colors.textMuted },
                ]}
              >
                {recipe.isPublic ? 'Pública' : 'Privada'}
              </Text>
            </View>

            {recipe.prepTime ? (
              <View style={styles.badge}>
                <Ionicons name="time-outline" size={13} color={Colors.primaryLight} />
                <Text style={styles.badgeText}>{recipe.prepTime} min</Text>
              </View>
            ) : null}

            {recipe.servings ? (
              <View style={styles.badge}>
                <Ionicons name="people-outline" size={13} color={Colors.primaryLight} />
                <Text style={styles.badgeText}>{recipe.servings} porciones</Text>
              </View>
            ) : null}
          </View>

          {/* Descripción */}
          {recipe.description ? (
            <Text style={styles.heroDescription}>{recipe.description}</Text>
          ) : null}
        </View>

        {/* Sección de Grupos */}
        {assignedGroups.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="folder" size={18} color={Colors.secondary} />
              <Text style={styles.sectionTitle}>Grupos Asociados</Text>
            </View>
            <View style={styles.groupChipsWrap}>
              {assignedGroups.map((grp) => (
                <TouchableOpacity
                  key={grp.id}
                  style={styles.groupTag}
                  onPress={() => router.push(`/group/${grp.id}`)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="folder-open-outline" size={14} color={Colors.secondaryLight} />
                  <Text style={styles.groupTagText}>{grp.name}</Text>
                  <Ionicons name="chevron-forward" size={12} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Sección de Ingredientes */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="basket-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>
              Ingredientes ({recipe.ingredients?.length || 0})
            </Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Toca los ingredientes para marcarlos mientras cocinas
          </Text>

          {recipe.ingredients?.map((ing, idx) => {
            const isChecked = !!checkedIngs[idx];
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.ingredientRow, isChecked && styles.ingredientRowChecked]}
                onPress={() => toggleIngredientCheck(idx)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isChecked ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={isChecked ? Colors.primary : Colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.ingredientName,
                      isChecked && styles.ingredientNameChecked,
                    ]}
                  >
                    {ing.name}
                  </Text>
                </View>
                {(ing.quantity || ing.unit) ? (
                  <Text
                    style={[
                      styles.ingredientQty,
                      isChecked && styles.ingredientQtyChecked,
                    ]}
                  >
                    {ing.quantity} {ing.unit}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sección de Pasos */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>
              Preparación ({recipe.steps?.length || 0} pasos)
            </Text>
          </View>

          {recipe.steps?.map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>{idx + 1}</Text>
              </View>
              <Text style={styles.stepInstruction}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Acciones del propietario */}
        {isOwner && (
          <View style={styles.ownerActionsCard}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push(`/recipe/edit/${id}`)}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={18} color={Colors.primary} />
              <Text style={styles.editBtnText}>Editar Receta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
              <Text style={styles.deleteBtnText}>Eliminar Receta</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  iconBigWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeightXl,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgePublic: {
    borderColor: 'rgba(176, 92, 48, 0.4)',
    backgroundColor: 'rgba(176, 92, 48, 0.1)',
  },
  badgePrivate: {
    borderColor: Colors.border,
    backgroundColor: Colors.bgSurface,
  },
  badgeText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  heroDescription: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeightMd,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginBottom: 14,
  },
  groupChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  groupTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgSurface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupTagText: {
    fontSize: Typography.xs,
    color: Colors.secondaryLight,
    fontWeight: Typography.medium,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.bgSurface,
    marginBottom: 6,
    gap: 12,
  },
  ingredientRowChecked: {
    opacity: 0.5,
    backgroundColor: 'transparent',
  },
  ingredientName: {
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.medium,
  },
  ingredientNameChecked: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  ingredientQty: {
    fontSize: Typography.xs,
    color: Colors.primaryLight,
    fontWeight: Typography.semibold,
  },
  ingredientQtyChecked: {
    color: Colors.textMuted,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 14,
    backgroundColor: Colors.bgSurface,
    padding: 14,
    borderRadius: 12,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.primaryLight,
  },
  stepInstruction: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeightMd,
  },
  ownerActionsCard: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  editBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.primaryLight,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.errorLight,
    borderWidth: 1.5,
    borderColor: Colors.error,
    paddingVertical: 14,
    borderRadius: 14,
  },
  deleteBtnText: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.error,
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primaryGlow,
    borderRadius: 12,
    alignSelf: 'center',
  },
  retryBtnText: {
    fontSize: Typography.sm,
    color: Colors.primaryLight,
    fontWeight: Typography.semibold,
  },
});
