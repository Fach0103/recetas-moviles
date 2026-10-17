// app/(tabs)/groups.js
import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { groupsApi } from '../../src/api/groups';
import GroupCard from '../../src/components/GroupCard';
import EmptyState from '../../src/components/EmptyState';
import LoadingScreen from '../../src/components/LoadingScreen';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import Colors from '../../src/theme/colors';
import Typography from '../../src/theme/typography';

// ── Modal Crear/Editar Grupo ──
function GroupFormModal({ visible, onClose, onSave, initialData }) {
  const [name,        setName]        = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [loading,     setLoading]     = useState(false);
  const [nameError,   setNameError]   = useState('');

  React.useEffect(() => {
    if (visible) {
      setName(initialData?.name || '');
      setDescription(initialData?.description || '');
      setNameError('');
    }
  }, [visible, initialData]);

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setNameError('El nombre debe tener al menos 2 caracteres');
      return;
    }
    setNameError('');
    setLoading(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>
            {initialData ? 'Editar grupo' : 'Nuevo grupo'}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Input
              label="Nombre del grupo"
              value={name}
              onChangeText={setName}
              placeholder="Ej: Postres, Comida rápida..."
              error={nameError}
            />
            <Input
              label="Descripción (opcional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Describe el grupo..."
              multiline
              numberOfLines={3}
            />
          </ScrollView>
          <View style={styles.sheetActions}>
            <Button title="Cancelar" onPress={onClose} variant="ghost" style={styles.actionBtn} />
            <Button
              title={initialData ? 'Guardar' : 'Crear'}
              onPress={handleSave}
              loading={loading}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function GroupsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [groups,      setGroups]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);

  const fetchGroups = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await groupsApi.listMine();
      const list = (data.groups || []).sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' })
      );
      setGroups(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchGroups(); }, []));

  const openCreate = () => { setEditTarget(null); setModalVisible(true); };
  const openEdit   = (group) => { setEditTarget(group); setModalVisible(true); };

  const handleSave = async (data) => {
    if (editTarget) {
      await groupsApi.update(editTarget.id, data);
    } else {
      await groupsApi.create(data);
    }
    fetchGroups(true);
  };

  const handleDelete = async (group) => {
    let preview;
    try {
      preview = await groupsApi.getDeletePreview(group.id);
    } catch (err) {
      Alert.alert('Error', err.message);
      return;
    }

    const msg =
      preview.totalRecipesInGroup === 0
        ? '¿Seguro que deseas borrar este grupo? Está vacío.'
        : `Este grupo contiene ${preview.totalRecipesInGroup} receta(s):\n\n` +
          `• ${preview.recipesToDelete} se borrarán permanentemente (solo están en este grupo)\n` +
          `• ${preview.recipesToKeep} quedarán en otros grupos\n\n` +
          '¿Deseas continuar?';

    Alert.alert('Borrar grupo', msg, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          try {
            await groupsApi.remove(group.id);
            fetchGroups(true);
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  if (loading && !refreshing) return <LoadingScreen message="Cargando grupos..." />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(176,92,48,0.15)', 'transparent']}
        style={styles.headerGlow}
        pointerEvents="none"
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mis Grupos 📁</Text>
          <Text style={styles.subtitle}>Organiza tus recetas</Text>
        </View>
        <TouchableOpacity style={styles.addBtnShadow} onPress={openCreate} activeOpacity={0.82}>
          <LinearGradient
            colors={[Colors.secondary, Colors.secondaryLight]}
            style={styles.addBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={26} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {error ? (
        <EmptyState icon="alert-circle-outline" title="Error" subtitle={error} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              onPress={() => router.push(`/group/${item.id}`)}
              onEdit={() => openEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchGroups(true); }}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="folder-open-outline"
              title="Sin grupos aún"
              subtitle="Crea tu primer grupo para organizar tus recetas"
            />
          }
        />
      )}

      <GroupFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        initialData={editTarget}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.bg },
  headerGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 160,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtnShadow: {
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  // Modal
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: { flex: 1 },
});
