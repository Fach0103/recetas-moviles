// src/api/auth.js
import { api } from './client';

export const authApi = {
  register: (data) => api.post('/auth/register', data, false),
  login: (data) => api.post('/auth/login', data, false),
};
