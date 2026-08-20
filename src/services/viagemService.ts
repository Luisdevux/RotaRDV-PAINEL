// src/services/viagemService.ts

import api from './api';
import { 
  Viagem, 
  CriarViagemInput, 
  ConcluirViagemInput, 
  ApiResponse, 
  PaginatedResult 
} from '../types';

export const viagemService = {
  async listar(params?: { 
    page?: number; 
    limite?: number; 
    status?: string; 
    veiculo_id?: string; 
    data_inicio?: string; 
    data_fim?: string; 
  }): Promise<PaginatedResult<Viagem>> {
    const response = await api.get<ApiResponse<PaginatedResult<Viagem>>>('/viagens', { params });
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async buscarPorID(id: string): Promise<Viagem> {
    const response = await api.get<ApiResponse<Viagem>>(`/viagens/${id}`);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async criar(data: CriarViagemInput): Promise<Viagem> {
    const response = await api.post<ApiResponse<Viagem>>('/viagens', data);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async concluir(id: string, data: ConcluirViagemInput): Promise<Viagem> {
    const response = await api.patch<ApiResponse<Viagem>>(`/viagens/${id}`, data);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async atualizar(id: string, data: Partial<Viagem>): Promise<Viagem> {
    const response = await api.patch<ApiResponse<Viagem>>(`/viagens/${id}`, data);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async deletar(id: string): Promise<void> {
    await api.delete(`/viagens/${id}`);
  }
};
