// src/api/client.js
// Cliente HTTP centralizado que agrega el token JWT a cada petición.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Constants from 'expo-constants';

// En tu red local tu PC tiene la IP 192.168.10.19
const BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000/api' 
  : 'http://192.168.10.19:3000/api';

console.log('[API BASE_URL]:', BASE_URL);



async function request(method, path, body = null, requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (requiresAuth) {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const options = { method, headers, signal: controller.signal };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`[API REQUEST] ${method} ${BASE_URL}${path}`, body);
    const response = await fetch(`${BASE_URL}${path}`, options);
    clearTimeout(timeoutId);
    console.log(`[API RESPONSE] ${response.status} de ${path}`);

    if (response.status === 204) return null;

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'Error en la petición');
      error.details = data.details;
      error.statusCode = response.status;
      throw error;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    const isCanceled = err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('cancel'));
    if (isCanceled) {
      console.log(`[API INFO] Petición cancelada por cambio de pantalla: ${method} ${path}`);
      const cancelError = new Error('Petición cancelada');
      cancelError.isCanceled = true;
      throw cancelError;
    }
    console.error(`[API ERROR] en ${method} ${path}:`, err.message || err);
    throw err;
  }
}

export const api = {
  get: (path, auth = true) => request('GET', path, null, auth),
  post: (path, body, auth = true) => request('POST', path, body, auth),
  put: (path, body, auth = true) => request('PUT', path, body, auth),
  delete: (path, auth = true) => request('DELETE', path, null, auth),
};
