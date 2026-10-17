// src/api/groups.js
import { api } from './client';

export const groupsApi = {
  listMine: () => api.get('/groups'),
  getById: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  remove: (id) => api.delete(`/groups/${id}`),
  getDeletePreview: (id) => api.get(`/groups/${id}/delete-preview`),
  getRecipes: (id) => api.get(`/groups/${id}/recipes`),
};
