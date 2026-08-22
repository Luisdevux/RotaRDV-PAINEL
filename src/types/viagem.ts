// src/types/viagem.ts

import { Despesa } from './despesa';

export type StatusViagem = 'em_andamento' | 'concluída' | 'cancelada';

export interface DespesasPorCategoria {
  ABASTECIMENTO: number;
  ALIMENTACAO: number;
  MANUTENCAO: number;
  PEDAGIO: number;
  OUTROS: number;
}

export interface MetricasConsumo {
  km_percorrido: number;
  total_litros: number;
  media_consumo: number; // km/l
}

export interface ResumoFinanceiro {
  total_geral: number;
  por_categoria: DespesasPorCategoria;
  metricas: MetricasConsumo;
}

export interface UsuarioSnapshot {
  _id: string;
  nome: string;
  email: string;
  foto_perfil?: string;
  foto?: string;
}

export interface VeiculoSnapshot {
  _id?: string;
  placa: string;
  modelo: string;
  reboque?: {
    placa?: string;
    modelo?: string;
  };
}

export type LocalViagem = string | { cidade: string; estado: string };

export interface Viagem {
  _id: string;
  usuario_id: UsuarioSnapshot | string;
  usuario_snapshot?: UsuarioSnapshot;
  veiculo_id?: VeiculoSnapshot | string;
  veiculo_snapshot?: VeiculoSnapshot;
  empresa_id?: string;
  origem: LocalViagem;
  destino: LocalViagem;
  status: StatusViagem;
  km_inicial: number;
  km_final?: number;
  data_inicio: string;
  data_fim?: string;
  veiculo?: VeiculoSnapshot;
  resumo_financeiro?: ResumoFinanceiro;
  despesas?: Despesa[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CriarViagemInput {
  veiculo_id: string;
  origem: string;
  destino: string;
  km_inicial: number;
  data_inicio: string;
}

export interface ConcluirViagemInput {
  status: 'concluída';
  km_final: number;
  data_fim?: string;
}
