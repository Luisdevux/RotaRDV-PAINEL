// src/types/empresa.ts

export type EmpresaStatus = 'ativo' | 'inativo';

export interface Endereco {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean | string;
}

export interface EnderecoViaCep {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface GestorResumo {
  _id: string;
  nome: string;
  email: string;
  cpf?: string;
  foto_perfil?: string;
}

export interface Empresa {
  _id: string;
  nome_empresa: string;
  cnpj: string;
  email: string;
  telefone?: string;
  endereco?: Endereco;
  foto_logo?: string;
  status: EmpresaStatus;
  gestor_id?: GestorResumo | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CriarEmpresaInput {
  nome_empresa: string;
  cnpj: string;
  email: string;
  telefone?: string;
  endereco?: Endereco;
  status?: EmpresaStatus;
  gestor_id?: string;
}

export interface AtualizarEmpresaInput extends Partial<CriarEmpresaInput> {}
