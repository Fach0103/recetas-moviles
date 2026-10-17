// app/group/[id].js
// Pantalla de detalle de un grupo con listado de recetas, añadir recetas al grupo y remover recetas
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenHeader from '../../src/components/ScreenHeader';
import RecipeCard from '../../src/components/RecipeCard';
import LoadingScreen from '../../src/components/LoadingScreen';
import EmptyState from '../../src/components/EmptyState';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import Colors from '../../src/theme/colors';
import Typography from '../../src/theme/typography';
import { groupsApi } from '../../src/api/groups';
import { recipesApi } from '../../src/api/recipes';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [group,          setGroup]          = useState(null);
  const [recipes,        setRecipes]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [error,          setError]          = useState(null);

  // Modal para editar grupo
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName,         setEditName]         = useState('');
  const [editDesc,         setEditDesc]         = useState('');
  const [savingGroup,      setSavingGroup]      = useState(false);

  // Modal para añadir recetas existentes al grupo
  const [addRecipeModal,   setAddRecipeModal]   = useState(false);
  const [availableRecipes, setAvailableRecipes] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedToAdd,    setSelectedToAdd]    = useState([]);
  const [savingAdd,        setSavingAdd]        = useState(false);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [resGroup, resRecipes] = await Promise.all([
        groupsApi.getById(id),
        groupsApi.getRecipes(id),
      ]);
      setGroup(resGroup.group);
      const sortedRecipes = (resRecipes.recipes || []).sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', 'es', { sensitivity: 'base' })
      );
      setRecipes(sortedRecipes);
      setEditName(resGroup.group?.name || '');
      setEditDesc(resGroup.group?.description || '');
    } catch (err) {
      setError(err.message || 'Error al cargar el grupo');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (id) fetchData();
    }, [id])
  );

  // Abrir modal de editar
  const handleOpenEdit = () => {
    setEditName(group?.name || '');
    setEditDesc(group?.description || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || editName.trim().length < 2) {
      Alert.alert('Atención', 'El nombre debe tener al menos 2 caracteres');
      return;
    }
    setSavingGroup(true);
    try {
      await groupsApi.update(id, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      setEditModalVisible(false);
      fetchData(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el grupo');
    } finally {
      setSavingGroup(false);
    }
  };

  // Borrar grupo con advertencia de recetas
  const handleDeleteGroup = async () => {
    try {
      const preview = await groupsApi.getDeletePreview(id);
      const msg =
        preview.totalRecipesInGroup === 0
          ? '¿Seguro que deseas eliminar este grupo? Está vacío.'
          : `Atención: Este grupo contiene ${preview.totalRecipesInGroup} receta(s):\n\n` +
            `• ${preview.recipesToDelete} receta(s) se BORRARÁN permanentemente (solo están en este grupo).\n` +
            `• ${preview.recipesToKeep} receta(s) se conservarán (también están en otros grupos).\n\n` +
            '¿Deseas continuar con la eliminación?';

      Alert.alert('Eliminar Grupo', msg, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Grupo',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsApi.remove(id);
              Alert.alert('Grupo eliminado', 'El grupo y sus recetas exclusivas han sido eliminados.');
              router.replace('/(tabs)/groups');
            } catch (e) {
              Alert.alert('Error', e.message || 'No se pudo eliminar el grupo');
            }
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo obtener el aviso de eliminación');
    }
  };

  // Remover receta del grupo (NO borra la receta, solo la desasocia)
  const handleRemoveRecipeFromGroup = (recipeItem) => {
    Alert.alert(
      'Quitar del grupo',
      `¿Deseas quitar "${recipeItem.title}" de este grupo?\n\nLa receta no se borrará y seguirá disponible en "Mis Recetas".`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar del grupo',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentGroups = (recipeItem.groups || []).map(String);
              const updatedGroups = currentGroups.filter((gId) => gId !== String(id));
              await recipesApi.setGroups(recipeItem.id, updatedGroups);
              fetchData(true);
            } catch (err) {
              Alert.alert('Error', err.message || 'No se pudo desasociar la receta');
            }
          },
        },
      ]
    );
  };

  // Abrir modal para añadir recetas existentes
  const handleOpenAddRecipes = async () => {
    setAddRecipeModal(true);
    setLoadingAvailable(true);
    setSelectedToAdd([]);
    try {
      const allMine = await recipesApi.listMine();
      const currentRecipeIds = (recipes || []).map((r) => r.id);
      // Solo recetas que no estén ya en este grupo
      const notInGroup = (allMine.recipes || []).filter(
        (r) => !currentRecipeIds.includes(r.id)
      );
      setAvailableRecipes(notInGroup);
    } catch (e) {
      Alert.alert('Error', 'No se pudieron cargar tus recetas');
    } finally {
      setLoadingAvailable(false);
    }
  };

  const toggleSelectRecipeToAdd = (recipeId) => {
    if (selectedToAdd.includes(recipeId)) {
      setSelectedToAdd(selectedToAdd.filter((rId) => rId !== recipeId));
    } else {
      setSelectedToAdd([...selectedToAdd, recipeId]);
    }
  };

  const handleConfirmAddRecipes = async () => {
    if (selectedToAdd.length === 0) return;
    setSavingAdd(true);
    try {
      for (const recipeId of selectedToAdd) {
        const fullRecipe = availableRecipes.find((r) => r.id === recipeId);
        const currentGroups = (fullRecipe?.groups || []).map(String);
        if (!currentGroups.includes(String(id))) {
          await recipesApi.setGroups(recipeId, [...currentGroups, String(id)]);
        }
      }
      setAddRecipeModal(false);
      fetchData(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Error al asociar recetas al grupo');
    } finally {
      setSavingAdd(false);
    }
  };

  if (loading && !refreshing) {
    return <LoadingScreen message="Cargando grupo..." />;
  }

  if (error || !group) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Detalle del Grupo" showBack />
        <EmptyState
          icon="alert-circle-outline"
          title="Grupo no encontrado"
          subtitle={error || 'El grupo solicitado no existe.'}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={group.name}
        showBack
        rightAction={{
          icon: 'create-outline',
          onPress: handleOpenEdit,
        }}
      />

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchData(true);
            }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerCard}>
            <LinearGradient
              colors={['rgba(176, 92, 48, 0.22)', 'rgba(201, 151, 74, 0.08)']}
              style={styles.headerGradient}
            />
            <View style={styles.topRow}>
              <View style={styles.iconWrap}>
                <Ionicons name="folder" size={26} color={Colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.recipeCountBadge}>
                  {recipes.length} receta{recipes.length !== 1 ? 's' : ''} asociada{recipes.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {group.description ? (
              <Text style={styles.groupDescription}>{group.description}</Text>
            ) : null}

            {/* Botones de acción del grupo */}
            <View style={styles.groupActionRow}>
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={handleOpenAddRecipes}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.actionBtnPrimaryText}>Añadir Recetas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnDelete}
                onPress={handleDeleteGroup}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={17} color={Colors.error} />
                <Text style={styles.actionBtnDeleteText}>Borrar Grupo</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />
            <Text style={styles.listSectionTitle}>Recetas en este grupo</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.recipeItemWrap}>
            <View style={{ flex: 1 }}>
              <RecipeCard
                recipe={item}
                onPress={() => router.push(`/recipe/${item.id}`)}
              />
            </View>
            <TouchableOpacity
              style={styles.removeFromGroupBtn}
              onPress={() => handleRemoveRecipeFromGroup(item)}
              activeOpacity={0.75}
            >
              <Ionicons name="close-circle-outline" size={18} color={Colors.textSecondary} />
              <Text style={styles.removeFromGroupText}>Sacar del grupo</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="restaurant-outline"
            title="Grupo sin recetas"
            subtitle="Agrega recetas a este grupo usando el botón 'Añadir Recetas' o al crear una nueva receta."
          />
        }
      />

      {/* Modal Editar Grupo */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Editar Grupo</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Nombre del grupo *"
                value={editName}
                onChangeText={setEditName}
                placeholder="Ej: Desayunos rápidos"
              />
              <Input
                label="Descripción"
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Describe el propósito del grupo..."
                multiline
                numberOfLines={3}
              />
            </ScrollView>
            <View style={styles.sheetActionRow}>
              <Button
                title="Cancelar"
                onPress={() => setEditModalVisible(false)}
                variant="ghost"
                style={{ flex: 1 }}
              />
              <Button
                title="Guardar"
                onPress={handleSaveEdit}
                loading={savingGroup}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Añadir Recetas Existentes al Grupo */}
      <Modal
        visible={addRecipeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddRecipeModal(false)}
      >
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '80%' }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Añadir Recetas a "{group.name}"</Text>
            <Text style={styles.sheetSubtitle}>
              Selecciona las recetas personales que deseas vincular a este grupo:
            </Text>

            {loadingAvailable ? (
              <LoadingScreen message="Cargando recetas disponibles..." />
            ) : availableRecipes.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text style={styles.emptyNoticeText}>
                  Todas tus recetas ya pertenecen a este grupo o aún no tienes recetas creadas.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {availableRecipes.map((r) => {
                  const isChecked = selectedToAdd.includes(r.id);
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.pickerItem, isChecked && styles.pickerItemActive]}
                      onPress={() => toggleSelectRecipeToAdd(r.id)}
                    >
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={isChecked ? Colors.primary : Colors.textMuted}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickerItemTitle}>{r.title}</Text>
                        {r.category ? (
                          <Text style={styles.pickerItemCat}>{r.category}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.sheetActionRow}>
              <Button
                title="Cerrar"
                onPress={() => setAddRecipeModal(false)}
                variant="ghost"
                style={{ flex: 1 }}
              />
              {availableRecipes.length > 0 && (
                <Button
                  title={`Añadir (${selectedToAdd.length})`}
                  onPress={handleConfirmAddRecipes}
                  loading={savingAdd}
                  disabled={selectedToAdd.length === 0}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.tagBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  recipeCountBadge: {
    fontSize: Typography.xs,
    color: Colors.primaryLight,
    marginTop: 2,
    fontWeight: Typography.medium,
  },
  groupDescription: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeightSm,
    marginBottom: 14,
  },
  groupActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.secondary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  actionBtnPrimaryText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: '#fff',
  },
  actionBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.error,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  actionBtnDeleteText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    color: Colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  listSectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  recipeItemWrap: {
    marginBottom: 16,
  },
  removeFromGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  removeFromGroupText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  sheetActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  emptyNoticeText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.lineHeightSm,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.bgSurface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  pickerItemTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  pickerItemCat: {
    fontSize: Typography.xs,
    color: Colors.primaryLight,
    marginTop: 2,
  },
});
