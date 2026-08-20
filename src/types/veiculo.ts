// src/types/veiculo.ts

export type CombustivelPreferencial = 
  | 'DIESEL_S10'
  | 'DIESEL_S500'
  | 'GASOLINA'
  | 'ETANOL'
  | 'ARLA_32'
  | 'OUTRO';

export interface Reboque {
  placa?: string;
  modelo?: string;
}

export interface Veiculo {
  _id: string;
  placa: string;
  modelo: string;
  combustivel_preferencial: CombustivelPreferencial;
  capacidade_tanque: number;
  ano_fabricacao: number;
  reboque?: Reboque;
  empresa_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CriarVeiculoInput {
  placa: string;
  modelo: string;
  combustivel_preferencial: CombustivelPreferencial;
  capacidade_tanque: number;
  ano_fabricacao: number;
  reboque?: Reboque;
  empresa_id?: string;
}

export interface AtualizarVeiculoInput extends Partial<CriarVeiculoInput> {}
