// app/recipe/create.js
// Pantalla para crear una nueva receta con ingredientes, pasos, grupos y validaciones
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../src/components/ScreenHeader';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import Colors from '../../src/theme/colors';
import Typography from '../../src/theme/typography';
import { recipesApi } from '../../src/api/recipes';
import { groupsApi } from '../../src/api/groups';

const CATEGORIES = ['Desayuno', 'Almuerzo', 'Cena', 'Postre', 'Bebida', 'Snack', 'Sopa', 'Ensalada'];

export default function CreateRecipeScreen() {
  const router = useRouter();

  // Campos principales
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [prepTime,    setPrepTime]    = useState('');
  const [servings,    setServings]    = useState('2');
  const [category,    setCategory]    = useState('');
  const [isPublic,    setIsPublic]    = useState(false);

  // Ingredientes dinámicos: [{ name, quantity, unit }]
  const [ingredients, setIngredients] = useState([]);
  const [ingName,     setIngName]     = useState('');
  const [ingQuantity, setIngQuantity] = useState('');
  const [ingUnit,     setIngUnit]     = useState('');

  // Pasos dinámicos: [string]
  const [steps,       setSteps]       = useState([]);
  const [stepText,    setStepText]    = useState('');

  // Grupos
  const [userGroups,      setUserGroups]      = useState([]);
  const [selectedGroups,  setSelectedGroups]  = useState([]);

  // Validaciones y estado
  const [existingTitles, setExistingTitles] = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [errors,         setErrors]         = useState({});

  useEffect(() => {
    // Cargar grupos del usuario y títulos existentes para pre-validación de duplicados
    const loadInitialData = async () => {
      try {
        const [groupsRes, recipesRes] = await Promise.all([
          groupsApi.listMine().catch(() => ({ groups: [] })),
          recipesApi.listMine().catch(() => ({ recipes: [] })),
        ]);
        setUserGroups(groupsRes.groups || []);
        const titles = (recipesRes.recipes || []).map((r) =>
          r.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
        );
        setExistingTitles(titles);
      } catch (e) {
        // Silencioso
      }
    };
    loadInitialData();
  }, []);

  // Agregar ingrediente
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

  // Agregar paso
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

  // Alternar selección de grupo
  const toggleGroup = (groupId) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter((id) => id !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  // Guardar receta
  const handleCreateRecipe = async () => {
    const newErrors = {};

    if (!title.trim() || title.trim().length < 2) {
      newErrors.title = 'El título debe tener al menos 2 caracteres';
    } else {
      const normalized = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      if (existingTitles.includes(normalized)) {
        newErrors.title = 'Ya tienes una receta con este nombre o título';
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

      const res = await recipesApi.create(payload);
      const newRecipe = res.recipe;

      // Si seleccionó grupos, asociarlos ahora
      if (selectedGroups.length > 0 && newRecipe?.id) {
        await recipesApi.setGroups(newRecipe.id, selectedGroups);
      }

      Alert.alert('¡Éxito!', 'Receta creada correctamente', [
        {
          text: 'Ver Receta',
          onPress: () => router.replace(`/recipe/${newRecipe.id}`),
        },
        {
          text: 'Ir a Mis Recetas',
          onPress: () => router.replace('/(tabs)/my-recipes'),
        },
      ]);
    } catch (err) {
      Alert.alert('Error al crear receta', err.message || 'No se pudo guardar la receta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Nueva Receta" showBack />

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
          {/* Tarjeta de información básica */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="book-outline" size={20} color={Colors.primary} />
              <Text style={styles.cardTitle}>Información Básica</Text>
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

            {/* Categorías sugeridas */}
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

            {/* Visibilidad pública/privada */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.switchTitle}>Hacer receta pública</Text>
                <Text style={styles.switchSubtitle}>
                  {isPublic
                    ? 'Visible para todos los usuarios en la pestaña Explorar'
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

            {/* Lista actual de ingredientes */}
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

            {/* Formulario para añadir ingrediente */}
            <View style={styles.addMiniForm}>
              <Input
                label="Nombre del ingrediente"
                value={ingName}
                onChangeText={setIngName}
                placeholder="Ej: Harina de trigo, Sal, Mantequilla..."
              />
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Cantidad"
                    value={ingQuantity}
                    onChangeText={setIngQuantity}
                    placeholder="Ej: 250, 1/2, al gusto"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Unidad"
                    value={ingUnit}
                    onChangeText={setIngUnit}
                    placeholder="Ej: g, ml, tazas, cdas"
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

            {/* Lista actual de pasos */}
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

            {/* Formulario para añadir paso */}
            <View style={styles.addMiniForm}>
              <Input
                label={`Paso ${steps.length + 1}`}
                value={stepText}
                onChangeText={setStepText}
                placeholder="Describe qué hacer en este paso..."
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
              Una receta puede pertenecer a múltiples grupos a la vez.
            </Text>

            {userGroups.length === 0 ? (
              <Text style={styles.emptyNotice}>
                No tienes grupos creados aún. Puedes crear uno en la pestaña Grupos.
              </Text>
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

          {/* Botón principal Crear */}
          <View style={styles.footerSubmit}>
            <Button
              title="Guardar y Publicar Receta"
              onPress={handleCreateRecipe}
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
