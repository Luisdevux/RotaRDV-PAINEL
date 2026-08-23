// src/lib/pdfGenerator.ts

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Despesa, Viagem, Empresa } from "@/types";
import { formatCurrency, formatDateTime, formatDate, formatKM, formatCNPJ, formatPlaca, formatLocal } from "./formatters";

interface RelatorioDespesasOptions {
  empresa?: Empresa | { nome_empresa?: string; cnpj?: string } | null;
  despesas: Despesa[];
  dataInicio?: string;
  dataFim?: string;
  categoriaFiltro?: string;
}

interface RelatorioViagemOptions {
  empresa?: Empresa | { nome_empresa?: string; cnpj?: string } | null;
  viagem: Viagem;
  despesas?: Despesa[];
}

const CATEGORY_NAMES: Record<string, string> = {
  ABASTECIMENTO: "Abastecimento",
  ALIMENTACAO: "Alimentação",
  MANUTENCAO: "Manutenção",
  PEDAGIO: "Pedágio",
  OUTROS: "Outros",
};

/**
 * Gera e dispara o download do Relatório Consolidado de Despesas (PDF)
 */
export function gerarRelatorioDespesasPDF({
  empresa,
  despesas,
  dataInicio,
  dataFim,
  categoriaFiltro,
}: RelatorioDespesasOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const nomeEmpresa = empresa?.nome_empresa || "RotaRDV Transportes";
  const cnpjFormatado = empresa?.cnpj ? formatCNPJ(empresa.cnpj) : "-";
  const dataEmissao = formatDateTime(new Date(), "dd/MM/yyyy 'às' HH:mm");

  // Cabeçalho Institucional (Barra Superior)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 24, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(nomeEmpresa.toUpperCase(), 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`CNPJ: ${cnpjFormatado}  •  Sistema de Gestão RotaRDV`, 14, 18);
  doc.text(`Emissão: ${dataEmissao}`, 196, 18, { align: "right" });

  // Título do Relatório
  let cursorY = 34;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("RELATÓRIO CONSOLIDADO DE DESPESAS E AUDITORIA", 14, cursorY);

  cursorY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  let periodoTexto = "Período: Histórico Geral Completo";
  if (dataInicio && dataFim) {
    periodoTexto = `Período: ${formatDate(dataInicio)} até ${formatDate(dataFim)}`;
  } else if (dataInicio) {
    periodoTexto = `Período: A partir de ${formatDate(dataInicio)}`;
  } else if (dataFim) {
    periodoTexto = `Período: Até ${formatDate(dataFim)}`;
  }

  const categoriaTexto = categoriaFiltro && categoriaFiltro !== "todos" 
    ? `Categoria: ${CATEGORY_NAMES[categoriaFiltro] || categoriaFiltro}` 
    : "Todas as Categorias";

  doc.text(`${periodoTexto}  •  ${categoriaTexto}  •  Total de lançamentos: ${despesas.length}`, 14, cursorY);

  // Montagem das Linhas da Tabela
  const tableRows = despesas.map((d, index) => {
    const tipo = CATEGORY_NAMES[d.tipo] || d.tipo;
    const local = d.local || d.oficina_nome || d.praca_nome || "-";
    const data = formatDate(d.data);
    const desc = d.descricao || (d.litros ? `${d.litros}L (${d.tipo_combustivel || "Combustível"})` : "-");
    const valor = formatCurrency(d.valor_total);

    return [
      String(index + 1).padStart(2, "0"),
      data,
      tipo,
      local,
      desc,
      valor,
    ];
  });

  // Tabela autoTable
  autoTable(doc, {
    startY: cursorY + 6,
    head: [["#", "Data", "Categoria", "Local / Posto / Praça", "Detalhes / Volume", "Valor Total"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 22 },
      2: { cellWidth: 28, fontStyle: "bold" },
      3: { cellWidth: 45 },
      4: { cellWidth: 50 },
      5: { cellWidth: 27, halign: "right", fontStyle: "bold", textColor: [15, 23, 42] },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    margin: { left: 14, right: 14 },
  });

  // Cálculo dos Totais por Categoria
  const totalGeral = despesas.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
  const totaisPorCat: Record<string, number> = {
    ABASTECIMENTO: 0,
    ALIMENTACAO: 0,
    PEDAGIO: 0,
    MANUTENCAO: 0,
    OUTROS: 0,
  };

  despesas.forEach((d) => {
    if (d.tipo in totaisPorCat) {
      totaisPorCat[d.tipo] += d.valor_total || 0;
    } else {
      totaisPorCat.OUTROS += d.valor_total || 0;
    }
  });

  // Posição do Box de Sumário Financeiro
  let finalY = (doc as any).lastAutoTable.finalY + 8;

  // Se estiver muito próximo do rodapé, adiciona nova página
  if (finalY > 230) {
    doc.addPage();
    finalY = 20;
  }

  // Box Resumo Financeiro
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(14, finalY, 182, 38, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("SUMÁRIO FINANCEIRO CONSOLIDADO", 18, finalY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const col1X = 18;
  const col2X = 75;
  const col3X = 135;

  doc.text(`Abastecimento: ${formatCurrency(totaisPorCat.ABASTECIMENTO)}`, col1X, finalY + 15);
  doc.text(`Alimentação: ${formatCurrency(totaisPorCat.ALIMENTACAO)}`, col1X, finalY + 22);

  doc.text(`Pedágios: ${formatCurrency(totaisPorCat.PEDAGIO)}`, col2X, finalY + 15);
  doc.text(`Manutenção: ${formatCurrency(totaisPorCat.MANUTENCAO)}`, col2X, finalY + 22);

  doc.text(`Outros / Diversos: ${formatCurrency(totaisPorCat.OUTROS)}`, col3X, finalY + 15);

  // Total Geral em Destaque
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`TOTAL GERAL: ${formatCurrency(totalGeral)}`, col3X, finalY + 28);

  // Seção de Assinaturas e Auditoria
  const assinaturasY = finalY + 52;
  if (assinaturasY < 275) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.line(20, assinaturasY, 90, assinaturasY);
    doc.text("Assinatura do Gestor Financeiro", 32, assinaturasY + 4);

    doc.line(120, assinaturasY, 190, assinaturasY);
    doc.text("Auditoria / Controle Operacional", 132, assinaturasY + 4);
  }

  // Rodapé com numeração de páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${totalPages}  •  Documento gerado eletronicamente por RotaRDV em ${dataEmissao}`,
      105,
      290,
      { align: "center" }
    );
  }

  // Download do PDF
  const dataSlug = formatDate(new Date()).replace(/\//g, "-");
  const fileName = `Relatorio_Despesas_${nomeEmpresa.replace(/[^a-zA-Z0-9]/g, "_")}_${dataSlug}.pdf`;
  doc.save(fileName);
}

/**
 * Gera e dispara o download do Relatório de Prestação de Contas de uma Viagem (RDV)
 */
export function gerarRelatorioViagemPDF({
  empresa,
  viagem,
  despesas = [],
}: RelatorioViagemOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const nomeEmpresa = empresa?.nome_empresa || "RotaRDV Transportes";
  const cnpjFormatado = empresa?.cnpj ? formatCNPJ(empresa.cnpj) : "-";
  const dataEmissao = formatDateTime(new Date(), "dd/MM/yyyy 'às' HH:mm");

  const motoristaNome = typeof viagem.usuario_id === "object" && viagem.usuario_id?.nome 
    ? viagem.usuario_id.nome 
    : viagem.usuario_snapshot?.nome || "-";

  const motoristaEmail = typeof viagem.usuario_id === "object" && viagem.usuario_id?.email
    ? viagem.usuario_id.email
    : viagem.usuario_snapshot?.email || "-";

  const veiculoInfo = (typeof viagem.veiculo_id === "object" && viagem.veiculo_id !== null ? viagem.veiculo_id : null) ||
    viagem.veiculo_snapshot ||
    (viagem as any).veiculo;

  const placaVeiculo = veiculoInfo?.placa ? formatPlaca(veiculoInfo.placa) : "-";
  const modeloVeiculo = veiculoInfo?.modelo || "-";
  const reboqueInfo = (veiculoInfo as any)?.reboque || (viagem as any).reboque || (viagem as any).reboque_snapshot;
  const reboquePlaca = reboqueInfo?.placa || (Array.isArray(reboqueInfo?.placas) && reboqueInfo.placas.length > 0 ? reboqueInfo.placas.join(", ") : "");
  const reboqueModelo = reboqueInfo?.modelo || "";
  const implementoTexto = reboquePlaca || reboqueModelo 
    ? `${reboqueModelo ? reboqueModelo + " • " : ""}Placa: ${reboquePlaca ? formatPlaca(reboquePlaca) : "-"}`
    : "Não informado / Sem implemento";

  // Cabeçalho Institucional
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 24, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(nomeEmpresa.toUpperCase(), 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`CNPJ: ${cnpjFormatado}  •  Relatório de Despesas de Viagem (RDV)`, 14, 18);
  doc.text(`Emissão: ${dataEmissao}`, 196, 18, { align: "right" });

  // Título e Rota
  let cursorY = 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("RELATÓRIO DE PRESTAÇÃO DE CONTAS DE VIAGEM (RDV)", 14, cursorY);

  cursorY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const rotaTexto = `Origem: ${formatLocal(viagem.origem).toUpperCase()}   |   Destino: ${formatLocal(viagem.destino).toUpperCase()}`;
  const linhasRota = doc.splitTextToSize(rotaTexto, 182);
  doc.text(linhasRota, 14, cursorY);
  cursorY += (linhasRota.length * 4) + 2;

  // Cards de Metadados da Viagem (Quadro Informativo)
  const cardHeight = 46;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, cursorY, 182, cardHeight, 3, 3, "FD");

  const kmPercorrido = viagem.km_final && viagem.km_inicial && viagem.km_final > viagem.km_inicial 
    ? viagem.km_final - viagem.km_inicial 
    : 0;

  // Coluna 1: Condutor, Cavalo e Implemento (X: 18, largura max: 82mm)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("Motorista Responsável:", 18, cursorY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(doc.splitTextToSize(motoristaNome, 82), 18, cursorY + 10);
  doc.text(doc.splitTextToSize(motoristaEmail, 82), 18, cursorY + 13.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("Cavalo Mecânico:", 18, cursorY + 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(doc.splitTextToSize(`${modeloVeiculo} • Placa: ${placaVeiculo}`, 82), 18, cursorY + 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("Implemento / Carreta:", 18, cursorY + 31);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(doc.splitTextToSize(implementoTexto, 82), 18, cursorY + 35);

  // Coluna 2: Período, Odômetro e Status (X: 108, largura max: 84mm)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("Período da Viagem:", 108, cursorY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(doc.splitTextToSize(`Partida: ${formatDateTime(viagem.data_inicio)}`, 84), 108, cursorY + 10);
  doc.text(doc.splitTextToSize(`Chegada: ${viagem.data_fim ? formatDateTime(viagem.data_fim) : "Em andamento"}`, 84), 108, cursorY + 13.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("Auditoria de Odômetro:", 108, cursorY + 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Inicial: ${formatKM(viagem.km_inicial)} • Final: ${formatKM(viagem.km_final)}`, 108, cursorY + 24);
  doc.text(`Distância Total: ${formatKM(kmPercorrido)}`, 108, cursorY + 27.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("Status da Operação:", 108, cursorY + 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  const statusLabel = viagem.status === "em_andamento" ? "Em Andamento" : viagem.status === "cancelada" ? "Cancelada" : "Concluída";
  doc.text(statusLabel, 108, cursorY + 38);

  // Alerta de Viagem Cancelada com Motivo
  if (viagem.status === "cancelada") {
    const motivo = (viagem as any).motivo_cancelamento || viagem.descricao || "Cancelamento operacional registrado no sistema";
    cursorY += cardHeight + 4;

    const linhasMotivo = doc.splitTextToSize(motivo, 174);
    const motivoBoxHeight = Math.max(14, 8 + (linhasMotivo.length * 4));

    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(254, 202, 202); // red-200
    doc.roundedRect(14, cursorY, 182, motivoBoxHeight, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(185, 28, 28); // red-700
    doc.text("MOTIVO DO CANCELAMENTO DA VIAGEM:", 18, cursorY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(153, 27, 27); // red-800
    doc.text(linhasMotivo, 18, cursorY + 9.5);

    cursorY += motivoBoxHeight + 8; // Espaçamento confortável de 8mm antes do título de despesas
  } else {
    cursorY += cardHeight + 8;
  }

  // Despesas da Viagem
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("COMPROVANTES E DESPESAS LANÇADAS", 14, cursorY);

  const tableRows = despesas.map((d, index) => {
    const tipo = CATEGORY_NAMES[d.tipo] || d.tipo;
    const local = d.local || d.oficina_nome || d.praca_nome || "-";
    const data = formatDateTime(d.data);
    const desc = d.descricao || (d.litros ? `${d.litros}L (${d.tipo_combustivel || "Combustível"})` : "-");
    const valor = formatCurrency(d.valor_total);

    return [
      String(index + 1).padStart(2, "0"),
      data,
      tipo,
      local,
      desc,
      valor,
    ];
  });

  autoTable(doc, {
    startY: cursorY + 4,
    head: [["#", "Data / Hora", "Categoria", "Local / Posto", "Especificação", "Valor Total"]],
    body: tableRows.length > 0 ? tableRows : [["-", "-", "Nenhuma despesa lançada nesta viagem", "-", "-", "R$ 0,00"]],
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 28 },
      2: { cellWidth: 26, fontStyle: "bold" },
      3: { cellWidth: 42 },
      4: { cellWidth: 46 },
      5: { cellWidth: 30, halign: "right", fontStyle: "bold", textColor: [15, 23, 42] },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  // Total Geral e Assinaturas
  const totalGeral = despesas.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
  let finalY = (doc as any).lastAutoTable.finalY + 8;

  if (finalY > 230) {
    doc.addPage();
    finalY = 20;
  }

  // Box Total
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, finalY, 182, 16, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("TOTAL GERAL DE DESPESAS DA VIAGEM:", 18, finalY + 10.5);
  doc.text(formatCurrency(totalGeral), 190, finalY + 10.5, { align: "right" });

  // Assinaturas
  const assinaturasY = finalY + 32;
  if (assinaturasY < 275) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.line(20, assinaturasY, 90, assinaturasY);
    doc.text(`Assinatura do Motorista (${motoristaNome})`, 25, assinaturasY + 4);

    doc.line(120, assinaturasY, 190, assinaturasY);
    doc.text("Aprovação do Gestor de Frota", 132, assinaturasY + 4);
  }

  // Rodapé
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${totalPages}  •  RDV gerado por RotaRDV em ${dataEmissao}`,
      105,
      290,
      { align: "center" }
    );
  }

  const slug = `${formatLocal(viagem.origem)}_${formatLocal(viagem.destino)}_${placaVeiculo}`.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`RDV_Viagem_${slug}.pdf`);
}
