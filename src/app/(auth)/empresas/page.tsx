// src/app/(auth)/empresas/page.tsx

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SafeImage } from "@/components/ui/safe-image";
import { useEmpresasAdmin } from "@/hooks/useEmpresa";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { 
  Building2, 
  Search, 
  Building, 
  Mail, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Loader2 
} from "lucide-react";
import { formatCNPJ, formatDateTime } from "@/lib/formatters";
import { Empresa } from "@/types";

export default function EmpresasAdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusModalEmpresa, setStatusModalEmpresa] = useState<{ empresa: Empresa; nextStatus: "ativo" | "inativo" } | null>(null);
  const [page, setPage] = useState(1);
  const [limite, setLimite] = useState(10);

  const { data: empresasData, isLoading, alterarStatus, isAlterandoStatus } = useEmpresasAdmin({ page, limite });

  const empresasList: Empresa[] = empresasData?.docs || empresasData?.items || (Array.isArray(empresasData) ? empresasData : []);
  const totalDocs = empresasData?.totalDocs ?? empresasData?.total ?? empresasData?.count ?? empresasList.length;
  const totalPages = empresasData?.totalPages ?? empresasData?.paginas ?? Math.max(1, Math.ceil(totalDocs / limite));

  const filteredEmpresas = empresasList.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      e.nome_empresa?.toLowerCase().includes(term) ||
      e.cnpj?.includes(term) ||
      e.email?.toLowerCase().includes(term)
    );
  });

  const handleConfirmStatus = async () => {
    if (!statusModalEmpresa) return;
    await alterarStatus({
      id: statusModalEmpresa.empresa._id,
      status: statusModalEmpresa.nextStatus,
    });
    setStatusModalEmpresa(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transportadora por razão social, CNPJ ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {/* Empresas Table */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transportadora</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  Carregando transportadoras...
                </TableCell>
              </TableRow>
            ) : filteredEmpresas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  Nenhuma transportadora encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredEmpresas.map((empresa) => (
                <TableRow key={empresa._id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                        <SafeImage 
                          src={empresa.foto_logo || ""} 
                          alt={empresa.nome_empresa} 
                          fill 
                          className="object-cover" 
                          fallbackType="building"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{empresa.nome_empresa}</p>
                        <p className="text-xs text-muted-foreground">{empresa.endereco?.cidade ? `${empresa.endereco.cidade} - ${empresa.endereco.estado}` : "Sede não informada"}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    {formatCNPJ(empresa.cnpj)}
                  </TableCell>

                  <TableCell>
                    <div className="space-y-0.5 text-xs">
                      <p className="text-foreground font-medium">{empresa.email}</p>
                      {empresa.telefone && <p className="text-muted-foreground">{empresa.telefone}</p>}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(empresa.createdAt, "dd/MM/yyyy")}
                  </TableCell>

                  <TableCell>
                    {empresa.status === "ativo" ? (
                      <Badge variant="success">Ativa</Badge>
                    ) : (
                      <Badge variant="destructive">Inativa</Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant={empresa.status === "ativo" ? "outline" : "default"}
                      size="sm"
                      className="rounded-xl text-xs font-semibold"
                      disabled={isAlterandoStatus}
                      onClick={() => {
                        const nextStatus = empresa.status === "ativo" ? "inativo" : "ativo";
                        setStatusModalEmpresa({ empresa, nextStatus });
                      }}
                    >
                      {empresa.status === "ativo" ? "Bloquear" : "Ativar"}
                    </Button>
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

      {/* Modal de Confirmação de Alteração de Status da Empresa */}
      <ConfirmDialog
        open={Boolean(statusModalEmpresa)}
        onOpenChange={(open) => !open && setStatusModalEmpresa(null)}
        title={statusModalEmpresa?.nextStatus === "inativo" ? "Bloquear Acesso da Transportadora" : "Ativar Acesso da Transportadora"}
        description={
          statusModalEmpresa?.nextStatus === "inativo"
            ? `Tem certeza que deseja bloquear a empresa "${statusModalEmpresa?.empresa.nome_empresa}"? Todos os gestores e motoristas desta organização perderão o acesso ao sistema.`
            : `Deseja reativar o acesso da empresa "${statusModalEmpresa?.empresa.nome_empresa}"? Gestores e motoristas poderão acessar o sistema normalmente.`
        }
        confirmText={statusModalEmpresa?.nextStatus === "inativo" ? "Sim, Bloquear Empresa" : "Sim, Reativar Empresa"}
        cancelText="Cancelar"
        variant={statusModalEmpresa?.nextStatus === "inativo" ? "destructive" : "default"}
        isLoading={isAlterandoStatus}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
