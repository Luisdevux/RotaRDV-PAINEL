// src/lib/masks.ts

/**
 * Aplica máscara de CPF: 000.000.000-00 (máximo 11 dígitos -> 14 caracteres)
 */
export function maskCPF(value: string = ""): string {
  const clean = value.replace(/\D/g, "").slice(0, 11);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

/**
 * Aplica máscara de CNPJ: XX.XXX.XXX/XXXX-99 (suporta o novo padrão alfanumérico da Receita Federal e o clássico numérico)
 * Máximo 14 caracteres alfanuméricos -> 18 caracteres formatados
 */
export function maskCNPJ(value: string = ""): string {
  const clean = value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 14);
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
}

/**
 * Aplica máscara de Telefone: (00) 00000-0000 ou (00) 0000-0000 (máximo 11 dígitos -> 15 caracteres)
 */
export function maskTelefone(value: string = ""): string {
  const clean = value.replace(/\D/g, "").slice(0, 11);
  if (clean.length <= 2) return clean.length > 0 ? `(${clean}` : "";
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
}

/**
 * Aplica máscara de CEP: 00000-000 (máximo 8 dígitos -> 9 caracteres)
 */
export function maskCEP(value: string = ""): string {
  const clean = value.replace(/\D/g, "").slice(0, 8);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
}

/**
 * Aplica máscara de Placa: ABC-1234 ou padrão Mercosul ABC1D23 (máximo 7 caracteres -> 8 caracteres)
 */
export function maskPlaca(value: string = ""): string {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  if (clean.length <= 3) return clean;
  // Se o 5º caractere for letra (Mercosul ex: BRA2E19), não coloca traço
  if (clean.length >= 5 && isNaN(Number(clean[4]))) {
    return clean;
  }
  return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
}

/**
 * Aplica máscara de UF (Sigla de Estado): RO, SP, MT (máximo 2 letras maiúsculas)
 */
export function maskUF(value: string = ""): string {
  return value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
}

/**
 * Remove qualquer pontuação de máscara
 */
export function unmask(value: string = ""): string {
  return value.replace(/[.\-/\s()]/g, "").trim();
}

/**
 * Validador oficial de CPF (Módulo 11)
 */
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let soma = 0;
  let resto: number;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(clean.substring(i - 1, i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(clean.substring(9, 10), 10)) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(clean.substring(i - 1, i), 10) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(clean.substring(10, 11), 10);
}

/**
 * Validador oficial de CNPJ (Numérico tradicional e Alfanumérico conforme Instrução Normativa RFB nº 2.229/2024)
 */
export function isValidCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;
  const clean = cnpj.replace(/[.\-/]/g, "").trim().toUpperCase();
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(clean)) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;

  const getVal = (char: string) => char.charCodeAt(0) - 48;

  // 1º Dígito Verificador (DV1)
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma1 = 0;
  for (let i = 0; i < 12; i++) {
    soma1 += getVal(clean[i]) * pesos1[i];
  }
  const resto1 = soma1 % 11;
  const dv1 = resto1 < 2 ? 0 : 11 - resto1;
  if (parseInt(clean[12], 10) !== dv1) return false;

  // 2º Dígito Verificador (DV2)
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma2 = 0;
  for (let i = 0; i < 12; i++) {
    soma2 += getVal(clean[i]) * pesos2[i];
  }
  soma2 += dv1 * pesos2[12];
  const resto2 = soma2 % 11;
  const dv2 = resto2 < 2 ? 0 : 11 - resto2;

  return parseInt(clean[13], 10) === dv2;
}
