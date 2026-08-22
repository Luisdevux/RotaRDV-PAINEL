// src/app/(auth)/veiculos/page.tsx

"use client";

import React, { useState, useMemo } from "react";
import { useVeiculos, useDebounce } from "@/hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { formatPlaca } from "@/lib/formatters";
import { unmask } from "@/lib/masks";
import { 
  Truck, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Fuel, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Loader2 
} from "lucide-react";
import { Veiculo, CriarVeiculoInput, AtualizarVeiculoInput } from "@/types";
import { VeiculoFormModal } from "./components/VeiculoFormModal";

export default function VeiculosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [limite, setLimite] = useState(10);

  // Estados dos Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null);
  const [deletingVeiculo, setDeletingVeiculo] = useState<Veiculo | null>(null);
  const [statusModalVeiculo, setStatusModalVeiculo] = useState<{ veiculo: Veiculo; nextStatus: "ativo" | "inativo" } | null>(null);

  const { 
    data: veiculosData, 
    isLoading, 
    criarVeiculo, 
    isCriando, 
    atualizarVeiculo, 
    isAtualizando,
    alterarStatusVeiculo,
    isAlterandoStatus,
    deletarVeiculo, 
    isDeletando 
  } = useVeiculos({ limite: 100 });

  const veiculosList: Veiculo[] = veiculosData?.docs || veiculosData?.items || (Array.isArray(veiculosData) ? veiculosData : []);

  const filteredVeiculos = useMemo(() => {
    if (!debouncedSearch.trim()) return veiculosList;
    const term = debouncedSearch.toLowerCase().trim();
    const cleanSearch = unmask(debouncedSearch).toUpperCase();
    return veiculosList.filter((v) => {
      const matchPlacasReboque = v.reboque?.placas?.some(p => p.toLowerCase().includes(term) || p.includes(cleanSearch));
      const matchPlacaReboque = v.reboque?.placa && (v.reboque.placa.toLowerCase().includes(term) || v.reboque.placa.includes(cleanSearch));
      return (
        v.modelo?.toLowerCase().includes(term) ||
        (v.placa && (v.placa.toLowerCase().includes(term) || v.placa.includes(cleanSearch))) ||
        (v.reboque?.modelo && v.reboque.modelo.toLowerCase().includes(term)) ||
        matchPlacasReboque ||
        matchPlacaReboque
      );
    });
  }, [veiculosList, debouncedSearch]);

  const totalDocs = filteredVeiculos.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limite));
  const displayedVeiculos = filteredVeiculos.slice((page - 1) * limite, page * limite);

  const handleCreateSubmit = async (data: CriarVeiculoInput | AtualizarVeiculoInput) => {
    await criarVeiculo(data as CriarVeiculoInput);
    setModalOpen(false);
  };

  const handleEditSubmit = async (data: AtualizarVeiculoInput) => {
    if (!editingVeiculo) return;
    await atualizarVeiculo({
      id: editingVeiculo._id,
      data,
    });
    setEditingVeiculo(null);
  };

  const handleConfirmStatus = async () => {
    if (!statusModalVeiculo) return;
    await alterarStatusVeiculo({
      id: statusModalVeiculo.veiculo._id,
      status: statusModalVeiculo.nextStatus,
    });
    setStatusModalVeiculo(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingVeiculo) return;
    await deletarVeiculo(deletingVeiculo._id);
    setDeletingVeiculo(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por placa, modelo ou carreta..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9 rounded-xl"
          />
        </div>

        <Button 
          variant="default" 
          onClick={() => setModalOpen(true)}
          className="rounded-xl font-bold gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Novo Veículo
        </Button>
      </div>

      {/* Veículos Table */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-bold">Cavalo Mecânico</TableHead>
              <TableHead className="font-bold">Combustível / Tanque</TableHead>
              <TableHead className="font-bold">Implemento / Carretas</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Carregando frota de veículos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayedVeiculos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Truck className="h-8 w-8 text-muted-foreground/50 mb-1" />
                    <p className="font-medium">Nenhum veículo encontrado na frota.</p>
                    <p className="text-xs">Utilize o botão &quot;Novo Veículo&quot; para cadastrar seus caminhões.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayedVeiculos.map((veiculo) => {
                const reboquePlacas = veiculo.reboque?.placas || (veiculo.reboque?.placa ? [veiculo.reboque.placa] : []);

                return (
                  <TableRow key={veiculo._id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold font-mono text-foreground text-sm tracking-wide">
                              {formatPlaca(veiculo.placa)}
                            </p>
                            {veiculo.ano_fabricacao && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                {veiculo.ano_fabricacao}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{veiculo.modelo}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          <Fuel className="h-3.5 w-3.5 text-primary" />
                          {veiculo.combustivel_preferencial || "DIESEL_S10"}
                        </p>
                        {veiculo.capacidade_tanque && (
                          <p className="text-muted-foreground font-mono">
                            Tanque: {veiculo.capacidade_tanque} L
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {veiculo.reboque && (veiculo.reboque.modelo || reboquePlacas.length > 0) ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                            <Layers className="h-3.5 w-3.5 text-primary" />
                            <span>{veiculo.reboque.modelo || "Implemento Rodoviário"}</span>
                            {veiculo.reboque.ano_fabricacao && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                ({veiculo.reboque.ano_fabricacao})
                              </span>
                            )}
                          </div>
                          {reboquePlacas.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {reboquePlacas.map((placa, idx) => (
                                <Badge key={idx} variant="outline" className="font-mono text-[10px] py-0 px-1.5 border-border">
                                  {formatPlaca(placa)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Nenhum</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {veiculo.status === "ativo" ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão de Ativação / Desativação no padrão visual da tela de empresas */}
                        <Button
                          variant="outline"
                          size="sm"
                          className={`rounded-xl text-xs font-semibold gap-1.5 ${
                            veiculo.status === "ativo"
                              ? "text-destructive hover:bg-destructive/10 border-destructive/30"
                              : "text-success hover:bg-success/10 border-success/30"
                          }`}
                          onClick={() =>
                            setStatusModalVeiculo({
                              veiculo,
                              nextStatus: veiculo.status === "ativo" ? "inativo" : "ativo",
                            })
                          }
                        >
                          {veiculo.status === "ativo" ? (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Ativar
                            </>
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl"
                          onClick={() => setEditingVeiculo(veiculo)}
                          title="Editar veículo"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                          onClick={() => setDeletingVeiculo(veiculo)}
                          title="Excluir veículo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

      {/* Modal de Criação de Veículo */}
      <VeiculoFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleCreateSubmit}
        isLoading={isCriando}
      />

      {/* Modal de Edição de Veículo */}
      <VeiculoFormModal
        open={Boolean(editingVeiculo)}
        onOpenChange={(open) => !open && setEditingVeiculo(null)}
        veiculo={editingVeiculo}
        onSubmit={handleEditSubmit}
        isLoading={isAtualizando}
      />

      {/* Modal de Confirmação de Exclusão de Veículo */}
      <ConfirmDialog
        open={Boolean(deletingVeiculo)}
        onOpenChange={(open) => !open && setDeletingVeiculo(null)}
        title="Excluir Veículo da Frota"
        description={`Tem certeza que deseja remover o veículo "${deletingVeiculo?.modelo}" (Placa: ${deletingVeiculo ? formatPlaca(deletingVeiculo.placa) : ""})? Esta ação não poderá ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isDeletando}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal de Confirmação de Alteração de Status */}
      <ConfirmDialog
        open={Boolean(statusModalVeiculo)}
        onOpenChange={(open) => !open && setStatusModalVeiculo(null)}
        title={
          statusModalVeiculo?.nextStatus === "inativo"
            ? "Desativar Veículo"
            : "Ativar Veículo"
        }
        description={
          statusModalVeiculo?.nextStatus === "inativo"
            ? `Tem certeza que deseja desativar o veículo "${statusModalVeiculo?.veiculo.modelo}" (Placa: ${statusModalVeiculo ? formatPlaca(statusModalVeiculo.veiculo.placa) : ""})? O caminhão ficará indisponível para seleção em novas viagens.`
            : `Deseja reativar o veículo "${statusModalVeiculo?.veiculo.modelo}" (Placa: ${statusModalVeiculo ? formatPlaca(statusModalVeiculo.veiculo.placa) : ""}) para a frota operacional?`
        }
        confirmText={statusModalVeiculo?.nextStatus === "inativo" ? "Sim, Desativar" : "Sim, Ativar"}
        cancelText="Cancelar"
        variant={statusModalVeiculo?.nextStatus === "inativo" ? "destructive" : "default"}
        isLoading={isAlterandoStatus}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
