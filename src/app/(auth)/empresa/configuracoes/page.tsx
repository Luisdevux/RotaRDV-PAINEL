// src/app/(auth)/empresa/configuracoes/page.tsx

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SafeImage } from "@/components/ui/safe-image";
import { useAuth, useEmpresa, useEquipeAdministrativa, useViaCep, useDebounce } from "@/hooks";
import { useActiveEmpresa } from "@/providers/ActiveEmpresaProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCNPJ, formatCPF, formatTelefone } from "@/lib/formatters";
import { maskTelefone, maskCEP, maskUF, unmask } from "@/lib/masks";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  UploadCloud, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Search,
  Users,
  ShieldCheck,
  Shield,
  Briefcase,
  UserPlus,
  Edit3,
  Info
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Usuario, CriarMembroAdministrativoInput, AtualizarMembroAdministrativoInput } from "@/types";
import { MembroNovoModal } from "@/app/(auth)/administrativo/components/MembroNovoModal";
import { MembroEditModal } from "@/app/(auth)/administrativo/components/MembroEditModal";

const empresaConfigSchema = z.object({
  nome_empresa: z.string().min(2, "Nome da empresa é obrigatório"),
  email: z.string().email("E-mail corporativo inválido"),
  telefone: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

type EmpresaConfigValues = z.infer<typeof empresaConfigSchema>;

export default function EmpresaConfiguracoesPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "equipe" ? "equipe" : "dados";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const { user: authUser, isAdmin, isSuperAdmin, isGestor } = useAuth();
  const { empresa, refreshEmpresa, isLoadingEmpresas } = useActiveEmpresa();
  const { atualizarEmpresa, isAtualizando, uploadFoto, isUploadingFoto, deletarFoto, isDeletandoFoto } = useEmpresa();
  const { consultarCep, isLoadingCep } = useViaCep();

  // Estados da Logo
  const [deleteLogoModalOpen, setDeleteLogoModalOpen] = useState(false);

  // Estados da Equipe Administrativa
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [roleFilter, setRoleFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [page, setPage] = useState(1);
  const [limite, setLimite] = useState(10);

  const [modalNovoOpen, setModalNovoOpen] = useState(false);
  const [editingMembro, setEditingMembro] = useState<Usuario | null>(null);
  const [statusModalMembro, setStatusModalMembro] = useState<{ membro: Usuario; nextStatus: "ativo" | "inativo" } | null>(null);

  const {
    membros,
    isLoading: isLoadingEquipe,
    cadastrarMembro,
    isCadastrando,
    atualizarMembro,
    isAtualizando: isAtualizandoMembro,
    alterarStatusMembro,
    isAlterandoStatus,
  } = useEquipeAdministrativa({ roleFilter, statusFilter });

  // Formulário de Dados Cadastrais
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EmpresaConfigValues>({
    resolver: zodResolver(empresaConfigSchema),
    defaultValues: {
      nome_empresa: "",
      email: "",
      telefone: "",
      cep: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
    },
  });

  useEffect(() => {
    if (empresa) {
      reset({
        nome_empresa: empresa.nome_empresa || "",
        email: empresa.email || "",
        telefone: maskTelefone(empresa.telefone || ""),
        cep: maskCEP(empresa.endereco?.cep || ""),
        logradouro: empresa.endereco?.logradouro || "",
        numero: empresa.endereco?.numero || "",
        bairro: empresa.endereco?.bairro || "",
        cidade: empresa.endereco?.cidade || "",
        estado: maskUF(empresa.endereco?.estado || ""),
      });
    }
  }, [empresa, reset]);

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const masked = maskCEP(rawVal);
    setValue("cep", masked);

    const clean = unmask(rawVal);
    if (clean.length === 8) {
      consultarCep(clean, (end) => {
        setValue("logradouro", end.logradouro, { shouldValidate: true });
        setValue("bairro", end.bairro, { shouldValidate: true });
        setValue("cidade", end.cidade, { shouldValidate: true });
        setValue("estado", end.estado, { shouldValidate: true });
      });
    }
  };

  const handleCepBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const clean = unmask(e.target.value);
    if (clean.length === 8) {
      consultarCep(clean, (end) => {
        setValue("logradouro", end.logradouro, { shouldValidate: true });
        setValue("bairro", end.bairro, { shouldValidate: true });
        setValue("cidade", end.cidade, { shouldValidate: true });
        setValue("estado", end.estado, { shouldValidate: true });
      });
    }
  };

  const onSaveEmpresa = async (data: EmpresaConfigValues) => {
    await atualizarEmpresa({
      nome_empresa: data.nome_empresa,
      email: data.email,
      telefone: data.telefone ? unmask(data.telefone) : undefined,
      endereco: {
        cep: data.cep ? unmask(data.cep) : undefined,
        logradouro: data.logradouro,
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado ? data.estado.toUpperCase() : undefined,
      },
    });
    await refreshEmpresa();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFoto(file);
      await refreshEmpresa();
    }
  };

  const handleConfirmDeleteLogo = async () => {
    await deletarFoto();
    await refreshEmpresa();
    setDeleteLogoModalOpen(false);
  };

  // Filtragem da Equipe
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

  const handleCreateMember = async (data: CriarMembroAdministrativoInput) => {
    await cadastrarMembro(data);
    setModalNovoOpen(false);
  };

  const handleEditMember = async (data: AtualizarMembroAdministrativoInput) => {
    if (!editingMembro) return;
    await atualizarMembro({
      id: editingMembro._id,
      data,
    });
    setEditingMembro(null);
  };

  const handleConfirmStatusMember = async () => {
    if (!statusModalMembro) return;
    await alterarStatusMembro({
      id: statusModalMembro.membro._id,
      status: statusModalMembro.nextStatus,
    });
    setStatusModalMembro(null);
  };

  const canEditCompany = isAdmin;
  const canManageTeam = isAdmin;

  return (
    <div className="max-w-6xl space-y-6 animate-fade-in pb-8">
      {/* Header Informativo da Empresa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-2xl border border-border flex items-center justify-center overflow-hidden bg-muted/50 shadow-inner shrink-0">
            <SafeImage
              src={empresa?.foto_logo || ""}
              alt={empresa?.nome_empresa || "Logotipo"}
              fill
              className="object-cover"
              fallbackType="building"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                {empresa?.nome_empresa || "Minha Transportadora"}
              </h1>
              {empresa?.status === "ativo" ? (
                <Badge variant="success" className="h-5 px-2 text-[10px]">Ativa</Badge>
              ) : (
                <Badge variant="destructive" className="h-5 px-2 text-[10px]">Inativa</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              CNPJ: {formatCNPJ(empresa?.cnpj) || "Não informado"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Badge variant="outline" className="px-3 py-1 text-xs border-primary/30 text-primary font-semibold">
            {isSuperAdmin ? "Visão Global" : (isAdmin ? "Administrador Geral" : "Gestor de Frota")}
          </Badge>
        </div>
      </div>

      {/* Navegação por Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/70 p-1 rounded-xl h-11 border border-border/70">
          <TabsTrigger value="dados" className="rounded-lg gap-2 font-semibold text-xs sm:text-sm px-4">
            <Building2 className="h-4 w-4" />
            Dados Cadastrais & Logo
          </TabsTrigger>
          <TabsTrigger value="equipe" className="rounded-lg gap-2 font-semibold text-xs sm:text-sm px-4">
            <Users className="h-4 w-4" />
            Equipe Administrativa ({membros.length})
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* ABA 1: DADOS CADASTRAIS & LOGOTIPO                                        */}
        {/* ========================================================================= */}
        <TabsContent value="dados" className="space-y-6">
          {/* Card de Logotipo */}
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-primary" />
                Logotipo Corporativo
              </CardTitle>
              <CardDescription className="text-xs">
                Esta imagem é exibida no aplicativo dos motoristas e nos relatórios de auditoria.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative h-24 w-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/40 shadow-inner">
                <SafeImage
                  src={empresa?.foto_logo || ""}
                  alt={empresa?.nome_empresa || "Logotipo"}
                  fill
                  className="object-cover"
                  fallbackType="building"
                />
              </div>

              <div className="space-y-2 text-center sm:text-left">
                {canEditCompany ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer">
                      <Input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={isUploadingFoto}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1.5 text-xs font-semibold"
                        disabled={isUploadingFoto}
                        asChild
                      >
                        <span>
                          {isUploadingFoto ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UploadCloud className="h-3.5 w-3.5" />
                          )}
                          {empresa?.foto_logo ? "Alterar Logotipo" : "Enviar Logotipo"}
                        </span>
                      </Button>
                    </label>

                    {empresa?.foto_logo && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteLogoModalOpen(true)}
                        disabled={isDeletandoFoto}
                        className="rounded-xl gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Alteração de logotipo restrita a Administradores.
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Formatos permitidos: JPG, PNG até 5MB. Dimensão recomendada: 400x400px.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Modal de confirmação de exclusão do logotipo */}
          <ConfirmDialog
            open={deleteLogoModalOpen}
            onOpenChange={setDeleteLogoModalOpen}
            title="Remover Logotipo Corporativo"
            description="Tem certeza que deseja remover o logotipo da empresa? Essa ação não pode ser desfeita."
            confirmText="Sim, remover"
            cancelText="Cancelar"
            variant="destructive"
            onConfirm={handleConfirmDeleteLogo}
          />

          {/* Formulário de Dados Cadastrais */}
          <form onSubmit={handleSubmit(onSaveEmpresa)}>
            <Card className="rounded-2xl border-border/80 shadow-sm">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Informações Cadastrais da Sede
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Endereço, contato e dados de identificação da empresa.
                    </CardDescription>
                  </div>
                  {!canEditCompany && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Modo somente leitura (Gestor)
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome_empresa">Nome / Razão Social</Label>
                    <Input
                      id="nome_empresa"
                      className="rounded-xl"
                      maxLength={100}
                      disabled={!canEditCompany}
                      {...register("nome_empresa")}
                    />
                    {errors.nome_empresa && (
                      <p className="text-xs text-destructive">{errors.nome_empresa.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail de Contato Operacional</Label>
                    <Input
                      id="email"
                      type="email"
                      className="rounded-xl"
                      maxLength={100}
                      disabled={!canEditCompany}
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                    <Input
                      id="telefone"
                      placeholder="(00) 00000-0000"
                      className="rounded-xl"
                      maxLength={15}
                      disabled={!canEditCompany}
                      {...register("telefone", {
                        onChange: (e) => setValue("telefone", maskTelefone(e.target.value)),
                      })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="cep">CEP</Label>
                      {isLoadingCep && (
                        <span className="text-[11px] text-primary flex items-center gap-1 font-medium animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Buscando...
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="cep"
                        placeholder="00000-000"
                        className="rounded-xl pr-9 font-mono"
                        maxLength={9}
                        disabled={!canEditCompany}
                        {...register("cep")}
                        onChange={handleCepChange}
                        onBlur={handleCepBlur}
                      />
                      <div className="absolute right-3 top-2.5 text-muted-foreground pointer-events-none">
                        {isLoadingCep ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Search className="h-4 w-4 text-muted-foreground/60" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="logradouro">Logradouro / Rua</Label>
                    <Input
                      id="logradouro"
                      placeholder="Av. das Nações"
                      className="rounded-xl"
                      maxLength={120}
                      disabled={!canEditCompany}
                      {...register("logradouro")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      placeholder="1000"
                      className="rounded-xl"
                      maxLength={20}
                      disabled={!canEditCompany}
                      {...register("numero")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      placeholder="Distrito Industrial"
                      className="rounded-xl"
                      maxLength={80}
                      disabled={!canEditCompany}
                      {...register("bairro")}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="estado">UF (Estado)</Label>
                    <Input
                      id="estado"
                      placeholder="SP"
                      maxLength={2}
                      className="rounded-xl uppercase font-mono"
                      disabled={!canEditCompany}
                      {...register("estado", {
                        onChange: (e) => setValue("estado", maskUF(e.target.value)),
                      })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      placeholder="São Paulo"
                      className="rounded-xl"
                      maxLength={80}
                      disabled={!canEditCompany}
                      {...register("cidade")}
                    />
                  </div>
                </div>
              </CardContent>

              {canEditCompany && (
                <CardFooter className="flex justify-end border-t border-border/60 pt-4">
                  <Button
                    type="submit"
                    variant="default"
                    disabled={isAtualizando}
                    className="rounded-xl font-bold gap-2 shadow-md"
                  >
                    {isAtualizando ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando alterações...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Salvar Alterações Cadastrais
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </form>
        </TabsContent>

        {/* ========================================================================= */}
        {/* ABA 2: EQUIPE ADMINISTRATIVA & GESTORES                                   */}
        {/* ========================================================================= */}
        <TabsContent value="equipe" className="space-y-6">
          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/60 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Gestão de Administradores & Gestores
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Membros da equipe com permissão para gerenciar frota, motoristas e despesas desta empresa.
                  </CardDescription>
                </div>

                {canManageTeam && (
                  <Button
                    onClick={() => setModalNovoOpen(true)}
                    className="rounded-xl gap-2 font-bold shadow-md self-start sm:self-center"
                    size="sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    Novo Membro
                  </Button>
                )}
              </div>

              {!canManageTeam && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 border border-border/60 text-xs text-muted-foreground">
                  <Info className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    Como Gestor, você pode visualizar os colegas da equipe. Apenas Administradores podem cadastrar, inativar ou alterar permissões de membros.
                  </span>
                </div>
              )}

              {/* Filtros e Busca */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-4 pt-4 border-t border-border/40">
                <div className="sm:col-span-6 relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email, CPF ou cargo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-3">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue placeholder="Nível de Acesso" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl text-xs">
                      <SelectItem value="todos">Todos os Níveis</SelectItem>
                      <SelectItem value="admin">Apenas Administradores</SelectItem>
                      <SelectItem value="gestor">Apenas Gestores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl text-xs">
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="ativo">Ativos</SelectItem>
                      <SelectItem value="inativo">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoadingEquipe ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Carregando equipe administrativa...</p>
                </div>
              ) : displayedTeam.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
                  <Users className="h-10 w-10 text-muted-foreground/50" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Nenhum membro encontrado</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tente alterar os termos de busca ou filtros selecionados.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-[300px] text-xs font-bold">Membro</TableHead>
                        <TableHead className="text-xs font-bold">Contato</TableHead>
                        <TableHead className="text-xs font-bold">Cargo / Função</TableHead>
                        <TableHead className="text-xs font-bold">Nível</TableHead>
                        <TableHead className="text-xs font-bold">Status</TableHead>
                        {canManageTeam && <TableHead className="text-right text-xs font-bold pr-6">Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedTeam.map((membro) => {
                        const isSelf = String(membro._id) === String(authUser?.id);
                        const isItemAdmin = membro.role === "admin" || membro.isAdmin;

                        return (
                          <TableRow key={membro._id} className="hover:bg-muted/30 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border border-border shrink-0">
                                  <AvatarImage src={membro.foto_perfil} alt={membro.nome} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                    {membro.nome ? membro.nome.slice(0, 2).toUpperCase() : "MB"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-xs text-foreground truncate flex items-center gap-1.5">
                                    {membro.nome}
                                    {isSelf && (
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/40 text-primary">
                                        Você
                                      </Badge>
                                    )}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground font-mono truncate">
                                    {formatCPF(membro.cpf) || "CPF não cadastrado"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex flex-col text-xs space-y-0.5">
                                <span className="flex items-center gap-1.5 text-foreground">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  {membro.email}
                                </span>
                                {membro.telefone && (
                                  <span className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px]">
                                    <Phone className="h-3 w-3" />
                                    {formatTelefone(membro.telefone)}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                                <Briefcase className="h-3.5 w-3.5 text-primary" />
                                <span>{membro.empresa?.cargo || (isItemAdmin ? "Administrador Geral" : "Gestor de Frota")}</span>
                              </div>
                            </TableCell>

                            <TableCell>
                              {isItemAdmin ? (
                                <Badge variant="outline" className="rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold gap-1 text-[11px]">
                                  <ShieldCheck className="h-3 w-3" />
                                  Administrador
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold gap-1 text-[11px]">
                                  <Shield className="h-3 w-3" />
                                  Gestor
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell>
                              {membro.status === "ativo" ? (
                                <Badge variant="success" className="h-5 text-[10px]">Ativo</Badge>
                              ) : (
                                <Badge variant="destructive" className="h-5 text-[10px]">Inativo</Badge>
                              )}
                            </TableCell>

                            {canManageTeam && (
                              <TableCell className="text-right pr-6">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Inativar / Ativar */}
                                  {!isSelf && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className={`rounded-xl text-xs font-semibold gap-1 h-8 ${
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

                                  {/* Editar */}
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
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="p-4 border-t border-border/60">
                  <PaginationControls
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={totalDocs}
                    itemsPerPage={limite}
                    onPageChange={setPage}
                    onItemsPerPageChange={(l) => {
                      setLimite(l);
                      setPage(1);
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modais de Equipe */}
      <MembroNovoModal
        open={modalNovoOpen}
        onOpenChange={setModalNovoOpen}
        onSubmit={handleCreateMember}
        isLoading={isCadastrando}
      />

      <MembroEditModal
        open={Boolean(editingMembro)}
        onOpenChange={(open) => !open && setEditingMembro(null)}
        membro={editingMembro}
        isAdmin={isAdmin}
        onSubmit={handleEditMember}
        isLoading={isAtualizandoMembro}
      />

      <ConfirmDialog
        open={Boolean(statusModalMembro)}
        onOpenChange={(open) => !open && setStatusModalMembro(null)}
        title={statusModalMembro?.nextStatus === "ativo" ? "Ativar Membro" : "Inativar Membro"}
        description={`Tem certeza que deseja ${
          statusModalMembro?.nextStatus === "ativo" ? "ativar" : "inativar"
        } o acesso de ${statusModalMembro?.membro.nome}? ${
          statusModalMembro?.nextStatus === "inativo"
            ? "O usuário não conseguirá acessar o sistema até ser reativado."
            : "O usuário terá o acesso restabelecido ao painel."
        }`}
        confirmText={statusModalMembro?.nextStatus === "ativo" ? "Sim, ativar" : "Sim, inativar"}
        cancelText="Cancelar"
        variant={statusModalMembro?.nextStatus === "ativo" ? "default" : "destructive"}
        onConfirm={handleConfirmStatusMember}
      />
    </div>
  );
}

