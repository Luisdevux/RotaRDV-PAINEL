// src/types/auth.ts

export interface LoginCredentials {
  email: string;
  senha?: string;
}

export interface EnderecoInput {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface GestorSignupInput {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  telefone?: string;
}

export interface SignupEmpresaData {
  nome_empresa: string;
  cnpj: string;
  email_empresa: string;
  telefone_empresa?: string;
  endereco?: EnderecoInput;
  gestor: GestorSignupInput;
}

export interface RecuperarSenhaInput {
  email: string;
}

export interface RedefinirSenhaInput {
  token: string;
  senha: string;
}
