// src/app/(auth)/administrativo/page.tsx

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth, useEquipeAdministrativa, useDebounce } from "@/hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatCPF, formatTelefone } from "@/lib/formatters";
import { unmask } from "@/lib/masks";
import { 
  Search, 
  ShieldCheck, 
  Shield, 
  Edit3, 
  CheckCircle2, 
  XCircle,
  Mail, 
  Phone, 
  Loader2, 
  UserPlus, 
  Briefcase,
  Info 
} from "lucide-react";
import { Usuario, CriarMembroAdministrativoInput, AtualizarMembroAdministrativoInput } from "@/types";
import { MembroNovoModal } from "./components/MembroNovoModal";
import { MembroEditModal } from "./components/MembroEditModal";

export default function AdministrativoPage() {
  const { user: authUser, isSuperAdmin } = useAuth();
  const canManageTeam = Boolean((authUser?.role === "admin" || authUser?.isAdmin) && !isSuperAdmin);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [roleFilter, setRoleFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [page, setPage] = useState(1);
  const [limite, setLimite] = useState(10);

  // Modais de Ação
  const [modalNovoOpen, setModalNovoOpen] = useState(false);
  const [editingMembro, setEditingMembro] = useState<Usuario | null>(null);
  const [statusModalMembro, setStatusModalMembro] = useState<{ membro: Usuario; nextStatus: "ativo" | "inativo" } | null>(null);

  // Custom hook encapsulado
  const {
    membros,
    isLoading,
    cadastrarMembro,
    isCadastrando,
    atualizarMembro,
    isAtualizando,
    alterarStatusMembro,
    isAlterandoStatus,
  } = useEquipeAdministrativa({ roleFilter, statusFilter });

  // Busca rápida, otimizada com debounce e useMemo no frontend
  const filteredTeam = useMemo(() => {
    if (!debouncedSearch.trim()) return membros;
    const term = debouncedSearch.toLowerCase().trim();
    const cleanSearch = unmask(debouncedSearch);
    return membros.filter((m) => {
      return (
        m.nome?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term) ||
        (m.cpf && m.cpf.includes(cleanSearch)) ||
        (m.empresa?.cargo && m.empresa.cargo.toLowerCase().includes(term))
      );
    });
  }, [membros, debouncedSearch]);

  const totalDocs = filteredTeam.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limite));
  const displayedTeam = filteredTeam.slice((page - 1) * limite, page * limite);

  const handleCreateSubmit = async (data: CriarMembroAdministrativoInput) => {
    await cadastrarMembro(data);
    setModalNovoOpen(false);
  };

  const handleEditSubmit = async (data: AtualizarMembroAdministrativoInput) => {
    if (!editingMembro) return;
    await atualizarMembro({
      id: editingMembro._id,
      data,
    });
    setEditingMembro(null);
  };

  const handleConfirmStatus = async () => {
    if (!statusModalMembro) return;
    await alterarStatusMembro({
      id: statusModalMembro.membro._id,
      status: statusModalMembro.nextStatus,
    });
    setStatusModalMembro(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header com Filtros e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail, cargo ou CPF..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={roleFilter}
              onValueChange={(val) => {
                setRoleFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os papéis</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[130px] rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {canManageTeam && (
          <Button 
            variant="default" 
            onClick={() => setModalNovoOpen(true)}
            className="rounded-xl font-bold gap-2 shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Adicionar administrador / gestor
          </Button>
        )}
      </div>

      {!canManageTeam && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>
            {isSuperAdmin
              ? "Modo de auditoria global. Apenas os Administradores internos da própria empresa podem adicionar novos membros, alterar cargos ou inativar acessos."
              : "Você está em modo de visualização. Apenas Administradores internos da empresa podem adicionar novos membros, alterar cargos ou inativar acessos."}
          </span>
        </div>
      )}

      {/* Tabela de Membros Administrativos */}
      <Card className="border border-border/80 bg-card rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-bold">Membro da equipe</TableHead>
              <TableHead className="font-bold">Contatos</TableHead>
              <TableHead className="font-bold">CPF</TableHead>
              <TableHead className="font-bold">Cargo</TableHead>
              <TableHead className="font-bold">Nível de acesso</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              {canManageTeam && <TableHead className="font-bold text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManageTeam ? 7 : 6} className="h-32 text-center text-muted-foreground text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Carregando equipe administrativa...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTeam.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManageTeam ? 7 : 6} className="h-32 text-center text-muted-foreground text-xs">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <ShieldCheck className="h-8 w-8 text-muted-foreground/50 mb-1" />
                    <p className="font-medium">Nenhum membro administrativo encontrado.</p>
                    <p className="text-xs">Utilize os filtros acima para refinar a listagem de membros.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayedTeam.map((membro: Usuario) => {
                const isItemAdmin = membro.role === "admin" || membro.isAdmin;
                const isSelf = membro._id === authUser?.id;

                return (
                  <TableRow key={membro._id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border/80 shadow-sm shrink-0">
                          <AvatarImage src={membro.foto_perfil || ""} alt={membro.nome} className="object-cover" />
                          <AvatarFallback className="bg-primary/15 text-primary border border-primary/30 font-bold text-xs">
                            {membro.nome ? membro.nome.slice(0, 2).toUpperCase() : "AD"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-foreground">
                              {membro.nome}
                            </span>
                            {isSelf && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1 border-primary/40 text-primary">
                                Você
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground block">
                            Adicionado à empresa
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{membro.email}</span>
                        </div>
                        {membro.telefone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{formatTelefone(membro.telefone)}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatCPF(membro.cpf) || "—"}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                        <Briefcase className="h-3.5 w-3.5 text-primary" />
                        <span>{membro.empresa?.cargo || (isItemAdmin ? "Administrador geral" : "Gestor de frota")}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {isItemAdmin ? (
                        <Badge 
                          variant="outline" 
                          className="rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold gap-1 text-[11px]"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Administrador
                        </Badge>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold gap-1 text-[11px]"
                        >
                          <Shield className="h-3.5 w-3.5" />
                          Gestor
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {membro.status === "ativo" ? (
                        <Badge variant="success" className="gap-1 h-5 text-[10px]">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1 h-5 text-[10px]">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>

                    {canManageTeam && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão de Ativação / Inativação no padrão visual de empresas */}
                          {!isSelf && (
                            <Button
                              variant="outline"
                              size="sm"
                              className={`rounded-xl text-xs font-semibold gap-1.5 ${
                                membro.status === "ativo"
                                  ? "text-destructive hover:bg-destructive/10 border-destructive/30"
                                  : "text-success hover:bg-success/10 border-success/30"
                              }`}
                              onClick={() =>
                                setStatusModalMembro({
                                  membro,
                                  nextStatus: membro.status === "ativo" ? "inativo" : "ativo",
                                })
                              }
                            >
                              {membro.status === "ativo" ? (
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
                          )}

                          {/* Botão de Editar Nível / Cargo */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-xl"
                            onClick={() => setEditingMembro(membro)}
                            title="Alterar cargo e permissões"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
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

      {/* Modal Modular de Cadastro de Membro */}
      <MembroNovoModal
        open={modalNovoOpen}
        onOpenChange={setModalNovoOpen}
        onSubmit={handleCreateSubmit}
        isLoading={isCadastrando}
      />

      {/* Modal Modular de Edição de Membro */}
      <MembroEditModal
        open={Boolean(editingMembro)}
        onOpenChange={(open) => !open && setEditingMembro(null)}
        membro={editingMembro}
        isAdmin={canManageTeam}
        onSubmit={handleEditSubmit}
        isLoading={isAtualizando}
      />

      {/* Modal de Confirmação de Alteração de Status */}
      <ConfirmDialog
        open={Boolean(statusModalMembro)}
        onOpenChange={(open) => !open && setStatusModalMembro(null)}
        title={
          statusModalMembro?.nextStatus === "inativo"
            ? "Inativar membro administrativo"
            : "Ativar membro administrativo"
        }
        description={
          statusModalMembro?.nextStatus === "inativo"
            ? `Tem certeza que deseja inativar o acesso de "${statusModalMembro?.membro.nome}"? O usuário perderá o acesso ao painel administrativo até ser reativado.`
            : `Deseja reativar o acesso de "${statusModalMembro?.membro.nome}" ao painel administrativo?`
        }
        confirmText={statusModalMembro?.nextStatus === "inativo" ? "Sim, inativar" : "Sim, ativar"}
        cancelText="Cancelar"
        variant={statusModalMembro?.nextStatus === "inativo" ? "destructive" : "default"}
        isLoading={isAlterandoStatus}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
