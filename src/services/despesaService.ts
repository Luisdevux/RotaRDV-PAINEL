// src/services/despesaService.ts

import api from './api';
import { 
  Despesa, 
  CriarDespesaInput, 
  ApiResponse, 
  PaginatedResult 
} from '../types';

export const despesaService = {
  async listar(params?: { 
    page?: number; 
    limite?: number; 
    viagem_id?: string; 
    tipo?: string; 
    data_inicio?: string; 
    data_fim?: string; 
  }): Promise<PaginatedResult<Despesa>> {
    const response = await api.get<ApiResponse<PaginatedResult<Despesa>>>('/despesas', { params });
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async buscarPorID(id: string): Promise<Despesa> {
    const response = await api.get<ApiResponse<Despesa>>(`/despesas/${id}`);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async criar(data: CriarDespesaInput): Promise<Despesa> {
    const response = await api.post<ApiResponse<Despesa>>('/despesas', data);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async deletar(id: string): Promise<void> {
    await api.delete(`/despesas/${id}`);
  },

  async uploadFoto(id: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('comprovante', file);
    formData.append('foto', file);

    const response = await api.post<ApiResponse<{ url: string }>>(`/despesas/${id}/foto`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async deletarFoto(id: string): Promise<void> {
    await api.delete(`/despesas/${id}/foto`);
  }
};
