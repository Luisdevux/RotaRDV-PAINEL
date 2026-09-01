// src/app/(auth)/despesas/components/ExportarRelatorioModal.tsx

"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileDown, 
  Calendar, 
  Layers, 
  Loader2, 
  SlidersHorizontal,
  Info,
  CheckCircle2
} from "lucide-react";
import { despesaService } from "@/services/despesaService";
import { gerarRelatorioDespesasPDF } from "@/lib/pdfGenerator";
import { Empresa, Despesa } from "@/types";
import { toast } from "sonner";

interface ExportarRelatorioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa?: Empresa | null;
  initialDataInicio?: string;
  initialDataFim?: string;
  initialCategoria?: string;
}

export function ExportarRelatorioModal({
  open,
  onOpenChange,
  empresa,
  initialDataInicio = "",
  initialDataFim = "",
  initialCategoria = "todas",
}: ExportarRelatorioModalProps) {
  const [periodoPredefinido, setPeriodoPredefinido] = useState<string>("mesAtual");
  const [dataInicio, setDataInicio] = useState<string>(initialDataInicio);
  const [dataFim, setDataFim] = useState<string>(initialDataFim);
  const [categoria, setCategoria] = useState<string>(initialCategoria);
  const [limite, setLimite] = useState<number>(0);
  const [isGerando, setIsGerando] = useState(false);

  // Manipular atalhos rápidos de período
  const handlePeriodoChange = (value: string) => {
    setPeriodoPredefinido(value);
    const now = new Date();

    if (value === "mesAtual") {
      const primeiroDia = new Date(now.getFullYear(), now.getMonth(), 1);
      setDataInicio(primeiroDia.toISOString().split("T")[0]);
      setDataFim(now.toISOString().split("T")[0]);
    } else if (value === "mesAnterior") {
      const primeiroDia = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const ultimoDia = new Date(now.getFullYear(), now.getMonth(), 0);
      setDataInicio(primeiroDia.toISOString().split("T")[0]);
      setDataFim(ultimoDia.toISOString().split("T")[0]);
    } else if (value === "ultimos30") {
      const trintaDiasAtras = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setDataInicio(trintaDiasAtras.toISOString().split("T")[0]);
      setDataFim(now.toISOString().split("T")[0]);
    } else if (value === "ultimos90") {
      const noventaDiasAtras = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      setDataInicio(noventaDiasAtras.toISOString().split("T")[0]);
      setDataFim(now.toISOString().split("T")[0]);
    } else if (value === "todos") {
      setDataInicio("");
      setDataFim("");
    }
  };

  const handleGerarPDF = async () => {
    try {
      setIsGerando(true);

      // Busca dados consolidados de acordo com o limite escolhido
      const response = await despesaService.listar({
        todos: limite === 0,
        limite: limite > 0 ? limite : undefined,
        tipo: categoria !== "todas" ? categoria : undefined,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        empresa_id: empresa?._id || undefined,
      });

      const despesasEncontradas: Despesa[] =
        response?.docs || response?.items || (Array.isArray(response) ? response : []);

      if (despesasEncontradas.length === 0) {
        toast.info("Nenhuma despesa encontrada para os parâmetros e período selecionados.");
        return;
      }

      // Gera o documento formatado
      gerarRelatorioDespesasPDF({
        empresa,
        despesas: despesasEncontradas,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        categoriaFiltro: categoria,
      });

      toast.success(`Relatório com ${despesasEncontradas.length} despesas gerado com sucesso!`);
      onOpenChange(false);
    } catch (error: any) {
      const msg =
        error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        error?.response?.data?.mensagem ||
        error?.message ||
        "Não foi possível consultar as despesas e gerar o arquivo PDF.";
      toast.error(msg);
    } finally {
      setIsGerando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <FileDown className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Exportar relatório em PDF</DialogTitle>
              <DialogDescription className="text-xs pt-0.5">
                Configure os parâmetros e o período para emissão do relatório fiscal auditado.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Seleção do Período */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Intervalo temporal
            </label>
            <Select value={periodoPredefinido} onValueChange={handlePeriodoChange}>
              <SelectTrigger className="rounded-xl text-xs h-9">
                <SelectValue placeholder="Selecione o período..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mesAtual">Mês atual (em andamento)</SelectItem>
                <SelectItem value="mesAnterior">Mês anterior completo</SelectItem>
                <SelectItem value="ultimos30">Últimos 30 dias</SelectItem>
                <SelectItem value="ultimos90">Últimos 90 dias (trimestre)</SelectItem>
                <SelectItem value="personalizado">Personalizado (escolher datas)</SelectItem>
                <SelectItem value="todos">Histórico completo (geral)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inputs de Data Início / Fim (se personalizado ou para ajuste fino) */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Data inicial:</label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => {
                  setDataInicio(e.target.value);
                  setPeriodoPredefinido("personalizado");
                }}
                className="h-8 text-xs rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Data final:</label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => {
                  setDataFim(e.target.value);
                  setPeriodoPredefinido("personalizado");
                }}
                className="h-8 text-xs rounded-lg"
              />
            </div>
          </div>

          {/* Seleção de Categoria */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Categoria de despesa
            </label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="rounded-xl text-xs h-9">
                <SelectValue placeholder="Selecione a categoria..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias (consolidado geral)</SelectItem>
                <SelectItem value="ABASTECIMENTO">Apenas abastecimentos</SelectItem>
                <SelectItem value="ALIMENTACAO">Apenas alimentação</SelectItem>
                <SelectItem value="PEDAGIO">Apenas pedágios</SelectItem>
                <SelectItem value="MANUTENCAO">Apenas manutenção</SelectItem>
                <SelectItem value="OUTROS">Apenas outros / diversos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Limite de Amostragem / Segurança */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
              Volume máximo de registros
            </label>
            <Select value={String(limite)} onValueChange={(val) => setLimite(Number(val))}>
              <SelectTrigger className="rounded-xl text-xs h-9">
                <SelectValue placeholder="Limite de registros..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Todos os lançamentos do período (recomendado)</SelectItem>
                <SelectItem value="50">Até 50 lançamentos mais recentes</SelectItem>
                <SelectItem value="100">Até 100 lançamentos</SelectItem>
                <SelectItem value="200">Até 200 lançamentos</SelectItem>
                <SelectItem value="500">Até 500 lançamentos (auditoria extensa)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Aviso Informativo */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              O relatório será gerado no formato PDF corporativo com sumário financeiro por tipo de despesa e assinatura de auditoria.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            className="rounded-xl font-medium"
            onClick={() => onOpenChange(false)}
            disabled={isGerando}
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            className="rounded-xl font-bold gap-2 shadow-sm"
            onClick={handleGerarPDF}
            disabled={isGerando}
          >
            {isGerando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando PDF...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Gerar e baixar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
