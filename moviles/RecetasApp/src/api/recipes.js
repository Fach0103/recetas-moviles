// src/api/recipes.js
import { api } from './client';

export const recipesApi = {
  // Mis recetas (privadas + públicas del usuario)
  listMine: () => api.get('/recipes/mine'),
  // Recetas generales (públicas de todos)
  listPublic: () => api.get('/recipes', false),
  // Una receta por ID
  getById: (id) => api.get(`/recipes/${id}`),
  // Crear receta
  create: (data) => api.post('/recipes', data),
  // Actualizar receta
  update: (id, data) => api.put(`/recipes/${id}`, data),
  // Borrar receta
  remove: (id) => api.delete(`/recipes/${id}`),
  // Asignar grupos a una receta
  setGroups: (id, groupIds) => api.put(`/recipes/${id}/groups`, { groupIds }),
};
