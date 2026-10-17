// src/api/users.js
import { api } from './client';

export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
  deleteMe: () => api.delete('/users/me'),
};
