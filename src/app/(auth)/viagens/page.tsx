// src/app/(auth)/viagens/page.tsx

"use client";

import React, { useState } from "react";
import { useViagens } from "@/hooks/useViagens";
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
  const [statusFilter, setStatusFilter] = useState<string>("todas");
  const [selectedViagem, setSelectedViagem] = useState<Viagem | null>(null);
  const [page, setPage] = useState(1);
  const [limite, setLimite] = useState(10);

  const { data: viagensData, isLoading } = useViagens({
    page,
    limite,
    status: statusFilter !== "todas" ? statusFilter : undefined,
  });

  const viagensList: Viagem[] = viagensData?.docs || viagensData?.items || (Array.isArray(viagensData) ? viagensData : []);
  const totalDocs = viagensData?.totalDocs ?? viagensData?.total ?? viagensData?.count ?? viagensList.length;
  const totalPages = viagensData?.totalPages ?? viagensData?.paginas ?? Math.max(1, Math.ceil(totalDocs / limite));

  const filteredViagens = viagensList.filter((v) => {
    const term = searchTerm.toLowerCase();
    const motoristaNome = typeof v.usuario_id === "object" ? v.usuario_id.nome : "";
    const origemStr = formatLocal(v.origem).toLowerCase();
    const destinoStr = formatLocal(v.destino).toLowerCase();
    
    return (
      origemStr.includes(term) ||
      destinoStr.includes(term) ||
      motoristaNome.toLowerCase().includes(term) ||
      v.veiculo?.placa?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por origem, destino, motorista ou placa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border">
          <Button
            variant={statusFilter === "todas" ? "default" : "ghost"}
            size="sm"
            className="rounded-lg text-xs font-semibold"
            onClick={() => setStatusFilter("todas")}
          >
            Todas
          </Button>
          <Button
            variant={statusFilter === "em_andamento" ? "default" : "ghost"}
            size="sm"
            className="rounded-lg text-xs font-semibold"
            onClick={() => setStatusFilter("em_andamento")}
          >
            Em Andamento
          </Button>
          <Button
            variant={statusFilter === "concluída" ? "default" : "ghost"}
            size="sm"
            className="rounded-lg text-xs font-semibold"
            onClick={() => setStatusFilter("concluída")}
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
              <TableHead>Rota (Origem → Destino)</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Odômetro & Distância</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Despesas</TableHead>
              <TableHead className="text-right">Auditoria</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                  Carregando viagens...
                </TableCell>
              </TableRow>
            ) : filteredViagens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                  Nenhuma viagem encontrada com os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredViagens.map((viagem) => {
                const motoristaNome = typeof viagem.usuario_id === "object" ? viagem.usuario_id.nome : "Motorista";
                const totalDespesas = viagem.resumo_financeiro?.total_geral || 0;
                const kmPercorrido = viagem.resumo_financeiro?.metricas?.km_percorrido || 
                  (viagem.km_final ? viagem.km_final - viagem.km_inicial : 0);

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
                            src={typeof viagem.usuario_id === "object" ? viagem.usuario_id.foto_perfil || (viagem.usuario_id as any).foto : ""} 
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
                      {viagem.veiculo?.placa ? (
                        <div className="space-y-0.5 text-xs">
                          <span className="font-mono font-bold text-foreground">
                            {formatPlaca(viagem.veiculo.placa)}
                          </span>
                          <p className="text-muted-foreground">{viagem.veiculo.modelo}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">-</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-semibold text-foreground">
                          {formatKM(kmPercorrido)}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          KM Inicial: {viagem.km_inicial} {viagem.km_final ? `• Final: ${viagem.km_final}` : ""}
                        </p>
                      </div>
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

                    <TableCell className="font-bold text-sm text-foreground">
                      {formatCurrency(totalDespesas)}
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
