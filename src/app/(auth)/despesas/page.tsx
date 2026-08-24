// src/app/(auth)/despesas/page.tsx

"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDespesas, useViagens, useDebounce } from "@/hooks";
import { useActiveEmpresa } from "@/providers/ActiveEmpresaProvider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ComprovanteModal } from "@/components/ComprovanteModal";
import { ExportarRelatorioModal } from "./components/ExportarRelatorioModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { formatCurrency, formatDateTime, formatPlaca } from "@/lib/formatters";
import { toast } from "sonner";
import { 
  ReceiptText, 
  Search, 
  Image as ImageIcon, 
  Fuel, 
  Utensils, 
  Wrench, 
  CreditCard, 
  Calendar, 
  Eye, 
  FileX2,
  Trash2,
  Filter,
  X,
  RotateCcw,
  Sparkles,
  Route,
  FileDown,
  User,
  Truck
} from "lucide-react";
import { Despesa, TipoDespesa, Viagem } from "@/types";

const CATEGORY_ICONS: Record<string, any> = {
  ABASTECIMENTO: Fuel,
  ALIMENTACAO: Utensils,
  MANUTENCAO: Wrench,
  PEDAGIO: CreditCard,
  OUTROS: ReceiptText,
};

function DespesasContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viagemIdFromUrl = searchParams.get("viagem_id") || undefined;

  const { empresa, empresaId: activeEmpresaId } = useActiveEmpresa();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [tipoFilter, setTipoFilter] = useState<string>("todas");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [comprovanteDespesa, setComprovanteDespesa] = useState<Despesa | null>(null);
  const [comprovanteOpen, setComprovanteOpen] = useState(false);
  const [exportarModalOpen, setExportarModalOpen] = useState(false);
  const [deletingDespesa, setDeletingDespesa] = useState<Despesa | null>(null);
  const [page, setPage] = useState(1);
  const [limite, setLimite] = useState(10);

  // Carrega viagens para cruzar metadados de motorista e caminhão sincronizado com a empresa ativa
  const { data: viagensData } = useViagens({ 
    limite: 100,
    empresa_id: activeEmpresaId || undefined 
  });
  const viagensList: Viagem[] = viagensData?.docs || viagensData?.items || (Array.isArray(viagensData) ? viagensData : []);

  // Mapeamento rápido Viagem ID -> Objeto Viagem
  const viagemMap = useMemo(() => {
    const map = new Map<string, Viagem>();
    viagensList.forEach((v) => {
      if (v._id) map.set(String(v._id), v);
    });
    return map;
  }, [viagensList]);

  // Carrega as despesas do período auditado no backend sincronizado com a empresa ativa
  const { data: despesasData, isLoading, deletarDespesa, isDeletando } = useDespesas({
    limite: 100,
    viagem_id: viagemIdFromUrl,
    tipo: tipoFilter !== "todas" ? tipoFilter : undefined,
    data_inicio: dataInicio || undefined,
    data_fim: dataFim || undefined,
    empresa_id: activeEmpresaId || undefined,
  });

  const despesasList: Despesa[] = despesasData?.docs || despesasData?.items || (Array.isArray(despesasData) ? despesasData : []);

  // Busca textual inteligente (posto, cidade, descrição, nome do motorista, placa)
  const filteredDespesas = useMemo(() => {
    if (!debouncedSearch.trim()) return despesasList;
    const term = debouncedSearch.toLowerCase().trim();
    return despesasList.filter((d) => {
      const viagemIdStr = typeof d.viagem_id === "object" 
        ? (d.viagem_id as any)?._id 
        : d.viagem_id;

      const v = (typeof d.viagem_id === "object" && d.viagem_id !== null)
        ? (d.viagem_id as any)
        : (viagemIdStr ? viagemMap.get(String(viagemIdStr)) : null);

      const motoristaNome = 
        (typeof v?.usuario_id === "object" ? v.usuario_id?.nome : null) ||
        v?.usuario_snapshot?.nome ||
        "";

      const veic = 
        (typeof v?.veiculo_id === "object" && v.veiculo_id !== null ? v.veiculo_id : null) ||
        v?.veiculo_snapshot ||
        (v as any)?.veiculo;

      const placa = veic?.placa || "";

      return (
        d.local?.toLowerCase().includes(term) ||
        d.descricao?.toLowerCase().includes(term) ||
        d.tipo?.toLowerCase().includes(term) ||
        d.oficina_nome?.toLowerCase().includes(term) ||
        d.praca_nome?.toLowerCase().includes(term) ||
        motoristaNome.toLowerCase().includes(term) ||
        placa.toLowerCase().includes(term)
      );
    });
  }, [despesasList, debouncedSearch, viagemMap]);

  const totalDocs = filteredDespesas.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limite));
  const displayedDespesas = filteredDespesas.slice((page - 1) * limite, page * limite);

  const openComprovante = (despesa: Despesa) => {
    setComprovanteDespesa(despesa);
    setComprovanteOpen(true);
  };

  // Atalhos de Período para Auditoria Rápida
  const aplicarPeriodo = (tipoPeriodo: "hoje" | "7dias" | "30dias" | "mesAtual") => {
    const hoje = new Date();
    const formatYMD = (d: Date) => d.toISOString().split("T")[0];

    setDataFim(formatYMD(hoje));

    if (tipoPeriodo === "hoje") {
      setDataInicio(formatYMD(hoje));
    } else if (tipoPeriodo === "7dias") {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(hoje.getDate() - 7);
      setDataInicio(formatYMD(seteDiasAtras));
    } else if (tipoPeriodo === "30dias") {
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(hoje.getDate() - 30);
      setDataInicio(formatYMD(trintaDiasAtras));
    } else if (tipoPeriodo === "mesAtual") {
      const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      setDataInicio(formatYMD(primeiroDiaDoMes));
    }
    setPage(1);
  };

  const limparTodosFiltros = () => {
    setDataInicio("");
    setDataFim("");
    setTipoFilter("todas");
    setSearchTerm("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(dataInicio || dataFim || tipoFilter !== "todas" || searchTerm || viagemIdFromUrl);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner de Viagem Selecionada (se houver viagem_id na URL) */}
      {viagemIdFromUrl && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Route className="h-4 w-4 shrink-0" />
            <span>Exibindo despesas vinculadas exclusivamente à Viagem selecionada:</span>
            <code className="font-mono bg-background/80 px-2 py-0.5 rounded-md text-[11px] border border-primary/20">
              {viagemIdFromUrl.slice(0, 8)}...
            </code>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs font-semibold rounded-xl gap-1 border-primary/30 text-primary hover:bg-primary/20"
            onClick={() => router.push("/despesas")}
          >
            <X className="h-3 w-3" />
            Remover Filtro da Viagem
          </Button>
        </div>
      )}

      {/* Barra de Filtros e Auditoria */}
      <Card className="p-4 rounded-2xl border-border/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Busca Textual */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por posto, local ou descrição..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 rounded-xl"
            />
          </div>

          {/* Filtro por Categoria */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border">
            <Button
              variant={tipoFilter === "todas" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg text-xs font-semibold h-8"
              onClick={() => {
                setTipoFilter("todas");
                setPage(1);
              }}
            >
              Todas
            </Button>
            <Button
              variant={tipoFilter === "ABASTECIMENTO" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg text-xs font-semibold h-8"
              onClick={() => {
                setTipoFilter("ABASTECIMENTO");
                setPage(1);
              }}
            >
              Abastecimentos
            </Button>
            <Button
              variant={tipoFilter === "ALIMENTACAO" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg text-xs font-semibold h-8"
              onClick={() => {
                setTipoFilter("ALIMENTACAO");
                setPage(1);
              }}
            >
              Alimentação
            </Button>
            <Button
              variant={tipoFilter === "PEDAGIO" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg text-xs font-semibold h-8"
              onClick={() => {
                setTipoFilter("PEDAGIO");
                setPage(1);
              }}
            >
              Pedágio
            </Button>
            <Button
              variant={tipoFilter === "MANUTENCAO" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg text-xs font-semibold h-8"
              onClick={() => {
                setTipoFilter("MANUTENCAO");
                setPage(1);
              }}
            >
              Manutenção
            </Button>
            <Button
              variant={tipoFilter === "OUTROS" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg text-xs font-semibold h-8"
              onClick={() => {
                setTipoFilter("OUTROS");
                setPage(1);
              }}
            >
              Outros
            </Button>
          </div>
        </div>

        {/* Linha de Auditoria Temporal (Date Range Picker) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5 mr-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Período:
            </span>

            {/* Input Data Início */}
            <div className="flex items-center gap-1 bg-background border border-border/80 rounded-xl px-2.5 py-1">
              <span className="text-[11px] text-muted-foreground">De:</span>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => {
                  setDataInicio(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
              />
            </div>

            {/* Input Data Fim */}
            <div className="flex items-center gap-1 bg-background border border-border/80 rounded-xl px-2.5 py-1">
              <span className="text-[11px] text-muted-foreground">Até:</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => {
                  setDataFim(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
              />
            </div>

            {/* Atalhos Rápidos */}
            <div className="hidden sm:flex items-center gap-1 ml-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2.5 rounded-lg font-medium text-muted-foreground hover:text-foreground"
                onClick={() => aplicarPeriodo("7dias")}
              >
                7 Dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2.5 rounded-lg font-medium text-muted-foreground hover:text-foreground"
                onClick={() => aplicarPeriodo("30dias")}
              >
                30 Dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2.5 rounded-lg font-medium text-muted-foreground hover:text-foreground"
                onClick={() => aplicarPeriodo("mesAtual")}
              >
                Este Mês
              </Button>
            </div>
          </div>

          {/* Ações: Limpar Filtros & Exportar PDF */}
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-xl"
                onClick={limparTodosFiltros}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpar Filtros
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-border/80 shadow-xs hover:bg-muted"
              onClick={() => setExportarModalOpen(true)}
              title="Configurar e exportar relatório consolidado em PDF"
            >
              <FileDown className="h-3.5 w-3.5 text-primary" />
              Exportar Relatório PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Despesas Table */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>Local / Estabelecimento</TableHead>
              <TableHead>Motorista & Veículo</TableHead>
              <TableHead>Data & Hora</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Comprovante Fiscal</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                  Carregando despesas...
                </TableCell>
              </TableRow>
            ) : displayedDespesas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                  Nenhuma despesa encontrada com os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              displayedDespesas.map((despesa) => {
                const Icon = CATEGORY_ICONS[despesa.tipo] || ReceiptText;
                const viagemIdStr = typeof despesa.viagem_id === "object" 
                  ? (despesa.viagem_id as any)?._id 
                  : despesa.viagem_id;

                const v = (typeof despesa.viagem_id === "object" && despesa.viagem_id !== null)
                  ? (despesa.viagem_id as any)
                  : (viagemIdStr ? viagemMap.get(String(viagemIdStr)) : null);

                const motoristaNome = 
                  (typeof v?.usuario_id === "object" ? v.usuario_id?.nome : null) ||
                  v?.usuario_snapshot?.nome ||
                  "";

                const veic = 
                  (typeof v?.veiculo_id === "object" && v.veiculo_id !== null ? v.veiculo_id : null) ||
                  v?.veiculo_snapshot ||
                  (v as any)?.veiculo;

                const placa = veic?.placa ? formatPlaca(veic.placa) : "";

                return (
                  <TableRow key={despesa._id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-muted border border-border flex items-center justify-center text-primary shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-xs text-foreground uppercase tracking-wide">
                          {despesa.tipo}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-semibold text-foreground">
                          {despesa.local || despesa.oficina_nome || despesa.praca_nome || "Posto / Estabelecimento"}
                        </p>
                        {despesa.litros && (
                          <p className="text-muted-foreground text-[11px]">
                            {despesa.litros}L {despesa.tipo_combustivel ? `• ${despesa.tipo_combustivel}` : ""}
                          </p>
                        )}
                        {despesa.descricao && (
                          <p className="text-muted-foreground truncate max-w-xs">{despesa.descricao}</p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{motoristaNome || "Motorista não informado"}</span>
                        </div>
                        {placa ? (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                            <Truck className="h-3 w-3 text-muted-foreground/80 shrink-0" />
                            <span>{placa} {veic?.modelo ? `• ${veic.modelo}` : ""}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">-</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateTime(despesa.data)}
                      </div>
                    </TableCell>

                    <TableCell className="font-black text-sm text-foreground">
                      {formatCurrency(despesa.valor_total)}
                    </TableCell>

                    <TableCell>
                      {despesa.foto_anexo ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-xl gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => openComprovante(despesa)}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          Ver Nota Fiscal
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 italic">
                          <FileX2 className="h-3.5 w-3.5 opacity-50" />
                          Sem anexo
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                        onClick={() => setDeletingDespesa(despesa)}
                        title="Excluir despesa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Controles de Paginação Server-Side */}
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalDocs}
          itemsPerPage={limite}
          onPageChange={(newPage) => setPage(newPage)}
          onItemsPerPageChange={(newLimit) => {
            setLimite(newLimit);
            setPage(1);
          }}
          isLoading={isLoading}
        />
      </Card>

      {/* Modal de Exibição e Zoom de Comprovantes */}
      <ComprovanteModal
        despesa={comprovanteDespesa}
        open={comprovanteOpen}
        onOpenChange={setComprovanteOpen}
      />

      {/* Modal Interativo de Exportação de Relatório PDF */}
      <ExportarRelatorioModal
        open={exportarModalOpen}
        onOpenChange={setExportarModalOpen}
        empresa={empresa}
        initialDataInicio={dataInicio}
        initialDataFim={dataFim}
        initialCategoria={tipoFilter}
      />

      {/* Modal de Confirmação de Exclusão de Despesa */}
      <ConfirmDialog
        open={Boolean(deletingDespesa)}
        onOpenChange={(open) => !open && setDeletingDespesa(null)}
        title="Excluir Lançamento de Despesa"
        description={`Tem certeza que deseja excluir esta despesa de ${deletingDespesa ? formatCurrency(deletingDespesa.valor_total) : ""} (${deletingDespesa?.tipo})? O valor será deduzido do total da viagem.`}
        confirmText="Sim, Excluir Despesa"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isDeletando}
        onConfirm={async () => {
          if (!deletingDespesa) return;
          await deletarDespesa(deletingDespesa._id);
          setDeletingDespesa(null);
        }}
      />
    </div>
  );
}

export default function DespesasPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground text-xs">Carregando despesas...</div>}>
      <DespesasContent />
    </Suspense>
  );
}

