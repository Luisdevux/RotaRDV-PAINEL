// src/types/despesa.ts

export type TipoDespesa = 
  | 'ABASTECIMENTO'
  | 'ALIMENTACAO'
  | 'MANUTENCAO'
  | 'PEDAGIO'
  | 'OUTROS';

export type TipoCombustivel = 
  | 'DIESEL_S10'
  | 'DIESEL_S500'
  | 'GASOLINA'
  | 'ETANOL'
  | 'ARLA_32'
  | 'OUTRO';

export interface Despesa {
  _id: string;
  viagem_id: string;
  tipo: TipoDespesa;
  valor_total: number;
  data: string;
  local?: string;
  descricao?: string;
  foto_anexo?: string;
  
  // Exclusivos de Abastecimento
  litros?: number;
  valor_litro?: number;
  tipo_combustivel?: TipoCombustivel;
  km_atual?: number;

  // Alimentação
  tipo_refeicao?: string;

  // Manutenção
  oficina_nome?: string;

  // Pedágio
  praca_nome?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface CriarDespesaInput {
  viagem_id: string;
  tipo: TipoDespesa;
  valor_total: number;
  data: string;
  local?: string;
  descricao?: string;
  foto_anexo?: string;
  litros?: number;
  valor_litro?: number;
  tipo_combustivel?: TipoCombustivel;
  km_atual?: number;
  oficina_nome?: string;
  praca_nome?: string;
}
