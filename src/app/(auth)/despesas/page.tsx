// src/app/(auth)/despesas/page.tsx

"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useDespesas, useDebounce } from "@/hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ComprovanteModal } from "@/components/ComprovanteModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
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
  Trash2
} from "lucide-react";
import { Despesa, TipoDespesa } from "@/types";

const CATEGORY_ICONS: Record<string, any> = {
  ABASTECIMENTO: Fuel,
  ALIMENTACAO: Utensils,
  MANUTENCAO: Wrench,
  PEDAGIO: CreditCard,
  OUTROS: ReceiptText,
};

function DespesasContent() {
  const searchParams = useSearchParams();
  const viagemIdFromUrl = searchParams.get("viagem_id") || undefined;

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [tipoFilter, setTipoFilter] = useState<string>("todas");
  const [comprovanteDespesa, setComprovanteDespesa] = useState<Despesa | null>(null);
  const [comprovanteOpen, setComprovanteOpen] = useState(false);
  const [deletingDespesa, setDeletingDespesa] = useState<Despesa | null>(null);
  const [page, setPage] = useState(1);
  const [limite, setLimite] = useState(10);

  const { data: despesasData, isLoading, deletarDespesa, isDeletando } = useDespesas({
    limite: 100,
    viagem_id: viagemIdFromUrl,
    tipo: tipoFilter !== "todas" ? tipoFilter : undefined,
  });

  const despesasList: Despesa[] = despesasData?.docs || despesasData?.items || (Array.isArray(despesasData) ? despesasData : []);

  const filteredDespesas = useMemo(() => {
    if (!debouncedSearch.trim()) return despesasList;
    const term = debouncedSearch.toLowerCase().trim();
    return despesasList.filter((d) => {
      return (
        d.local?.toLowerCase().includes(term) ||
        d.descricao?.toLowerCase().includes(term) ||
        d.tipo?.toLowerCase().includes(term)
      );
    });
  }, [despesasList, debouncedSearch]);

  const totalDocs = filteredDespesas.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limite));
  const displayedDespesas = filteredDespesas.slice((page - 1) * limite, page * limite);

  const openComprovante = (despesa: Despesa) => {
    setComprovanteDespesa(despesa);
    setComprovanteOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border">
          <Button
            variant={tipoFilter === "todas" ? "default" : "ghost"}
            size="sm"
            className="rounded-lg text-xs font-semibold"
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
            className="rounded-lg text-xs font-semibold"
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
            className="rounded-lg text-xs font-semibold"
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
            className="rounded-lg text-xs font-semibold"
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
            className="rounded-lg text-xs font-semibold"
            onClick={() => {
              setTipoFilter("MANUTENCAO");
              setPage(1);
            }}
          >
            Manutenção
          </Button>
        </div>
      </div>

      {/* Despesas Table */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>Local / Estabelecimento</TableHead>
              <TableHead>Data & Hora</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Comprovante Fiscal</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  Carregando despesas...
                </TableCell>
              </TableRow>
            ) : displayedDespesas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  Nenhuma despesa encontrada com os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              displayedDespesas.map((despesa) => {
                const Icon = CATEGORY_ICONS[despesa.tipo] || ReceiptText;

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

      {/* Modal de Exibição e Zoom de Comprovantes */}
      <ComprovanteModal
        despesa={comprovanteDespesa}
        open={comprovanteOpen}
        onOpenChange={setComprovanteOpen}
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
