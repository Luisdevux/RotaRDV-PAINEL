// src/services/empresaService.ts

import api from './api';
import { 
  Empresa, 
  CriarEmpresaInput, 
  AtualizarEmpresaInput, 
  EmpresaStatus, 
  DashboardData,
  Usuario,
  CriarMotoristaInput,
  Veiculo,
  ApiResponse,
  PaginatedResult
} from '../types';

export const empresaService = {
  async listar(params?: { page?: number; limite?: number; search?: string; status?: string }): Promise<PaginatedResult<Empresa>> {
    const response = await api.get<ApiResponse<PaginatedResult<Empresa>>>('/empresas', { params });
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async buscarPorID(id: string): Promise<Empresa> {
    const response = await api.get<ApiResponse<Empresa>>(`/empresas/${id}`);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async criar(data: CriarEmpresaInput): Promise<Empresa> {
    const response = await api.post<ApiResponse<Empresa>>('/empresas', data);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async atualizar(id: string, data: AtualizarEmpresaInput): Promise<Empresa> {
    const response = await api.patch<ApiResponse<Empresa>>(`/empresas/${id}`, data);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async atualizarStatus(id: string, status: EmpresaStatus): Promise<Empresa> {
    const response = await api.patch<ApiResponse<Empresa>>(`/empresas/${id}/status`, { status });
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async deletar(id: string): Promise<void> {
    await api.delete(`/empresas/${id}`);
  },

  async uploadLogo(id: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('foto_logo', file);
    formData.append('logo', file);

    const response = await api.post<ApiResponse<{ url: string }>>(`/empresas/${id}/foto-logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async deletarLogo(id: string): Promise<void> {
    await api.delete(`/empresas/${id}/foto-logo`);
  },

  async buscarDashboard(id: string): Promise<DashboardData> {
    const response = await api.get<ApiResponse<DashboardData>>(`/empresas/${id}/dashboard`);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async listarMotoristas(id: string, params?: { page?: number; limite?: number }): Promise<PaginatedResult<Usuario>> {
    const response = await api.get<ApiResponse<PaginatedResult<Usuario>>>(`/empresas/${id}/motoristas`, { params });
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async cadastrarMotorista(id: string, data: CriarMotoristaInput): Promise<Usuario> {
    const response = await api.post<ApiResponse<Usuario>>(`/empresas/${id}/motoristas`, data);
    return response.data?.dados || response.data?.data || (response.data as any);
  },

  async desvincularMotorista(empresaId: string, motoristaId: string): Promise<void> {
    await api.delete(`/empresas/${empresaId}/motoristas/${motoristaId}`);
  },

  async listarVeiculos(id: string, params?: { page?: number; limite?: number }): Promise<PaginatedResult<Veiculo>> {
    const response = await api.get<ApiResponse<PaginatedResult<Veiculo>>>(`/empresas/${id}/veiculos`, { params });
    return response.data?.dados || response.data?.data || (response.data as any);
  }
};
