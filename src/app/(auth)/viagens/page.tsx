// src/app/(auth)/viagens/page.tsx

"use client";

import React, { useState, useMemo } from "react";
import { useViagens, useDebounce } from "@/hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  formatCurrency, 
  formatKM, 
  formatDateTime, 
  formatPlaca, 
  formatConsumo,
  formatLocal 
} from "@/lib/formatters";
import { 
  Route, 
  Search, 
  Eye, 
  Calendar, 
  Truck, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ReceiptText, 
  RotateCcw, 
  X, 
  XCircle,
  Ban,
  FileDown,
  Loader2
} from "lucide-react";
import { Viagem, Despesa } from "@/types";
import { useActiveEmpresa } from "@/providers/ActiveEmpresaProvider";
import { gerarRelatorioViagemPDF } from "@/lib/pdfGenerator";
import { despesaService } from "@/services/despesaService";
import { toast } from "sonner";
import Link from "next/link";

export default function ViagensPage() {
  const { empresa } = useActiveEmpresa();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [selectedViagem, setSelectedViagem] = useState<Viagem | null>(null);
  const [cancelingViagem, setCancelingViagem] = useState<Viagem | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [page, setPage] = useState(1);
  const [limite, setLimite] = useState(10);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportarViagemPDF = async () => {
    if (!selectedViagem) return;
    try {
      setIsExportingPdf(true);
      const resDespesas = await despesaService.listar({
        viagem_id: selectedViagem._id,
        todos: true,
      });
      const despesasViagem: Despesa[] = resDespesas?.docs || resDespesas?.items || (Array.isArray(resDespesas) ? resDespesas : []);
      
      gerarRelatorioViagemPDF({
        empresa,
        viagem: selectedViagem,
        despesas: despesasViagem,
      });
      toast.success("Relatório de Prestação de Contas (RDV) gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar RDV da viagem em PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Carrega as viagens da empresa no período auditado paginadas no servidor
  const { data: viagensData, isLoading, cancelarViagem, isCancelando } = useViagens({
    page,
    limite,
    status: statusFilter !== "todas" ? statusFilter : undefined,
    data_inicio: dataInicio || undefined,
    data_fim: dataFim || undefined,
    empresa_id: empresa?._id || undefined,
  });

  const viagensList: Viagem[] = viagensData?.docs || viagensData?.items || (Array.isArray(viagensData) ? viagensData : []);

  // Busca textual instantânea sobre a página atual
  const filteredViagens = useMemo(() => {
    if (!debouncedSearch.trim()) return viagensList;
    const term = debouncedSearch.toLowerCase().trim();
    return viagensList.filter((v) => {
      const motoristaNome = typeof v.usuario_id === "object" ? v.usuario_id.nome : (v.usuario_snapshot?.nome || "");
      const veiculoPlaca = (typeof v.veiculo_id === "object" && v.veiculo_id?.placa) || v.veiculo_snapshot?.placa || v.veiculo?.placa || "";
      const veiculoModelo = (typeof v.veiculo_id === "object" && v.veiculo_id?.modelo) || v.veiculo_snapshot?.modelo || v.veiculo?.modelo || "";
      const origemStr = formatLocal(v.origem).toLowerCase();
      const destinoStr = formatLocal(v.destino).toLowerCase();
      
      return (
        origemStr.includes(term) ||
        destinoStr.includes(term) ||
        motoristaNome.toLowerCase().includes(term) ||
        veiculoPlaca.toLowerCase().includes(term) ||
        veiculoModelo.toLowerCase().includes(term)
      );
    });
  }, [viagensList, debouncedSearch]);

  const totalDocs = viagensData?.totalDocs ?? filteredViagens.length;
  const totalPages = viagensData?.totalPages ?? Math.max(1, Math.ceil(totalDocs / limite));
  const displayedViagens = filteredViagens;

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
    setStatusFilter("todas");
    setSearchTerm("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(dataInicio || dataFim || statusFilter !== "todas" || searchTerm);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Barra de Filtros e Auditoria */}
      <Card className="p-4 rounded-2xl border-border/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por origem, destino, motorista ou placa..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 rounded-xl"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border">
            <Button
              variant={statusFilter === "todas" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg text-xs font-semibold h-8"
              onClick={() => {
                setStatusFilter("todas");
                setPage(1);
              }}
            >
              Todas
            </Button>
            <Button
              variant={statusFilter === "em_andamento" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg text-xs font-semibold h-8"
              onClick={() => {
                setStatusFilter("em_andamento");
                setPage(1);
              }}
            >
              Em andamento
            </Button>
            <Button
              variant={statusFilter === "concluída" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg text-xs font-semibold h-8"
              onClick={() => {
                setStatusFilter("concluída");
                setPage(1);
              }}
            >
              Concluídas
            </Button>
            <Button
              variant={statusFilter === "cancelada" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg text-xs font-semibold h-8"
              onClick={() => {
                setStatusFilter("cancelada");
                setPage(1);
              }}
            >
              Canceladas
            </Button>
          </div>
        </div>

        {/* Linha de Auditoria Temporal (Date Range Picker) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5 mr-1">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Período de partida:
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
                7 dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2.5 rounded-lg font-medium text-muted-foreground hover:text-foreground"
                onClick={() => aplicarPeriodo("30dias")}
              >
                30 dias
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] px-2.5 rounded-lg font-medium text-muted-foreground hover:text-foreground"
                onClick={() => aplicarPeriodo("mesAtual")}
              >
                Este mês
              </Button>
            </div>
          </div>

          {/* Botão Limpar Filtros */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
              onClick={limparTodosFiltros}
            >
              <RotateCcw className="h-3 w-3" />
              Limpar filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Viagens Table */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Origem e destino</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Total de despesas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  Carregando viagens...
                </TableCell>
              </TableRow>
            ) : displayedViagens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  Nenhuma viagem encontrada com os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              displayedViagens.map((viagem) => {
                const motoristaNome = typeof viagem.usuario_id === "object" 
                  ? viagem.usuario_id.nome 
                  : (viagem.usuario_snapshot?.nome || "Motorista");
                const motoristaFoto = typeof viagem.usuario_id === "object" 
                  ? (viagem.usuario_id.foto_perfil || (viagem.usuario_id as any).foto) 
                  : (viagem.usuario_snapshot?.foto_perfil || (viagem.usuario_snapshot as any)?.foto || "");
                const veiculoInfo = (typeof viagem.veiculo_id === "object" && viagem.veiculo_id !== null ? (viagem.veiculo_id as any) : null) ||
                  viagem.veiculo_snapshot ||
                  viagem.veiculo;
                const totalDespesas = viagem.resumo_financeiro?.total_geral || 0;

                return (
                  <TableRow key={viagem._id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                          <span>{formatLocal(viagem.origem)}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{formatLocal(viagem.destino)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(viagem.data_inicio)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 border border-border/80 shadow-sm shrink-0">
                          <AvatarImage 
                            src={motoristaFoto} 
                            alt={motoristaNome} 
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary/15 text-primary border border-primary/30 font-bold text-[11px]">
                            {motoristaNome ? motoristaNome.slice(0, 2).toUpperCase() : "MO"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold text-foreground truncate max-w-[140px]">{motoristaNome}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {veiculoInfo?.placa ? (
                        <div className="space-y-0.5 text-xs">
                          <span className="font-mono font-bold text-foreground">
                            {formatPlaca(veiculoInfo.placa)}
                          </span>
                          <p className="text-muted-foreground">{veiculoInfo.modelo}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">-</span>
                      )}
                    </TableCell>

                    <TableCell className="font-bold text-sm text-foreground">
                      {formatCurrency(totalDespesas)}
                    </TableCell>

                    <TableCell>
                      {viagem.status === "em_andamento" ? (
                        <Badge variant="warning" className="gap-1 font-semibold">
                          <Clock className="h-3 w-3" />
                          Em andamento
                        </Badge>
                      ) : viagem.status === "cancelada" ? (
                        <Badge variant="destructive" className="gap-1 font-semibold">
                          <XCircle className="h-3 w-3" />
                          Cancelada
                        </Badge>
                      ) : (
                        <Badge variant="success" className="gap-1 font-semibold">
                          <CheckCircle2 className="h-3 w-3" />
                          Concluída
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl gap-1 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10"
                        onClick={() => setSelectedViagem(viagem)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Controles de Paginação */}
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

      {/* Modal de Detalhes da Viagem & Resumo Financeiro */}
      {selectedViagem && (
        <Dialog open={Boolean(selectedViagem)} onOpenChange={(open) => !open && setSelectedViagem(null)}>
          <DialogContent className="max-w-2xl sm:max-w-3xl p-6">
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    {formatLocal(selectedViagem.origem)} <ArrowRight className="h-4 w-4 text-primary" /> {formatLocal(selectedViagem.destino)}
                  </DialogTitle>
                  <DialogDescription className="text-xs pt-1">
                    Iniciada em {formatDateTime(selectedViagem.data_inicio)}
                    {selectedViagem.data_fim ? ` • Concluída em ${formatDateTime(selectedViagem.data_fim)}` : ""}
                  </DialogDescription>
                </div>
                {selectedViagem.status === "em_andamento" ? (
                  <Badge variant="warning">Em andamento</Badge>
                ) : selectedViagem.status === "cancelada" ? (
                  <Badge variant="destructive">Cancelada</Badge>
                ) : (
                  <Badge variant="success">Concluída</Badge>
                )}
              </div>
            </DialogHeader>

            {/* Informações do Condutor e Veículo */}
            {(() => {
              const modalMotoristaNome = typeof selectedViagem.usuario_id === "object" 
                ? selectedViagem.usuario_id.nome 
                : (selectedViagem.usuario_snapshot?.nome || "Motorista");
              const modalMotoristaFoto = typeof selectedViagem.usuario_id === "object" 
                ? (selectedViagem.usuario_id.foto_perfil || (selectedViagem.usuario_id as any).foto) 
                : (selectedViagem.usuario_snapshot?.foto_perfil || (selectedViagem.usuario_snapshot as any)?.foto || "");
              const modalVeiculo = (typeof selectedViagem.veiculo_id === "object" && selectedViagem.veiculo_id !== null ? (selectedViagem.veiculo_id as any) : null) ||
                selectedViagem.veiculo_snapshot ||
                selectedViagem.veiculo;

              return (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs my-1">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 border border-border/80 shadow-sm">
                      <AvatarImage src={modalMotoristaFoto} alt={modalMotoristaNome} className="object-cover" />
                      <AvatarFallback className="text-[10px] font-bold">
                        {modalMotoristaNome.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-bold text-foreground block">{modalMotoristaNome}</span>
                      <span className="text-muted-foreground text-[11px]">Condutor responsável</span>
                    </div>
                  </div>

                  {modalVeiculo?.placa && (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-foreground block">{formatPlaca(modalVeiculo.placa)}</span>
                        <span className="text-muted-foreground text-[11px]">{modalVeiculo.modelo}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Motivo do Cancelamento ou Descrição/Observações */}
            {selectedViagem.descricao && (
              <div className={`p-3 rounded-xl text-xs my-1 border ${
                selectedViagem.status === "cancelada"
                  ? "bg-destructive/10 border-destructive/20 text-destructive"
                  : "bg-muted/40 border-border/60 text-foreground"
              }`}>
                <div className="flex items-start gap-2">
                  {selectedViagem.status === "cancelada" && (
                    <Ban className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block mb-0.5">
                      {selectedViagem.status === "cancelada" ? "Motivo do cancelamento:" : "Observações / descrição:"}
                    </span>
                    <p className="text-foreground">{selectedViagem.descricao}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Resumo Financeiro & Métricas */}
            <div className="grid grid-cols-3 gap-3 my-2">
              <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-sm space-y-1">
                <span className="text-xs text-muted-foreground block font-medium">Despesas totais</span>
                <span className="text-xl font-black text-primary block">
                  {formatCurrency(selectedViagem.resumo_financeiro?.total_geral || 0)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-sm space-y-1">
                <span className="text-xs text-muted-foreground block font-medium">Distância percorrida</span>
                <span className="text-xl font-black text-foreground block">
                  {formatKM(
                    selectedViagem.resumo_financeiro?.metricas?.km_percorrido || 
                    (selectedViagem.km_final ? selectedViagem.km_final - selectedViagem.km_inicial : 0)
                  )}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-sm space-y-1">
                <span className="text-xs text-muted-foreground block font-medium">Média de consumo</span>
                <span className="text-xl font-black text-info block">
                  {formatConsumo(selectedViagem.resumo_financeiro?.metricas?.media_consumo)}
                </span>
              </div>
            </div>

            {/* Categorias de Despesas da Viagem */}
            {selectedViagem.resumo_financeiro?.por_categoria && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Detalhamento de custos da viagem
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                    <span className="text-muted-foreground">Abastecimento:</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(selectedViagem.resumo_financeiro.por_categoria.ABASTECIMENTO)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                    <span className="text-muted-foreground">Alimentação:</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(selectedViagem.resumo_financeiro.por_categoria.ALIMENTACAO)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                    <span className="text-muted-foreground">Pedágios:</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(selectedViagem.resumo_financeiro.por_categoria.PEDAGIO)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                    <span className="text-muted-foreground">Manutenção:</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(selectedViagem.resumo_financeiro.por_categoria.MANUTENCAO)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                    <span className="text-muted-foreground">Outros:</span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(selectedViagem.resumo_financeiro.por_categoria.OUTROS)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
              {/* Lado Esquerdo: 2 botões de consulta e auditoria */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button 
                  asChild 
                  variant="outline" 
                  className="h-10 px-4 rounded-xl gap-2 font-semibold text-xs border-border/80 shadow-xs hover:bg-muted shrink-0"
                >
                  <Link href={`/despesas?viagem_id=${selectedViagem._id}`}>
                    <ReceiptText className="h-4 w-4 text-primary" />
                    <span>Ver comprovantes</span>
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="h-10 px-4 rounded-xl gap-2 font-semibold text-xs border-border/80 shadow-xs hover:bg-muted shrink-0"
                  onClick={handleExportarViagemPDF}
                  disabled={isExportingPdf}
                  title="Emitir folha de prestação de contas (RDV) em PDF"
                >
                  {isExportingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <FileDown className="h-4 w-4 text-primary" />
                  )}
                  <span>Emitir RDV (PDF)</span>
                </Button>
              </div>

              {/* Lado Direito: 2 botões de fechamento e cancelamento */}
              <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                {selectedViagem.status === "em_andamento" && (
                  <Button
                    variant="destructive"
                    className="h-10 px-4 rounded-xl gap-2 font-semibold text-xs shadow-xs shrink-0"
                    onClick={() => {
                      setCancelingViagem(selectedViagem);
                      setMotivoCancelamento("");
                    }}
                  >
                    <Ban className="h-4 w-4" />
                    Cancelar viagem
                  </Button>
                )}
                <Button 
                  variant="default" 
                  className="h-10 px-6 rounded-xl font-bold text-xs shadow-xs shrink-0" 
                  onClick={() => setSelectedViagem(null)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Confirmação de Cancelamento de Viagem */}
      {cancelingViagem && (
        <Dialog open={Boolean(cancelingViagem)} onOpenChange={(open) => !open && setCancelingViagem(null)}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0 border border-destructive/30">
                  <Ban className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">Cancelar viagem</DialogTitle>
                  <DialogDescription className="text-xs pt-0.5">
                    A viagem de {formatLocal(cancelingViagem.origem)} para {formatLocal(cancelingViagem.destino)} será cancelada e interrompida.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <label className="text-xs font-semibold text-foreground">
                Motivo do cancelamento <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                placeholder="Ex: Quebra mecânica no cavalo, sinistro, cancelamento de carga..."
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setCancelingViagem(null)}
                disabled={isCancelando}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                disabled={isCancelando}
                onClick={async () => {
                  if (!cancelingViagem) return;
                  await cancelarViagem({ id: cancelingViagem._id, motivo: motivoCancelamento });
                  setCancelingViagem(null);
                  setSelectedViagem(null);
                }}
              >
                {isCancelando ? "Cancelando..." : "Confirmar cancelamento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
