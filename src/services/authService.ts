// src/services/authService.ts

import api from './api';
import { 
  SignupEmpresaData, 
  RecuperarSenhaInput, 
  RedefinirSenhaInput, 
  ApiResponse 
} from '../types';

export const authService = {
  async signupEmpresa(data: SignupEmpresaData): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/signup', data);
    return response.data;
  },

  async recuperarSenha(data: RecuperarSenhaInput): Promise<ApiResponse> {
    const response = await api.post<ApiResponse>('/recupera-senha', data);
    return response.data;
  },

  async redefinirSenha(data: RedefinirSenhaInput): Promise<ApiResponse> {
    const response = await api.patch<ApiResponse>(`/atualizar-senha-token?token=${data.token}`, {
      senha: data.senha
    });
    return response.data;
  },

  async verificarEmail(token: string): Promise<ApiResponse> {
    const response = await api.get<ApiResponse>(`/verificar-email?token=${token}`);
    return response.data;
  }
};
