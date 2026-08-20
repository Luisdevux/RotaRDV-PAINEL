// src/types/usuario.ts

import { Veiculo } from './veiculo';

export type UserRole = 'admin' | 'gestor' | 'motorista';
export type UserStatus = 'ativo' | 'inativo';

export interface UsuarioEmpresaSnapshot {
  nome?: string;
  cargo?: string;
}

export interface Usuario {
  _id: string;
  nome: string;
  email: string;
  role: UserRole;
  isAdmin?: boolean;
  status: UserStatus;
  cpf?: string;
  telefone?: string;
  foto_perfil?: string;
  empresa_id?: string;
  empresa?: UsuarioEmpresaSnapshot;
  veiculo_id?: Veiculo | string;
  email_verificada?: boolean;
  authProvider?: 'local' | 'google';
  createdAt?: string;
  updatedAt?: string;
}

export interface CriarMotoristaInput {
  nome: string;
  email: string;
  senha?: string;
  cpf?: string;
  telefone?: string;
  cargo?: string;
  veiculo_id?: string;
}

export interface AtualizarUsuarioInput {
  nome?: string;
  cpf?: string;
  telefone?: string;
  cargo?: string;
  veiculo_id?: string | null;
  status?: UserStatus;
}
