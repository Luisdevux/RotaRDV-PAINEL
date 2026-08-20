// src/services/api.ts

import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rotardv-api.luisfelipe.dpdns.org';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const session = await getSession();
    const token = session?.accessToken || (session as any)?.accesstoken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customMessage = 
      error.response?.data?.mensagem || 
      error.response?.data?.details?.[0] || 
      error.response?.data?.message || 
      error.message || 
      'Ocorreu um erro na requisição.';
      
    error.friendlyMessage = customMessage;
    return Promise.reject(error);
  }
);

export default api;
