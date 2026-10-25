// src/app/(auth)/empresas/page.tsx

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useActiveEmpresa } from "@/providers/ActiveEmpresaProvider";
import { SafeImage } from "@/components/ui/safe-image";
import { useEmpresasAdmin } from "@/hooks/useEmpresa";
import { useDebounce, useViaCep } from "@/hooks";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Phone,
  Mail,
  Plus,
  Check,
  Loader2,
  MapPin,
} from "lucide-react";
import { formatCNPJ, formatDateTime, formatTelefone } from "@/lib/formatters";
import { unmask, maskCNPJ, maskTelefone, maskCEP, maskUF, isValidCNPJ } from "@/lib/masks";
import { Empresa } from "@/types";
import { toast } from "sonner";

export default function EmpresasAdminPage() {
  const router = useRouter();
  const { user, isSuperAdmin, isAdminEmpresa, isLoading: isLoadingAuth } = useAuth();
  const { empresa: activeEmpresa, setEmpresaId, refreshEmpresas } = useActiveEmpresa();
  const { consultarCep, isLoadingCep } = useViaCep();

  const canAccessPage = Boolean(isSuperAdmin || isAdminEmpresa);

  useEffect(() => {
    if (!isLoadingAuth && !canAccessPage) {
      router.replace("/dashboard");
    }
  }, [isLoadingAuth, canAccessPage, router]);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusModalEmpresa, setStatusModalEmpresa] = useState<{ empresa: Empresa; nextStatus: "ativo" | "inativo" } | null>(null);
  const [page, setPage] = useState(1);
  const [limite, setLimite] = useState(10);

  // Estado do Modal de Nova Filial / Unidade
  const [modalNovaOpen, setModalNovaOpen] = useState(false);
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const {
    data: empresasData,
    isLoading,
    criarEmpresa,
    isCriando,
    cadastrarFilial,
    isCadastrandoFilial,
    alterarStatus,
    isAlterandoStatus,
  } = useEmpresasAdmin({ page, limite });

  const empresasList: Empresa[] = empresasData?.docs || empresasData?.items || (Array.isArray(empresasData) ? empresasData : []);

  const filteredEmpresas = useMemo(() => {
    if (!debouncedSearch.trim()) return empresasList;
    const term = debouncedSearch.toLowerCase().trim();
    const cleanSearch = unmask(debouncedSearch).toUpperCase();
    return empresasList.filter((e) => {
      const eCnpj = e.cnpj || "";
      const cleanECnpj = unmask(eCnpj).toUpperCase();
      const cnpjMatches = cleanSearch ? cleanECnpj.includes(cleanSearch) : false;
      const rawCnpjMatches = eCnpj.toLowerCase().includes(term);
      return (
        e.nome_empresa?.toLowerCase().includes(term) ||
        cnpjMatches ||
        rawCnpjMatches ||
        e.email?.toLowerCase().includes(term)
      );
    });
  }, [empresasList, debouncedSearch]);

  const totalDocs = empresasData?.totalDocs ?? filteredEmpresas.length;
  const totalPages = empresasData?.totalPages ?? Math.max(1, Math.ceil(totalDocs / limite));
  const displayedEmpresas = filteredEmpresas;

  const resetForm = () => {
    setNomeEmpresa("");
    setCnpj("");
    setEmail("");
    setTelefone("");
    setCep("");
    setLogradouro("");
    setNumero("");
    setComplemento("");
    setBairro("");
    setCidade("");
    setEstado("");
  };

  const handleCepChange = async (value: string) => {
    const masked = maskCEP(value);
    setCep(masked);
    const clean = unmask(masked);
    if (clean.length === 8) {
      await consultarCep(clean, (end) => {
        if (end.logradouro) setLogradouro(end.logradouro);
        if (end.bairro) setBairro(end.bairro);
        if (end.cidade) setCidade(end.cidade);
        if (end.estado) setEstado(end.estado);
      });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeEmpresa.trim() || nomeEmpresa.trim().length < 3) {
      toast.error("Informe a razão social ou nome da unidade/filial (mínimo 3 caracteres).");
      return;
    }
    if (!isValidCNPJ(cnpj)) {
      toast.error("Informe um CNPJ válido para a unidade/filial.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Informe um e-mail institucional válido.");
      return;
    }

    const action = isSuperAdmin ? criarEmpresa : cadastrarFilial;
    const nova = await action({
      nome_empresa: nomeEmpresa.trim(),
      cnpj: unmask(cnpj).toUpperCase(),
      email: email.trim().toLowerCase(),
      telefone: telefone ? unmask(telefone) : undefined,
      endereco: {
        cep: cep ? unmask(cep) : undefined,
        logradouro: logradouro.trim() || undefined,
        numero: numero.trim() || undefined,
        complemento: complemento.trim() || undefined,
        bairro: bairro.trim() || undefined,
        cidade: cidade.trim() || undefined,
        estado: estado.trim().toUpperCase() || undefined,
      },
    });

    await refreshEmpresas();
    if (nova?._id) {
      setEmpresaId(nova._id);
      toast.info(`Alternado para a nova unidade: ${nova.nome_empresa}`);
    }
    resetForm();
    setModalNovaOpen(false);
  };

  const handleConfirmStatus = async () => {
    if (!statusModalEmpresa) return;
    await alterarStatus({
      id: statusModalEmpresa.empresa._id,
      status: statusModalEmpresa.nextStatus,
    });
    await refreshEmpresas();
    setStatusModalEmpresa(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Header + Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar unidade ou transportadora por nome, CNPJ ou e-mail..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9 rounded-xl"
          />
        </div>

        <Button
          onClick={() => setModalNovaOpen(true)}
          className="rounded-xl font-semibold gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          {isSuperAdmin ? "Nova transportadora" : "Nova filial / unidade"}
        </Button>
      </div>

      {/* Empresas Table */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isSuperAdmin ? "Transportadora" : "Unidade / Filial"}</TableHead>
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
                  Carregando unidades...
                </TableCell>
              </TableRow>
            ) : displayedEmpresas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-xs">
                  Nenhuma unidade encontrada.
                </TableCell>
              </TableRow>
            ) : (
              displayedEmpresas.map((empresa) => {
                const isSelected = String(empresa._id) === String(activeEmpresa?._id);
                const isMatriz = String(empresa._id) === String(user?.empresa_id);

                return (
                  <TableRow key={empresa._id} className={isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"}>
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-foreground text-sm">{empresa.nome_empresa}</p>
                            {!isSuperAdmin && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-semibold">
                                {isMatriz ? "Matriz" : "Filial"}
                              </Badge>
                            )}
                            {isSelected && (
                              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
                                Em exibição
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {empresa.endereco?.cidade ? `${empresa.endereco.cidade} - ${empresa.endereco.estado}` : "Sede não informada"}
                          </p>
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
                      <div className="flex items-center justify-end gap-2">
                        {!isSelected && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                            onClick={() => {
                              setEmpresaId(empresa._id);
                              toast.info(`Unidade ativa alterada para: ${empresa.nome_empresa}`);
                            }}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Selecionar
                          </Button>
                        )}

                        {isSuperAdmin && (
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
                        )}
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

      {/* Modal de Cadastro de Nova Filial / Unidade */}
      <Dialog open={modalNovaOpen} onOpenChange={setModalNovaOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Building2 className="h-5 w-5 text-primary" />
              {isSuperAdmin ? "Cadastrar nova transportadora" : "Cadastrar nova filial / unidade coligada"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isSuperAdmin
                ? "Preencha os dados cadastrais para registrar uma nova transportadora na plataforma."
                : "A nova filial terá frota, motoristas, viagens e relatórios próprios, ficando coligada ao seu painel de administrador."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="nome_empresa" className="text-xs font-semibold">
                  Razão Social / Nome da Unidade *
                </Label>
                <Input
                  id="nome_empresa"
                  placeholder="Ex: Transportadora Batista - Filial Porto Velho"
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cnpj" className="text-xs font-semibold">
                  CNPJ da Unidade *
                </Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0002-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                  maxLength={18}
                  className="rounded-xl font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefone" className="text-xs font-semibold">
                  Telefone Comercial
                </Label>
                <Input
                  id="telefone"
                  placeholder="(69) 3322-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(maskTelefone(e.target.value))}
                  maxLength={15}
                  className="rounded-xl font-mono"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  E-mail Institucional da Unidade *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="filial.pvh@transportadora.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="border-t border-border/60 pt-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Endereço da Unidade (Opcional)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cep" className="text-xs font-semibold">
                    CEP {isLoadingCep && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}
                  </Label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    maxLength={9}
                    className="rounded-xl font-mono"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="logradouro" className="text-xs font-semibold">
                    Logradouro / Rodovia
                  </Label>
                  <Input
                    id="logradouro"
                    placeholder="Ex: BR-364, Km 12"
                    value={logradouro}
                    onChange={(e) => setLogradouro(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="numero" className="text-xs font-semibold">
                    Número
                  </Label>
                  <Input
                    id="numero"
                    placeholder="S/N"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="bairro" className="text-xs font-semibold">
                    Bairro / Distrito Industrial
                  </Label>
                  <Input
                    id="bairro"
                    placeholder="Distrito Industrial"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="cidade" className="text-xs font-semibold">
                    Cidade
                  </Label>
                  <Input
                    id="cidade"
                    placeholder="Porto Velho"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="estado" className="text-xs font-semibold">
                    UF
                  </Label>
                  <Input
                    id="estado"
                    placeholder="RO"
                    value={estado}
                    onChange={(e) => setEstado(maskUF(e.target.value))}
                    maxLength={2}
                    className="rounded-xl font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalNovaOpen(false)}
                className="rounded-xl"
                disabled={isCriando || isCadastrandoFilial}
              >
                Cancelar
              </Button>
              <Button type="submit" className="rounded-xl font-semibold gap-2" disabled={isCriando || isCadastrandoFilial}>
                {(isCriando || isCadastrandoFilial) && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSuperAdmin ? "Cadastrar transportadora" : "Cadastrar filial"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Alteração de Status */}
      <ConfirmDialog
        open={Boolean(statusModalEmpresa)}
        onOpenChange={(open) => !open && setStatusModalEmpresa(null)}
        title={
          statusModalEmpresa?.nextStatus === "inativo"
            ? "Desativar unidade"
            : "Ativar unidade"
        }
        description={
          statusModalEmpresa?.nextStatus === "inativo"
            ? `Tem certeza que deseja desativar a unidade "${statusModalEmpresa?.empresa.nome_empresa}"? Os gestores e motoristas vinculados a esta unidade não conseguirão iniciar novas operações enquanto estiver inativa.`
            : `Deseja reativar a unidade "${statusModalEmpresa?.empresa.nome_empresa}" na plataforma?`
        }
        confirmText={statusModalEmpresa?.nextStatus === "inativo" ? "Sim, desativar" : "Sim, ativar"}
        cancelText="Cancelar"
        variant={statusModalEmpresa?.nextStatus === "inativo" ? "destructive" : "default"}
        isLoading={isAlterandoStatus}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
