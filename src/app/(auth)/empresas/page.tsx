// src/app/(auth)/empresas/page.tsx

"use client";

import React, { useState, useMemo } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { useEmpresasAdmin } from "@/hooks/useEmpresa";
import { useDebounce } from "@/hooks";
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
  CheckCircle2, 
  XCircle, 
  Phone,
  Mail,
} from "lucide-react";
import { formatCNPJ, formatDateTime, formatTelefone } from "@/lib/formatters";
import { unmask } from "@/lib/masks";
import { Empresa } from "@/types";

export default function EmpresasAdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusModalEmpresa, setStatusModalEmpresa] = useState<{ empresa: Empresa; nextStatus: "ativo" | "inativo" } | null>(null);
  const [page, setPage] = useState(1);
  const [limite, setLimite] = useState(10);

  const { data: empresasData, isLoading, alterarStatus, isAlterandoStatus } = useEmpresasAdmin({ limite: 100 });

  const empresasList: Empresa[] = empresasData?.docs || empresasData?.items || (Array.isArray(empresasData) ? empresasData : []);

  const filteredEmpresas = useMemo(() => {
    if (!debouncedSearch.trim()) return empresasList;
    const term = debouncedSearch.toLowerCase().trim();
    const cleanSearch = unmask(debouncedSearch).toUpperCase();
    return empresasList.filter((e) => {
      return (
        e.nome_empresa?.toLowerCase().includes(term) ||
        (e.cnpj && (e.cnpj.toLowerCase().includes(term) || e.cnpj.includes(cleanSearch))) ||
        e.email?.toLowerCase().includes(term)
      );
    });
  }, [empresasList, debouncedSearch]);

  const totalDocs = filteredEmpresas.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limite));
  const displayedEmpresas = filteredEmpresas.slice((page - 1) * limite, page * limite);

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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
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
            ) : displayedEmpresas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  Nenhuma transportadora encontrada.
                </TableCell>
              </TableRow>
            ) : (
              displayedEmpresas.map((empresa) => (
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
                      <p className="text-foreground font-medium flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {empresa.email}
                      </p>
                      {empresa.telefone && (
                        <p className="text-muted-foreground font-mono flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {formatTelefone(empresa.telefone)}
                        </p>
                      )}
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
                      variant="outline"
                      size="sm"
                      className={`rounded-xl text-xs font-semibold gap-1.5 ${
                        empresa.status === "ativo"
                          ? "text-destructive hover:bg-destructive/10 border-destructive/30"
                          : "text-success hover:bg-success/10 border-success/30"
                      }`}
                      onClick={() =>
                        setStatusModalEmpresa({
                          empresa,
                          nextStatus: empresa.status === "ativo" ? "inativo" : "ativo",
                        })
                      }
                    >
                      {empresa.status === "ativo" ? (
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

      {/* Modal de Confirmação de Alteração de Status */}
      <ConfirmDialog
        open={Boolean(statusModalEmpresa)}
        onOpenChange={(open) => !open && setStatusModalEmpresa(null)}
        title={
          statusModalEmpresa?.nextStatus === "inativo"
            ? "Desativar Transportadora"
            : "Ativar Transportadora"
        }
        description={
          statusModalEmpresa?.nextStatus === "inativo"
            ? `Tem certeza que deseja desativar a transportadora "${statusModalEmpresa?.empresa.nome_empresa}"? Os gestores e motoristas desta empresa não conseguirão acessar a plataforma.`
            : `Deseja reativar o acesso da transportadora "${statusModalEmpresa?.empresa.nome_empresa}" à plataforma?`
        }
        confirmText={statusModalEmpresa?.nextStatus === "inativo" ? "Sim, Desativar" : "Sim, Ativar"}
        cancelText="Cancelar"
        variant={statusModalEmpresa?.nextStatus === "inativo" ? "destructive" : "default"}
        isLoading={isAlterandoStatus}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
