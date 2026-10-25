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

export interface AdminResumo {
  _id: string;
  nome: string;
  email: string;
  cpf?: string;
  foto_perfil?: string;
  empresa_id?: string;
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
  admin_id?: AdminResumo | string;
  matriz_id?: { _id: string; nome_empresa: string; cnpj: string } | string | null;
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
  admin_id?: string;
  matriz_id?: string;
}

export interface AtualizarEmpresaInput extends Partial<CriarEmpresaInput> {}
