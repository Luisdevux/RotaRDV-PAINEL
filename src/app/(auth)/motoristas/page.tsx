// src/app/(auth)/motoristas/page.tsx

"use client";

import React, { useState, useMemo } from "react";
import { useMotoristas, useDebounce } from "@/hooks";
import { useVeiculos } from "@/hooks/useVeiculos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatCPF, formatPlaca, formatTelefone } from "@/lib/formatters";
import { unmask } from "@/lib/masks";
import { 
  UserPlus, 
  Search, 
  Truck, 
  Trash2, 
  Edit3, 
  Mail, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Loader2 
} from "lucide-react";
import { Usuario, CriarMotoristaInput, AtualizarUsuarioInput, Veiculo } from "@/types";
import { MotoristaFormModal } from "./components/MotoristaFormModal";
import { MotoristaEditModal } from "./components/MotoristaEditModal";

export default function MotoristasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(1);
  const [limite, setLimite] = useState(10);

  // Modais de Ação
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMotorista, setEditingMotorista] = useState<Usuario | null>(null);
  const [deletingMotorista, setDeletingMotorista] = useState<Usuario | null>(null);
  const [statusModalMotorista, setStatusModalMotorista] = useState<{ motorista: Usuario; nextStatus: "ativo" | "inativo" } | null>(null);

  const { 
    data: motoristasData, 
    isLoading, 
    cadastrarMotorista, 
    isCadastrando, 
    atualizarMotorista, 
    isAtualizando,
    alterarStatusMotorista,
    isAlterandoStatus,
    desvincularMotorista, 
    isDesvinculando 
  } = useMotoristas(undefined, { limite: 100 });
  
  const { data: veiculosData } = useVeiculos({ limite: 100 });

  const motoristasList: Usuario[] = motoristasData?.docs || motoristasData?.items || (Array.isArray(motoristasData) ? motoristasData : []);
  const veiculosList: Veiculo[] = veiculosData?.docs || veiculosData?.items || (Array.isArray(veiculosData) ? veiculosData : []);

  const filteredMotoristas = useMemo(() => {
    if (!debouncedSearch.trim()) return motoristasList;
    const term = debouncedSearch.toLowerCase().trim();
    const cleanSearch = unmask(debouncedSearch);
    return motoristasList.filter((m) => {
      return (
        m.nome?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term) ||
        (m.cpf && (m.cpf.includes(cleanSearch) || m.cpf.toLowerCase().includes(term)))
      );
    });
  }, [motoristasList, debouncedSearch]);

  const totalDocs = filteredMotoristas.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limite));
  const displayedMotoristas = filteredMotoristas.slice((page - 1) * limite, page * limite);

  const handleCreateSubmit = async (data: CriarMotoristaInput) => {
    await cadastrarMotorista(data);
    setModalOpen(false);
  };

  const handleEditSubmit = async (data: AtualizarUsuarioInput) => {
    if (!editingMotorista) return;
    await atualizarMotorista({
      id: editingMotorista._id,
      data,
    });
    setEditingMotorista(null);
  };

  const handleConfirmStatus = async () => {
    if (!statusModalMotorista) return;
    await alterarStatusMotorista({
      id: statusModalMotorista.motorista._id,
      status: statusModalMotorista.nextStatus,
    });
    setStatusModalMotorista(null);
  };

  const handleConfirmDesvincular = async () => {
    if (!deletingMotorista) return;
    await desvincularMotorista(deletingMotorista._id);
    setDeletingMotorista(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou CPF..."
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
          <UserPlus className="h-4 w-4" />
          Cadastrar Motorista
        </Button>
      </div>

      {/* Tabela de Motoristas */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-bold">Motorista</TableHead>
              <TableHead className="font-bold">Contatos</TableHead>
              <TableHead className="font-bold">Documento (CPF)</TableHead>
              <TableHead className="font-bold">Caminhão Vinculado</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Carregando motoristas da transportadora...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayedMotoristas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <UserPlus className="h-8 w-8 text-muted-foreground/50 mb-1" />
                    <p className="font-medium">Nenhum motorista cadastrado.</p>
                    <p className="text-xs">Clique no botão acima para adicionar o primeiro condutor à frota.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayedMotoristas.map((motorista) => {
                const veiculoInfo = typeof motorista.veiculo_id === "object" ? motorista.veiculo_id : veiculosList.find((v) => v._id === motorista.veiculo_id);

                return (
                  <TableRow key={motorista._id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border/80 shadow-sm shrink-0">
                          <AvatarImage 
                            src={motorista.foto_perfil || (motorista as any).foto || ""} 
                            alt={motorista.nome} 
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary/15 text-primary border border-primary/30 font-bold text-xs">
                            {motorista.nome ? motorista.nome.slice(0, 2).toUpperCase() : "MO"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground text-sm leading-tight">{motorista.nome}</p>
                          <p className="text-xs text-muted-foreground">{motorista.empresa?.cargo || "Motorista Rodoviário"}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <p className="flex items-center gap-1.5 text-foreground font-medium">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {motorista.email}
                        </p>
                        {motorista.telefone && (
                          <p className="flex items-center gap-1.5 text-muted-foreground font-mono">
                            <Phone className="h-3.5 w-3.5" />
                            {formatTelefone(motorista.telefone)}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-foreground font-medium">
                      {formatCPF(motorista.cpf)}
                    </TableCell>

                    <TableCell>
                      {veiculoInfo ? (
                        <Badge variant="outline" className="gap-1.5 font-medium border-border">
                          <Truck className="h-3.5 w-3.5 text-primary" />
                          {formatPlaca(veiculoInfo.placa)} — {veiculoInfo.modelo}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Nenhum</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {motorista.status === "ativo" ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="destructive">Inativo</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão de Ativação / Inativação no padrão visual de empresas */}
                        <Button
                          variant="outline"
                          size="sm"
                          className={`rounded-xl text-xs font-semibold gap-1.5 ${
                            motorista.status === "ativo"
                              ? "text-destructive hover:bg-destructive/10 border-destructive/30"
                              : "text-success hover:bg-success/10 border-success/30"
                          }`}
                          onClick={() =>
                            setStatusModalMotorista({
                              motorista,
                              nextStatus: motorista.status === "ativo" ? "inativo" : "ativo",
                            })
                          }
                        >
                          {motorista.status === "ativo" ? (
                            <>
                              <XCircle className="h-3.5 w-3.5" />
                              Inativar
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
                          onClick={() => setEditingMotorista(motorista)}
                          title="Editar motorista"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                          onClick={() => setDeletingMotorista(motorista)}
                          title="Desvincular motorista"
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

      {/* Modal Modular de Cadastro de Motorista */}
      <MotoristaFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        veiculosList={veiculosList}
        onSubmit={handleCreateSubmit}
        isLoading={isCadastrando}
      />

      {/* Modal Modular de Edição de Motorista */}
      <MotoristaEditModal
        open={Boolean(editingMotorista)}
        onOpenChange={(open) => !open && setEditingMotorista(null)}
        motorista={editingMotorista}
        veiculosList={veiculosList}
        onSubmit={handleEditSubmit}
        isLoading={isAtualizando}
      />

      {/* Modal Elegante de Confirmação de Desvinculação */}
      <ConfirmDialog
        open={Boolean(deletingMotorista)}
        onOpenChange={(open) => !open && setDeletingMotorista(null)}
        title="Desvincular Motorista da Transportadora"
        description={`Tem certeza que deseja desvincular o motorista "${deletingMotorista?.nome}"? O condutor perderá o acesso às viagens e dados vinculados a esta empresa.`}
        confirmText="Sim, Desvincular"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isDesvinculando}
        onConfirm={handleConfirmDesvincular}
      />

      {/* Modal Elegante de Confirmação de Alteração de Status */}
      <ConfirmDialog
        open={Boolean(statusModalMotorista)}
        onOpenChange={(open) => !open && setStatusModalMotorista(null)}
        title={
          statusModalMotorista?.nextStatus === "inativo"
            ? "Inativar Motorista"
            : "Ativar Motorista"
        }
        description={
          statusModalMotorista?.nextStatus === "inativo"
            ? `Deseja suspender temporariamente o motorista "${statusModalMotorista?.motorista.nome}"? O condutor não conseguirá abrir novas viagens no aplicativo.`
            : `Deseja reativar o motorista "${statusModalMotorista?.motorista.nome}"? Ele voltará a ter acesso total ao aplicativo.`
        }
        confirmText={statusModalMotorista?.nextStatus === "inativo" ? "Sim, Inativar" : "Sim, Ativar"}
        cancelText="Cancelar"
        variant={statusModalMotorista?.nextStatus === "inativo" ? "destructive" : "default"}
        isLoading={isAlterandoStatus}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
