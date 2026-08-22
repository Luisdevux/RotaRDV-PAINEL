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
  ReceiptText 
} from "lucide-react";
import { Viagem } from "@/types";
import Link from "next/link";

export default function ViagensPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [selectedViagem, setSelectedViagem] = useState<Viagem | null>(null);
  const [page, setPage] = useState(1);
  const [limite, setLimite] = useState(10);

  const { data: viagensData, isLoading } = useViagens({
    limite: 100,
    status: statusFilter !== "todas" ? statusFilter : undefined,
  });

  const viagensList: Viagem[] = viagensData?.docs || viagensData?.items || (Array.isArray(viagensData) ? viagensData : []);

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

  const totalDocs = filteredViagens.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limite));
  const displayedViagens = filteredViagens.slice((page - 1) * limite, page * limite);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            className="rounded-lg text-xs font-semibold"
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
            className="rounded-lg text-xs font-semibold"
            onClick={() => {
              setStatusFilter("em_andamento");
              setPage(1);
            }}
          >
            Em Andamento
          </Button>
          <Button
            variant={statusFilter === "concluída" ? "default" : "ghost"}
            size="sm"
            className="rounded-lg text-xs font-semibold"
            onClick={() => {
              setStatusFilter("concluída");
              setPage(1);
            }}
          >
            Concluídas
          </Button>
        </div>
      </div>

      {/* Viagens Table */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Origem & Destino</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Total Despesas</TableHead>
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
                          Em Andamento
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
          <DialogContent className="max-w-2xl p-6">
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
                  <Badge variant="warning">Em Andamento</Badge>
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
                      <span className="text-muted-foreground text-[11px]">Condutor Responsável</span>
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

            {/* Resumo Financeiro & Métricas */}
            <div className="grid grid-cols-3 gap-3 my-2">
              <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-sm space-y-1">
                <span className="text-xs text-muted-foreground block font-medium">Despesas Totais</span>
                <span className="text-xl font-black text-primary block">
                  {formatCurrency(selectedViagem.resumo_financeiro?.total_geral || 0)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-sm space-y-1">
                <span className="text-xs text-muted-foreground block font-medium">Distância Percorrida</span>
                <span className="text-xl font-black text-foreground block">
                  {formatKM(
                    selectedViagem.resumo_financeiro?.metricas?.km_percorrido || 
                    (selectedViagem.km_final ? selectedViagem.km_final - selectedViagem.km_inicial : 0)
                  )}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border/80 shadow-sm space-y-1">
                <span className="text-xs text-muted-foreground block font-medium">Média de Consumo</span>
                <span className="text-xl font-black text-info block">
                  {formatConsumo(selectedViagem.resumo_financeiro?.metricas?.media_consumo)}
                </span>
              </div>
            </div>

            {/* Categorias de Despesas da Viagem */}
            {selectedViagem.resumo_financeiro?.por_categoria && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Detalhamento de Custos da Viagem
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

            <DialogFooter className="mt-4 flex items-center justify-between">
              <Button asChild variant="outline" className="gap-2">
                <Link href={`/despesas?viagem_id=${selectedViagem._id}`}>
                  <ReceiptText className="h-4 w-4 text-primary" />
                  Ver Comprovantes desta Viagem
                </Link>
              </Button>
              <Button variant="default" onClick={() => setSelectedViagem(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
