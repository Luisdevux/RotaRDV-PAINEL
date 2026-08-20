// src/lib/formatters.ts

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Formata valores numéricos para moeda brasileira (R$ 1.250,00)
 */
export function formatCurrency(value?: number | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "R$ 0,00";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata datas ISO para padrão legível em pt-BR (ex: 20/08/2026 às 14:30)
 */
export function formatDateTime(dateStr?: string | Date | null, formatPattern: string = "dd/MM/yyyy 'às' HH:mm"): string {
  if (!dateStr) return "-";
  try {
    const parsed = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return format(parsed, formatPattern, { locale: ptBR });
  } catch {
    return String(dateStr);
  }
}

/**
 * Formata data simples (ex: 20/08/2026)
 */
export function formatDate(dateStr?: string | Date | null): string {
  return formatDateTime(dateStr, "dd/MM/yyyy");
}

/**
 * Formata quilometragem (ex: 125.400 km)
 */
export function formatKM(km?: number | null): string {
  if (km === undefined || km === null || isNaN(km)) return "0 km";
  return `${new Intl.NumberFormat("pt-BR").format(km)} km`;
}

/**
 * Formata consumo em KM/L (ex: 3.45 km/L)
 */
export function formatConsumo(kmPorLitro?: number | null): string {
  if (kmPorLitro === undefined || kmPorLitro === null || isNaN(kmPorLitro) || kmPorLitro <= 0) {
    return "-";
  }
  return `${kmPorLitro.toFixed(2).replace(".", ",")} km/L`;
}

/**
 * Formata CNPJ (00.000.000/0000-00)
 */
export function formatCNPJ(cnpj?: string | null): string {
  if (!cnpj) return "-";
  const clean = cnpj.replace(/\D/g, "");
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

/**
 * Formata CPF (000.000.000-00)
 */
export function formatCPF(cpf?: string | null): string {
  if (!cpf) return "-";
  const clean = cpf.replace(/\D/g, "");
  return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

/**
 * Formata Placa de Veículo (ABC-1234 ou ABC1D23)
 */
export function formatPlaca(placa?: string | null): string {
  if (!placa) return "-";
  const clean = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length === 7) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return clean;
}

/**
 * Formata Origem ou Destino de Viagem (suporta String ou Objeto { cidade, estado })
 */
export function formatLocal(local?: any): string {
  if (!local) return "-";
  if (typeof local === "string") return local;
  if (typeof local === "object") {
    const { cidade, estado } = local;
    if (cidade && estado) return `${cidade} - ${estado}`;
    if (cidade) return cidade;
    if (estado) return estado;
  }
  return String(local);
}
