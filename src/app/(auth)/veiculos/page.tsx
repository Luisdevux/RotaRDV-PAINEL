// src/app/(auth)/veiculos/page.tsx

"use client";

import React, { useState } from "react";
import { useVeiculos } from "@/hooks/useVeiculos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { formatPlaca } from "@/lib/formatters";
import { 
  Truck, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Fuel, 
  Layers, 
  Loader2, 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Veiculo, CombustivelPreferencial } from "@/types";

const veiculoSchema = z.object({
  placa: z.string().min(7, "Placa deve ter no mínimo 7 caracteres"),
  modelo: z.string().min(2, "Modelo do caminhão é obrigatório"),
  combustivel_preferencial: z.enum(["DIESEL_S10", "DIESEL_S500", "GASOLINA", "ETANOL", "ARLA_32", "OUTRO"]),
  capacidade_tanque: z.coerce.number().min(1, "Capacidade do tanque é obrigatória"),
  ano_fabricacao: z.coerce.number().min(1980, "Ano de fabricação inválido"),
  reboque_placa: z.string().optional(),
  reboque_modelo: z.string().optional(),
});

type VeiculoFormValues = z.infer<typeof veiculoSchema>;

const editVeiculoSchema = z.object({
  modelo: z.string().min(2, "Modelo é obrigatório"),
  combustivel_preferencial: z.enum(["DIESEL_S10", "DIESEL_S500", "GASOLINA", "ETANOL", "ARLA_32", "OUTRO"]),
  capacidade_tanque: z.coerce.number().min(1, "Capacidade do tanque é obrigatória"),
  ano_fabricacao: z.coerce.number().min(1980, "Ano inválido"),
  reboque_placa: z.string().optional(),
  reboque_modelo: z.string().optional(),
});

type EditVeiculoFormValues = z.infer<typeof editVeiculoSchema>;

export default function VeiculosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [combustivel, setCombustivel] = useState<CombustivelPreferencial>("DIESEL_S10");
  const [page, setPage] = useState(1);
  const [limite, setLimite] = useState(10);

  // Modais de Ação
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null);
  const [editCombustivel, setEditCombustivel] = useState<CombustivelPreferencial>("DIESEL_S10");
  const [deletingVeiculo, setDeletingVeiculo] = useState<Veiculo | null>(null);

  const { 
    data: veiculosData, 
    isLoading, 
    criarVeiculo, 
    isCriando, 
    atualizarVeiculo, 
    isAtualizando, 
    deletarVeiculo, 
    isDeletando 
  } = useVeiculos({ page, limite });

  const veiculosList: Veiculo[] = veiculosData?.docs || veiculosData?.items || (Array.isArray(veiculosData) ? veiculosData : []);
  const totalDocs = veiculosData?.totalDocs ?? veiculosData?.total ?? veiculosData?.count ?? veiculosList.length;
  const totalPages = veiculosData?.totalPages ?? veiculosData?.paginas ?? Math.max(1, Math.ceil(totalDocs / limite));

  const filteredVeiculos = veiculosList.filter((v) => {
    const term = searchTerm.toLowerCase();
    return (
      v.placa?.toLowerCase().includes(term) ||
      v.modelo?.toLowerCase().includes(term) ||
      v.reboque?.placa?.toLowerCase().includes(term)
    );
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VeiculoFormValues>({
    resolver: zodResolver(veiculoSchema),
    defaultValues: {
      combustivel_preferencial: "DIESEL_S10",
      ano_fabricacao: new Date().getFullYear(),
      capacidade_tanque: 400,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    setValue: setValueEdit,
    formState: { errors: editErrors },
  } = useForm<EditVeiculoFormValues>({
    resolver: zodResolver(editVeiculoSchema),
  });

  const onSubmitCreate = async (data: VeiculoFormValues) => {
    await criarVeiculo({
      placa: data.placa.toUpperCase().replace(/[^A-Z0-9]/g, ""),
      modelo: data.modelo,
      combustivel_preferencial: combustivel,
      capacidade_tanque: Number(data.capacidade_tanque),
      ano_fabricacao: Number(data.ano_fabricacao),
      reboque: data.reboque_placa ? {
        placa: data.reboque_placa.toUpperCase().replace(/[^A-Z0-9]/g, ""),
        modelo: data.reboque_modelo,
      } : undefined,
    });
    reset();
    setModalOpen(false);
  };

  const handleOpenEdit = (veiculo: Veiculo) => {
    setEditingVeiculo(veiculo);
    setValueEdit("modelo", veiculo.modelo);
    setValueEdit("capacidade_tanque", veiculo.capacidade_tanque);
    setValueEdit("ano_fabricacao", veiculo.ano_fabricacao);
    setValueEdit("combustivel_preferencial", veiculo.combustivel_preferencial);
    setEditCombustivel(veiculo.combustivel_preferencial);
    setValueEdit("reboque_placa", veiculo.reboque?.placa || "");
    setValueEdit("reboque_modelo", veiculo.reboque?.modelo || "");
  };

  const onSubmitEdit = async (data: EditVeiculoFormValues) => {
    if (!editingVeiculo) return;
    await atualizarVeiculo({
      id: editingVeiculo._id,
      data: {
        modelo: data.modelo,
        combustivel_preferencial: editCombustivel,
        capacidade_tanque: Number(data.capacidade_tanque),
        ano_fabricacao: Number(data.ano_fabricacao),
        reboque: data.reboque_placa ? {
          placa: data.reboque_placa.toUpperCase().replace(/[^A-Z0-9]/g, ""),
          modelo: data.reboque_modelo,
        } : undefined,
      },
    });
    setEditingVeiculo(null);
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="rounded-xl font-bold gap-2 shadow-md">
              <Plus className="h-4 w-4" />
              Novo Veículo
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <form onSubmit={handleSubmit(onSubmitCreate)}>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Cadastrar Veículo na Frota</DialogTitle>
                <DialogDescription className="text-xs">
                  Adicione cavalos mecânicos e implementos/reboques à sua transportadora.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="placa">Placa do Cavalo</Label>
                    <Input
                      id="placa"
                      placeholder="ABC-1234 ou ABC1D23"
                      className="rounded-xl font-mono uppercase"
                      {...register("placa")}
                    />
                    {errors.placa && (
                      <p className="text-xs text-destructive">{errors.placa.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="modelo">Modelo / Marca</Label>
                    <Input
                      id="modelo"
                      placeholder="Ex: Scania R450 6x2"
                      className="rounded-xl"
                      {...register("modelo")}
                    />
                    {errors.modelo && (
                      <p className="text-xs text-destructive">{errors.modelo.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="combustivel">Combustível</Label>
                    <Select
                      value={combustivel}
                      onValueChange={(val: any) => setCombustivel(val)}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIESEL_S10">Diesel S10</SelectItem>
                        <SelectItem value="DIESEL_S500">Diesel S500</SelectItem>
                        <SelectItem value="GASOLINA">Gasolina</SelectItem>
                        <SelectItem value="ETANOL">Etanol</SelectItem>
                        <SelectItem value="ARLA_32">Arla 32</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="capacidade_tanque">Tanque (Litros)</Label>
                    <Input
                      id="capacidade_tanque"
                      type="number"
                      placeholder="400"
                      className="rounded-xl"
                      {...register("capacidade_tanque")}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="ano_fabricacao">Ano</Label>
                    <Input
                      id="ano_fabricacao"
                      type="number"
                      placeholder="2024"
                      className="rounded-xl"
                      {...register("ano_fabricacao")}
                    />
                  </div>
                </div>

                {/* Implemento / Reboque Subform */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2.5">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    Carreta / Implemento (Opcional)
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="reboque_placa" className="text-xs">Placa da Carreta</Label>
                      <Input
                        id="reboque_placa"
                        placeholder="XYZ-9876"
                        className="rounded-xl font-mono uppercase text-xs"
                        {...register("reboque_placa")}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="reboque_modelo" className="text-xs">Modelo da Carreta</Label>
                      <Input
                        id="reboque_modelo"
                        placeholder="Ex: Graneleiro Randon 3 Eixos"
                        className="rounded-xl text-xs"
                        {...register("reboque_modelo")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="default" disabled={isCriando} className="font-bold">
                  {isCriando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Cadastrar Veículo"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Veiculos Table */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Veículo</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Combustível</TableHead>
              <TableHead>Capacidade Tanque</TableHead>
              <TableHead>Implemento / Carreta</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  Carregando frota de veículos...
                </TableCell>
              </TableRow>
            ) : filteredVeiculos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  Nenhum veículo cadastrado na frota. Clique em &quot;Novo Veículo&quot; para adicionar.
                </TableCell>
              </TableRow>
            ) : (
              filteredVeiculos.map((veiculo) => (
                <TableRow key={veiculo._id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-muted border border-border flex items-center justify-center text-primary shrink-0">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm leading-tight">{veiculo.modelo}</p>
                        <p className="text-xs text-muted-foreground">Ano {veiculo.ano_fabricacao}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono font-bold text-xs text-foreground">
                    <span className="px-2 py-1 rounded-md bg-muted/60 border border-border/70">
                      {formatPlaca(veiculo.placa)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-xs font-semibold gap-1 text-primary border-primary/30">
                      <Fuel className="h-3 w-3" />
                      {veiculo.combustivel_preferencial}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs font-semibold text-foreground">
                    {veiculo.capacidade_tanque} Litros
                  </TableCell>

                  <TableCell>
                    {veiculo.reboque?.placa ? (
                      <div className="space-y-0.5 text-xs">
                        <p className="font-mono font-semibold text-foreground">{formatPlaca(veiculo.reboque.placa)}</p>
                        <p className="text-muted-foreground">{veiculo.reboque.modelo || "Implemento"}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Sem implemento</span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl"
                        onClick={() => handleOpenEdit(veiculo)}
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
              ))
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

      {/* Modal de Edição de Veículo */}
      <Dialog open={Boolean(editingVeiculo)} onOpenChange={(open) => !open && setEditingVeiculo(null)}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmitEdit(onSubmitEdit)}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Editar Veículo ({editingVeiculo?.placa})</DialogTitle>
              <DialogDescription className="text-xs">
                Atualize as especificações, implementos e capacidade do veículo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4">
              <div className="space-y-1">
                <Label htmlFor="edit-modelo">Modelo / Marca</Label>
                <Input
                  id="edit-modelo"
                  className="rounded-xl"
                  {...registerEdit("modelo")}
                />
                {editErrors.modelo && (
                  <p className="text-xs text-destructive">{editErrors.modelo.message}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-combustivel">Combustível</Label>
                  <Select
                    value={editCombustivel}
                    onValueChange={(val: any) => setEditCombustivel(val)}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIESEL_S10">Diesel S10</SelectItem>
                      <SelectItem value="DIESEL_S500">Diesel S500</SelectItem>
                      <SelectItem value="GASOLINA">Gasolina</SelectItem>
                      <SelectItem value="ETANOL">Etanol</SelectItem>
                      <SelectItem value="ARLA_32">Arla 32</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-tanque">Tanque (Litros)</Label>
                  <Input
                    id="edit-tanque"
                    type="number"
                    className="rounded-xl"
                    {...registerEdit("capacidade_tanque")}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-ano">Ano</Label>
                  <Input
                    id="edit-ano"
                    type="number"
                    className="rounded-xl"
                    {...registerEdit("ano_fabricacao")}
                  />
                </div>
              </div>

              {/* Implemento / Reboque Subform */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2.5">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Carreta / Implemento (Opcional)
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-reboque-placa" className="text-xs">Placa da Carreta</Label>
                    <Input
                      id="edit-reboque-placa"
                      placeholder="XYZ-9876"
                      className="rounded-xl font-mono uppercase text-xs"
                      {...registerEdit("reboque_placa")}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="edit-reboque-modelo" className="text-xs">Modelo da Carreta</Label>
                    <Input
                      id="edit-reboque-modelo"
                      placeholder="Ex: Graneleiro 3 Eixos"
                      className="rounded-xl text-xs"
                      {...registerEdit("reboque_modelo")}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingVeiculo(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="default" disabled={isAtualizando} className="font-bold">
                {isAtualizando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
