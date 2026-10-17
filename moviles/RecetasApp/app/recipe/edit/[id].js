// app/recipe/edit/[id].js
// Pantalla para editar una receta existente
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../../src/components/ScreenHeader';
import Input from '../../../src/components/Input';
import Button from '../../../src/components/Button';
import LoadingScreen from '../../../src/components/LoadingScreen';
import EmptyState from '../../../src/components/EmptyState';
import Colors from '../../../src/theme/colors';
import Typography from '../../../src/theme/typography';
import { recipesApi } from '../../../src/api/recipes';
import { groupsApi } from '../../../src/api/groups';

const CATEGORIES = ['Desayuno', 'Almuerzo', 'Cena', 'Postre', 'Bebida', 'Snack', 'Sopa', 'Ensalada'];

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Estados de datos
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading,        setLoading]        = useState(false);
  const [loadError,      setLoadError]      = useState(null);

  // Campos
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [prepTime,    setPrepTime]    = useState('');
  const [servings,    setServings]    = useState('2');
  const [category,    setCategory]    = useState('');
  const [isPublic,    setIsPublic]    = useState(false);

  // Ingredientes
  const [ingredients, setIngredients] = useState([]);
  const [ingName,     setIngName]     = useState('');
  const [ingQuantity, setIngQuantity] = useState('');
  const [ingUnit,     setIngUnit]     = useState('');

  // Pasos
  const [steps,       setSteps]       = useState([]);
  const [stepText,    setStepText]    = useState('');

  // Grupos
  const [userGroups,     setUserGroups]     = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);

  // Validación de duplicados
  const [otherTitles, setOtherTitles] = useState([]);
  const [errors,      setErrors]      = useState({});

  useEffect(() => {
    const fetchAllData = async () => {
      setInitialLoading(true);
      setLoadError(null);
      try {
        const [recipeRes, groupsRes, myRecipesRes] = await Promise.all([
          recipesApi.getById(id),
          groupsApi.listMine().catch(() => ({ groups: [] })),
          recipesApi.listMine().catch(() => ({ recipes: [] })),
        ]);

        const r = recipeRes.recipe;
        if (!r) throw new Error('Receta no encontrada');

        setTitle(r.title || '');
        setDescription(r.description || '');
        setPrepTime(r.prepTime ? String(r.prepTime) : '');
        setServings(r.servings ? String(r.servings) : '1');
        setCategory(r.category || '');
        setIsPublic(Boolean(r.isPublic));
        setIngredients(r.ingredients || []);
        setSteps(r.steps || []);
        setSelectedGroups(r.groups || []);

        setUserGroups(groupsRes.groups || []);

        // Guardar otros títulos para validar duplicados (excluyendo la receta actual)
        const others = (myRecipesRes.recipes || [])
          .filter((item) => item.id !== id)
          .map((item) =>
            item.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
          );
        setOtherTitles(others);
      } catch (err) {
        setLoadError(err.message || 'Error al cargar la receta');
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) fetchAllData();
  }, [id]);

  // Ingredientes
  const handleAddIngredient = () => {
    if (!ingName.trim()) {
      Alert.alert('Atención', 'Ingresa el nombre del ingrediente');
      return;
    }
    setIngredients([
      ...ingredients,
      {
        name: ingName.trim(),
        quantity: ingQuantity.trim(),
        unit: ingUnit.trim(),
      },
    ]);
    setIngName('');
    setIngQuantity('');
    setIngUnit('');
  };

  const handleRemoveIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Pasos
  const handleAddStep = () => {
    if (!stepText.trim()) {
      Alert.alert('Atención', 'Ingresa la descripción del paso');
      return;
    }
    setSteps([...steps, stepText.trim()]);
    setStepText('');
  };

  const handleRemoveStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  // Grupos
  const toggleGroup = (groupId) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter((gId) => gId !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  // Guardar cambios
  const handleSaveRecipe = async () => {
    const newErrors = {};

    if (!title.trim() || title.trim().length < 2) {
      newErrors.title = 'El título debe tener al menos 2 caracteres';
    } else {
      const normalized = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      if (otherTitles.includes(normalized)) {
        newErrors.title = 'Ya existe otra receta con este nombre o título';
      }
    }

    if (ingredients.length === 0) {
      newErrors.ingredients = 'Debes añadir al menos 1 ingrediente';
    }

    if (steps.length === 0) {
      newErrors.steps = 'Debes añadir al menos 1 paso de preparación';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      Alert.alert('Formulario incompleto', firstError);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        ingredients,
        steps,
        prepTime: prepTime ? Number(prepTime) : undefined,
        servings: servings ? Number(servings) : 1,
        category: category.trim(),
        isPublic,
      };

      await recipesApi.update(id, payload);
      await recipesApi.setGroups(id, selectedGroups);

      Alert.alert('¡Actualizada!', 'Los cambios se guardaron con éxito', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      Alert.alert('Error al guardar', err.message || 'No se pudieron guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingScreen message="Cargando datos de la receta..." />;
  }

  if (loadError) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Editar Receta" showBack />
        <EmptyState
          icon="alert-circle-outline"
          title="Error"
          subtitle={loadError}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Editar Receta" showBack />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Información Básica */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Información de la Receta</Text>
            </View>

            <Input
              label="Título de la receta *"
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
              }}
              placeholder="Ej: Risotto de Hongos Silvestres"
              error={errors.title}
            />

            <Input
              label="Descripción o resumen"
              value={description}
              onChangeText={setDescription}
              placeholder="Breve historia o consejo para este platillo..."
              multiline
              numberOfLines={3}
            />

            {/* Categorías */}
            <Text style={styles.fieldLabel}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category.toLowerCase() === cat.toLowerCase();
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setCategory(isSelected ? '' : cat)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Tiempo (min)"
                  value={prepTime}
                  onChangeText={setPrepTime}
                  placeholder="Ej: 45"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Porciones"
                  value={servings}
                  onChangeText={setServings}
                  placeholder="Ej: 4"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Switch de visibilidad */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.switchTitle}>Hacer receta pública</Text>
                <Text style={styles.switchSubtitle}>
                  {isPublic
                    ? 'Visible para todos los usuarios en Explorar'
                    : 'Solo tú podrás ver y acceder a esta receta'}
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: Colors.border, true: Colors.primaryDark }}
                thumbColor={isPublic ? Colors.primary : Colors.textMuted}
              />
            </View>
          </View>

          {/* Tarjeta de Ingredientes */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="list-outline" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>
                Ingredientes ({ingredients.length}) *
              </Text>
            </View>

            {errors.ingredients && (
              <Text style={styles.errorBanner}>{errors.ingredients}</Text>
            )}

            {ingredients.map((item, idx) => (
              <View key={idx} style={styles.ingredientItem}>
                <View style={styles.bullet} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.ingredientName}>{item.name}</Text>
                  {(item.quantity || item.unit) ? (
                    <Text style={styles.ingredientQty}>
                      {item.quantity} {item.unit}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveIngredient(idx)}
                  style={styles.deleteMiniBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addMiniForm}>
              <Input
                label="Nombre del ingrediente"
                value={ingName}
                onChangeText={setIngName}
                placeholder="Ej: Tomates secos, Queso parmesano..."
              />
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Cantidad"
                    value={ingQuantity}
                    onChangeText={setIngQuantity}
                    placeholder="Ej: 100, 2, pizca"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Unidad"
                    value={ingUnit}
                    onChangeText={setIngUnit}
                    placeholder="Ej: g, ml, tazas, pzas"
                  />
                </View>
              </View>
              <Button
                title="+ Añadir Ingrediente"
                onPress={handleAddIngredient}
                variant="secondary"
                size="sm"
                style={{ marginTop: 4 }}
              />
            </View>
          </View>

          {/* Tarjeta de Pasos */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="footsteps-outline" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>
                Pasos de Preparación ({steps.length}) *
              </Text>
            </View>

            {errors.steps && (
              <Text style={styles.errorBanner}>{errors.steps}</Text>
            )}

            {steps.map((st, idx) => (
              <View key={idx} style={styles.stepItem}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{st}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveStep(idx)}
                  style={styles.deleteMiniBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addMiniForm}>
              <Input
                label={`Paso ${steps.length + 1}`}
                value={stepText}
                onChangeText={setStepText}
                placeholder="Describe el paso..."
                multiline
                numberOfLines={3}
              />
              <Button
                title="+ Añadir Paso"
                onPress={handleAddStep}
                variant="secondary"
                size="sm"
                style={{ marginTop: 4 }}
              />
            </View>
          </View>

          {/* Tarjeta de Grupos */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="folder-outline" size={20} color={Colors.secondary} />
              <Text style={styles.cardTitle}>Asignar a Grupos</Text>
            </View>
            <Text style={styles.cardSubtitle}>
              Selecciona los grupos en los que debe estar esta receta:
            </Text>

            {userGroups.length === 0 ? (
              <Text style={styles.emptyNotice}>No tienes grupos creados.</Text>
            ) : (
              <View style={styles.groupChipsContainer}>
                {userGroups.map((grp) => {
                  const isChecked = selectedGroups.includes(grp.id);
                  return (
                    <TouchableOpacity
                      key={grp.id}
                      style={[styles.groupChip, isChecked && styles.groupChipActive]}
                      onPress={() => toggleGroup(grp.id)}
                    >
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={isChecked ? Colors.primary : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.groupChipText,
                          isChecked && styles.groupChipTextActive,
                        ]}
                      >
                        {grp.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Botón Guardar */}
          <View style={styles.footerSubmit}>
            <Button
              title="Guardar Cambios"
              onPress={handleSaveRecipe}
              loading={loading}
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  chipTextActive: {
    color: Colors.primaryLight,
    fontWeight: Typography.bold,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  switchTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  switchSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    color: Colors.error,
    padding: 8,
    borderRadius: 8,
    fontSize: Typography.xs,
    marginBottom: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  ingredientName: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  ingredientQty: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteMiniBtn: {
    padding: 6,
  },
  addMiniForm: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.bgSurface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  stepBadgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.primaryLight,
  },
  stepText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeightSm,
  },
  emptyNotice: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  groupChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  groupChipText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  groupChipTextActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.semibold,
  },
  footerSubmit: {
    marginTop: 8,
    marginBottom: 20,
  },
});
