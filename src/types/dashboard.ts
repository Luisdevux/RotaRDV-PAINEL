// src/types/dashboard.ts

import { DespesasPorCategoria } from './viagem';
import { Empresa } from './empresa';

export interface DashboardResumo {
  total_motoristas: number;
  total_veiculos: number;
  viagens_em_andamento: number;
  viagens_concluidas: number;
  total_km_rodado: number;
  total_despesas: number;
  despesas_por_categoria: DespesasPorCategoria;
}

export interface DashboardData {
  empresa: Partial<Empresa>;
  resumo: DashboardResumo;
}

export interface ChartCategoryData {
  name: string;
  valor: number;
  color: string;
}
