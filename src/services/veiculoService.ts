// src/services/veiculoService.ts

import api from './api';
import { 
  Veiculo, 
  CriarVeiculoInput, 
  AtualizarVeiculoInput, 
  ApiResponse, 
  PaginatedResult 
} from '../types';

export const veiculoService = {
  async listar(params?: { page?: number; limite?: number; placa?: string; modelo?: string }): Promise<PaginatedResult<Veiculo>> {
    const response = await api.get<ApiResponse<PaginatedResult<Veiculo>>>('/veiculos', { params });
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async buscarPorID(id: string): Promise<Veiculo> {
    const response = await api.get<ApiResponse<Veiculo>>(`/veiculos/${id}`);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async criar(data: CriarVeiculoInput): Promise<Veiculo> {
    const response = await api.post<ApiResponse<Veiculo>>('/veiculos', data);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async atualizar(id: string, data: AtualizarVeiculoInput): Promise<Veiculo> {
    const response = await api.patch<ApiResponse<Veiculo>>(`/veiculos/${id}`, data);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async atualizarStatus(id: string, status: 'ativo' | 'inativo'): Promise<Veiculo> {
    const response = await api.patch<ApiResponse<Veiculo>>(`/veiculos/${id}/status`, { status });
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async deletar(id: string): Promise<void> {
    await api.delete(`/veiculos/${id}`);
  }
};
