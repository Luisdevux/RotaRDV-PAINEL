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
  ChevronDown, 
  ChevronRight, 
  GitBranch 
} from "lucide-react";
import { formatCNPJ, formatDateTime, formatTelefone } from "@/lib/formatters";
import { unmask, maskCNPJ, maskTelefone, maskCEP, maskUF, isValidCNPJ } from "@/lib/masks";
import { Empresa } from "@/types";
import { toast } from "sonner";

interface MatrizGroup {
  matriz: Empresa;
  filiais: Empresa[];
}

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

  // Controle de linhas expandidas para o Super Admin
  const [expandedMatrizIds, setExpandedMatrizIds] = useState<Record<string, boolean>>({});

  // Estado do Modal de Cadastro (pode ser Nova Transportadora ou Nova Filial)
  const [modalNovaOpen, setModalNovaOpen] = useState(false);
  const [selectedMatrizParaFilial, setSelectedMatrizParaFilial] = useState<Empresa | null>(null);

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

  // Agrupamento hierárquico de Matriz x Filiais para o Super Admin
  const gruposSuperAdmin = useMemo(() => {
    if (!isSuperAdmin) return null;

    const mapMatrizes = new Map<string, MatrizGroup>();
    const filiaisOrfas: Empresa[] = [];

    const isFilial = (emp: Empresa) => {
      if (emp.matriz_id) return true;
      if (emp.admin_id && typeof emp.admin_id === "object" && emp.admin_id.empresa_id) {
        return String(emp._id) !== String(emp.admin_id.empresa_id);
      }
      return false;
    };

    // 1º passo: Registrar todas as matrizes
    filteredEmpresas.forEach((emp) => {
      if (!isFilial(emp)) {
        mapMatrizes.set(String(emp._id), { matriz: emp, filiais: [] });
      }
    });

    // 2º passo: Vincular as filiais nas matrizes correspondentes
    filteredEmpresas.forEach((emp) => {
      if (isFilial(emp)) {
        let mId = "";
        if (emp.matriz_id) {
          mId = typeof emp.matriz_id === "object" ? String(emp.matriz_id._id) : String(emp.matriz_id);
        } else if (emp.admin_id && typeof emp.admin_id === "object" && emp.admin_id.empresa_id) {
          mId = String(emp.admin_id.empresa_id);
        }

        if (mId && mapMatrizes.has(mId)) {
          mapMatrizes.get(mId)!.filiais.push(emp);
        } else {
          filiaisOrfas.push(emp);
        }
      }
    });

    return {
      grupos: Array.from(mapMatrizes.values()),
      filiaisOrfas,
    };
  }, [filteredEmpresas, isSuperAdmin]);

  const toggleExpand = (id: string) => {
    setExpandedMatrizIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
    setSelectedMatrizParaFilial(null);
  };

  const handleAbrirNovaTransportadora = () => {
    resetForm();
    setSelectedMatrizParaFilial(null);
    setModalNovaOpen(true);
  };

  const handleAbrirNovaFilial = (matriz?: Empresa) => {
    resetForm();
    if (matriz) {
      setSelectedMatrizParaFilial(matriz);
    }
    setModalNovaOpen(true);
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

    const payload = {
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
    };

    let nova: Empresa;
    if (selectedMatrizParaFilial) {
      nova = await cadastrarFilial({
        ...payload,
        matriz_id: selectedMatrizParaFilial._id,
      });
      // Expandir a matriz para que a nova filial fique visível
      setExpandedMatrizIds((prev) => ({
        ...prev,
        [selectedMatrizParaFilial._id]: true,
      }));
    } else if (isSuperAdmin) {
      nova = await criarEmpresa(payload);
    } else {
      nova = await cadastrarFilial(payload);
    }

    await refreshEmpresas();
    if (nova?._id) {
      setEmpresaId(nova._id);
      toast.info(`Alternado para a unidade: ${nova.nome_empresa}`);
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
            placeholder={
              isSuperAdmin
                ? "Buscar transportadora matriz ou filial por nome, CNPJ..."
                : "Buscar unidade ou filial por nome, CNPJ ou e-mail..."
            }
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin ? (
            <Button
              onClick={handleAbrirNovaTransportadora}
              className="rounded-xl font-semibold gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nova transportadora
            </Button>
          ) : (
            <Button
              onClick={() => handleAbrirNovaFilial()}
              className="rounded-xl font-semibold gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nova filial / unidade
            </Button>
          )}
        </div>
      </div>

      {/* Empresas Table */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {isSuperAdmin && <TableHead className="w-10"></TableHead>}
              <TableHead>{isSuperAdmin ? "Transportadora (Matriz)" : "Unidade / Filial"}</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato</TableHead>
              {isSuperAdmin && <TableHead>Filiais</TableHead>}
              <TableHead>Cadastro</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 8 : 6} className="h-32 text-center text-muted-foreground text-xs">
                  Carregando transportadoras...
                </TableCell>
              </TableRow>
            ) : filteredEmpresas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 8 : 6} className="h-32 text-center text-muted-foreground text-xs">
                  Nenhuma transportadora encontrada.
                </TableCell>
              </TableRow>
            ) : isSuperAdmin && gruposSuperAdmin ? (
              // VISÃO DO SUPER ADMIN: HIERARQUIA MATRIZ -> FILIAIS (EXPANDÍVEL)
              gruposSuperAdmin.grupos.map(({ matriz, filiais }) => {
                const isSelected = String(matriz._id) === String(activeEmpresa?._id);
                const isExpanded = Boolean(expandedMatrizIds[matriz._id]);
                const totalFiliais = filiais.length;

                return (
                  <React.Fragment key={matriz._id}>
                    {/* Linha da Transportadora Matriz */}
                    <TableRow className={isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"}>
                      <TableCell className="w-10 pr-0">
                        {totalFiliais > 0 ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground"
                            onClick={() => toggleExpand(matriz._id)}
                            title={isExpanded ? "Recolher filiais" : "Expandir filiais"}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-primary" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        ) : (
                          <div className="h-8 w-8 flex items-center justify-center text-muted-foreground/30 text-xs">
                            •
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                            <SafeImage 
                              src={matriz.foto_logo || ""} 
                              alt={matriz.nome_empresa} 
                              fill 
                              className="object-cover" 
                              fallbackType="building"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-foreground text-sm">{matriz.nome_empresa}</p>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-semibold text-primary border-primary/30">
                                Matriz
                              </Badge>
                              {isSelected && (
                                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
                                  Em exibição
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {matriz.endereco?.cidade ? `${matriz.endereco.cidade} - ${matriz.endereco.estado}` : "Sede não informada"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        {formatCNPJ(matriz.cnpj)}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <p className="text-foreground font-medium flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {matriz.email}
                          </p>
                          {matriz.telefone && (
                            <p className="text-muted-foreground font-mono flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {formatTelefone(matriz.telefone)}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {totalFiliais > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2.5 rounded-lg text-xs font-bold gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"
                            onClick={() => toggleExpand(matriz._id)}
                          >
                            <GitBranch className="h-3.5 w-3.5" />
                            {totalFiliais} {totalFiliais === 1 ? "filial" : "filiais"}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem filiais</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(matriz.createdAt, "dd/MM/yyyy")}
                      </TableCell>

                      <TableCell>
                        {matriz.status === "ativo" ? (
                          <Badge variant="success">Ativa</Badge>
                        ) : (
                          <Badge variant="destructive">Inativa</Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/10"
                            onClick={() => handleAbrirNovaFilial(matriz)}
                            title={`Adicionar filial para ${matriz.nome_empresa}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Filial
                          </Button>

                          {!isSelected && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl text-xs font-semibold gap-1 text-foreground hover:bg-muted"
                              onClick={() => {
                                setEmpresaId(matriz._id);
                                toast.info(`Transportadora ativa: ${matriz.nome_empresa}`);
                              }}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Selecionar
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            className={`rounded-xl text-xs font-semibold gap-1 ${
                              matriz.status === "ativo"
                                ? "text-destructive hover:bg-destructive/10 border-destructive/30"
                                : "text-success hover:bg-success/10 border-success/30"
                            }`}
                            onClick={() =>
                              setStatusModalEmpresa({
                                empresa: matriz,
                                nextStatus: matriz.status === "ativo" ? "inativo" : "ativo",
                              })
                            }
                          >
                            {matriz.status === "ativo" ? (
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
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Linha Expandida com as Filiais da Matriz */}
                    {isExpanded && totalFiliais > 0 && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={8} className="p-0 border-b border-border/80">
                          <div className="p-4 pl-12 sm:pl-16 space-y-3 bg-muted/30 border-l-4 border-l-primary/60">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-foreground flex items-center gap-2">
                                <GitBranch className="h-4 w-4 text-primary" />
                                Filiais coligadas ({totalFiliais})
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs font-semibold gap-1 text-primary hover:bg-primary/10"
                                onClick={() => handleAbrirNovaFilial(matriz)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Adicionar filial
                              </Button>
                            </div>

                            <div className="rounded-xl border border-border/70 overflow-hidden bg-background">
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-[11px]">Nome da Filial</TableHead>
                                    <TableHead className="text-[11px]">CNPJ</TableHead>
                                    <TableHead className="text-[11px]">Localidade</TableHead>
                                    <TableHead className="text-[11px]">Contato</TableHead>
                                    <TableHead className="text-[11px]">Status</TableHead>
                                    <TableHead className="text-right text-[11px]">Ações</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filiais.map((filial) => {
                                    const isFilialSelected = String(filial._id) === String(activeEmpresa?._id);

                                    return (
                                      <TableRow key={filial._id} className={isFilialSelected ? "bg-primary/5" : ""}>
                                        <TableCell className="text-xs font-semibold text-foreground">
                                          <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground font-mono text-[11px]">↳</span>
                                            {filial.nome_empresa}
                                            <Badge variant="outline" className="text-[9px] px-1 h-3.5 font-normal">
                                              Filial
                                            </Badge>
                                            {isFilialSelected && (
                                              <Badge className="text-[9px] px-1 h-3.5 bg-primary/15 text-primary border-primary/30">
                                                Em exibição
                                              </Badge>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                          {formatCNPJ(filial.cnpj)}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                          {filial.endereco?.cidade ? `${filial.endereco.cidade} - ${filial.endereco.estado}` : "Não informado"}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                          {filial.email}
                                        </TableCell>
                                        <TableCell>
                                          {filial.status === "ativo" ? (
                                            <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">Ativa</Badge>
                                          ) : (
                                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Inativa</Badge>
                                          )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            {!isFilialSelected && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs rounded-lg gap-1 border-primary/30 text-primary hover:bg-primary/10"
                                                onClick={() => {
                                                  setEmpresaId(filial._id);
                                                  toast.info(`Unidade ativa: ${filial.nome_empresa}`);
                                                }}
                                              >
                                                <Check className="h-3 w-3" />
                                                Selecionar
                                              </Button>
                                            )}

                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className={`h-7 text-xs rounded-lg gap-1 ${
                                                filial.status === "ativo"
                                                  ? "text-destructive hover:bg-destructive/10 border-destructive/30"
                                                  : "text-success hover:bg-success/10 border-success/30"
                                              }`}
                                              onClick={() =>
                                                setStatusModalEmpresa({
                                                  empresa: filial,
                                                  nextStatus: filial.status === "ativo" ? "inativo" : "ativo",
                                                })
                                              }
                                            >
                                              {filial.status === "ativo" ? "Desativar" : "Ativar"}
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              // VISÃO DO ADMINISTRADOR DE EMPRESA: UNIDADES E FILIAIS DA EMPRESA DELE
              filteredEmpresas.map((empresa) => {
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
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-semibold">
                              {isMatriz ? "Matriz" : "Filial"}
                            </Badge>
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
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Controles de Paginação */}
        <div className="p-4 border-t border-border">
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalDocs}
            itemsPerPage={limite}
            onItemsPerPageChange={setLimite}
          />
        </div>
      </Card>

      {/* Modal de Cadastro (Nova Transportadora para Super Admin ou Nova Filial) */}
      <Dialog open={modalNovaOpen} onOpenChange={setModalNovaOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {selectedMatrizParaFilial
                ? `Cadastrar filial: ${selectedMatrizParaFilial.nome_empresa}`
                : isSuperAdmin
                ? "Nova transportadora parceira"
                : "Nova filial / unidade"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedMatrizParaFilial
                ? `A nova filial será vinculada diretamente à transportadora matriz "${selectedMatrizParaFilial.nome_empresa}".`
                : isSuperAdmin
                ? "Preencha os dados institucionais da transportadora matriz para liberá-la no RotaRDV."
                : "Cadastre uma nova filial coligada para gerenciar operações em outra cidade ou base."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="nomeEmpresa" className="text-xs font-semibold">
                  {selectedMatrizParaFilial || !isSuperAdmin ? "Nome da Filial / Unidade" : "Razão Social / Nome da Transportadora"}
                </Label>
                <Input
                  id="nomeEmpresa"
                  placeholder={
                    selectedMatrizParaFilial
                      ? `Ex: ${selectedMatrizParaFilial.nome_empresa} - Base Porto Velho`
                      : "Ex: Transportadora Rota Norte Ltda"
                  }
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cnpj" className="text-xs font-semibold">
                  CNPJ
                </Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                  maxLength={18}
                  className="rounded-xl font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  E-mail institucional
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contato@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefone" className="text-xs font-semibold">
                  Telefone comercial
                </Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(maskTelefone(e.target.value))}
                  maxLength={15}
                  className="rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="border-t border-border/80 pt-3">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                Endereço da sede / base operacional
                {isLoadingCep && <span className="text-[10px] text-primary font-normal animate-pulse">(consultando CEP...)</span>}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cep" className="text-xs font-semibold">
                    CEP
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
                {selectedMatrizParaFilial || !isSuperAdmin ? "Cadastrar filial" : "Cadastrar transportadora"}
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
            ? `Tem certeza que deseja desativar "${statusModalEmpresa?.empresa.nome_empresa}"? Os gestores e motoristas vinculados a esta unidade não conseguirão iniciar novas operações enquanto estiver inativa.`
            : `Deseja reativar o acesso de "${statusModalEmpresa?.empresa.nome_empresa}" à plataforma?`
        }
        confirmText={statusModalEmpresa?.nextStatus === "inativo" ? "Sim, desativar" : "Sim, ativar"}
        cancelText="Cancelar"
        variant={statusModalEmpresa?.nextStatus === "inativo" ? "destructive" : "default"}
        onConfirm={handleConfirmStatus}
        isLoading={isAlterandoStatus}
      />
    </div>
  );
}
