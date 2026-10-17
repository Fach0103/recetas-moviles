// app/(tabs)/explore.js
import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recipesApi } from '../../src/api/recipes';
import RecipeCard from '../../src/components/RecipeCard';
import EmptyState from '../../src/components/EmptyState';
import LoadingScreen from '../../src/components/LoadingScreen';
import Colors from '../../src/theme/colors';
import Typography from '../../src/theme/typography';

export default function ExploreScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [recipes,    setRecipes]    = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [error,      setError]      = useState(null);

  const applySearch = (list, q) => {
    if (!q.trim()) { setFiltered(list); return; }
    const lower = q.toLowerCase();
    setFiltered(list.filter(r =>
      r.title.toLowerCase().includes(lower) ||
      (r.category || '').toLowerCase().includes(lower)
    ));
  };

  const fetchRecipes = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await recipesApi.listPublic();
      const list = (data.recipes || []).sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', 'es', { sensitivity: 'base' })
      );
      setRecipes(list);
      applySearch(list, search);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (q) => { setSearch(q); applySearch(recipes, q); };

  useFocusEffect(useCallback(() => { fetchRecipes(); }, []));

  if (loading && !refreshing) return <LoadingScreen message="Cargando recetas públicas..." />;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[Colors.primaryGlow, 'transparent']}
        style={styles.headerGlow}
        pointerEvents="none"
      />

      <View style={styles.header}>
        <Text style={styles.title}>Explorar 🌍</Text>
        <Text style={styles.subtitle}>Recetas públicas de la comunidad</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
          placeholder="Buscar recetas públicas..."
          placeholderTextColor={Colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.countText}>
        {filtered.length} receta{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
      </Text>

      {error ? (
        <EmptyState icon="alert-circle-outline" title="Error al cargar" subtitle={error} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() => router.push(`/recipe/${item.id}`)}
              showAuthor
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchRecipes(true); }}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="globe-outline"
              title={search ? 'Sin resultados' : 'No hay recetas públicas'}
              subtitle={
                search
                  ? 'Prueba con otro término'
                  : 'Sé el primero en compartir una receta pública'
              }
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.bg },
  headerGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 160,
    opacity: 0.45,
  },
  header: {
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.md,
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  countText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
});
