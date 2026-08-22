// src/services/usuarioService.ts

import api from './api';
import { 
  Usuario, 
  AtualizarUsuarioInput, 
  UserStatus, 
  ApiResponse, 
  PaginatedResult,
  ListarUsuariosParams 
} from '../types';

export const usuarioService = {
  async listar(params?: ListarUsuariosParams): Promise<PaginatedResult<Usuario>> {
    const response = await api.get<ApiResponse<PaginatedResult<Usuario>>>('/usuarios', { params });
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async buscarPorID(id: string): Promise<Usuario> {
    const response = await api.get<ApiResponse<Usuario>>(`/usuarios/${id}`);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async atualizar(id: string, data: AtualizarUsuarioInput): Promise<Usuario> {
    const response = await api.patch<ApiResponse<Usuario>>(`/usuarios/${id}`, data);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async atualizarStatus(id: string, status: UserStatus): Promise<Usuario> {
    const response = await api.patch<ApiResponse<Usuario>>(`/usuarios/${id}/status`, { status });
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async uploadFoto(id: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<ApiResponse<{ url: string }>>(`/usuarios/${id}/foto`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async deletarFoto(id: string): Promise<void> {
    await api.delete(`/usuarios/${id}/foto`);
  }
};
