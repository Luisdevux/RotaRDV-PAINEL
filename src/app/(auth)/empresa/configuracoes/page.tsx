// src/app/(auth)/empresa/configuracoes/page.tsx

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { useAuth, useEmpresa, useViaCep } from "@/hooks";
import { useActiveEmpresa } from "@/providers/ActiveEmpresaProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCNPJ } from "@/lib/formatters";
import { maskTelefone, maskCEP, maskUF, unmask } from "@/lib/masks";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  UploadCloud, 
  Trash2, 
  Loader2, 
  CheckCircle2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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

function EmpresaConfiguracoesContent() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { empresa, refreshEmpresa } = useActiveEmpresa();
  const { atualizarEmpresa, isAtualizando, uploadFoto, isUploadingFoto, deletarFoto, isDeletandoFoto } = useEmpresa();
  const { consultarCep, isLoadingCep } = useViaCep();

  // Estados da Logo
  const [deleteLogoModalOpen, setDeleteLogoModalOpen] = useState(false);

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
        telefone: empresa.telefone ? maskTelefone(empresa.telefone) : "",
        cep: empresa.endereco?.cep ? maskCEP(empresa.endereco.cep) : "",
        logradouro: empresa.endereco?.logradouro || "",
        numero: empresa.endereco?.numero || "",
        bairro: empresa.endereco?.bairro || "",
        cidade: empresa.endereco?.cidade || "",
        estado: empresa.endereco?.estado || "",
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFoto(file);
    await refreshEmpresa();
  };

  const handleConfirmDeleteLogo = async () => {
    await deletarFoto();
    await refreshEmpresa();
    setDeleteLogoModalOpen(false);
  };

  const onSubmitEmpresa = async (data: EmpresaConfigValues) => {
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
        estado: data.estado,
      },
    });
    await refreshEmpresa();
  };

  const canEditCompany = isAdmin;

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in pb-8">
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
            <h1 className="text-lg font-bold text-foreground">
              {empresa?.nome_empresa || "Minha Transportadora"}
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              CNPJ: {formatCNPJ(empresa?.cnpj) || "Não informado"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-xs border-primary/30 text-primary font-semibold">
            {isSuperAdmin ? "Visão global" : (isAdmin ? "Administrador geral" : "Gestor de frota")}
          </Badge>
        </div>
      </div>

      {/* Card de Logotipo */}
      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            Identidade visual da transportadora
          </CardTitle>
          <CardDescription className="text-xs">
            Logotipo exibido nos relatórios, comprovantes e no topo do painel.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-muted/30 border border-border/60">
            <div className="relative h-24 w-24 rounded-2xl border-2 border-border shadow-md overflow-hidden bg-background flex items-center justify-center shrink-0">
              <SafeImage
                src={empresa?.foto_logo || ""}
                alt={empresa?.nome_empresa || "Logotipo"}
                fill
                className="object-cover"
                fallbackType="building"
              />
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                {canEditCompany ? (
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
                        Alterar logotipo
                      </span>
                    </Button>
                  </label>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1.5 text-xs font-semibold"
                    disabled
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    Alterar logotipo
                  </Button>
                )}

                {empresa?.foto_logo && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="rounded-xl gap-1.5 text-xs font-semibold"
                    onClick={() => setDeleteLogoModalOpen(true)}
                    disabled={isDeletandoFoto || !canEditCompany}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remover logotipo
                  </Button>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground">
                Formatos recomendados: PNG ou JPG com proporção quadrada ou retangular limpa (até 5MB).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Dados Cadastrais e Endereço */}
      <form onSubmit={handleSubmit(onSubmitEmpresa)} className="space-y-6">
        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Informações cadastrais e contato
            </CardTitle>
            <CardDescription className="text-xs">
              Dados oficiais da empresa para emissão de relatórios e identificação.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Razão Social */}
              <div className="space-y-1.5">
                <Label htmlFor="nome_empresa" className="text-xs font-semibold">
                  Razão social / nome fantasia <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome_empresa"
                  {...register("nome_empresa")}
                  placeholder="Nome oficial da transportadora"
                  className="rounded-xl"
                  disabled={!canEditCompany}
                />
                {errors.nome_empresa && (
                  <p className="text-[11px] text-destructive font-medium">{errors.nome_empresa.message}</p>
                )}
              </div>

              {/* CNPJ (Read Only) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  CNPJ (registro principal)
                </Label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs font-mono font-bold text-foreground">
                  <span>{formatCNPJ(empresa?.cnpj) || "Não cadastrado"}</span>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-auto">Não editável</Badge>
                </div>
              </div>

              {/* E-mail Corporativo */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  E-mail corporativo <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="contato@transportadora.com.br"
                    className="pl-9 rounded-xl"
                    disabled={!canEditCompany}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-destructive font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Telefone */}
              <div className="space-y-1.5">
                <Label htmlFor="telefone" className="text-xs font-semibold">
                  Telefone de contato
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telefone"
                    {...register("telefone")}
                    placeholder="(11) 4002-8922"
                    className="pl-9 rounded-xl"
                    disabled={!canEditCompany}
                    onChange={(e) => {
                      setValue("telefone", maskTelefone(e.target.value));
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Endereço */}
        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Endereço da sede
            </CardTitle>
            <CardDescription className="text-xs">
              Localização física do escritório ou pátio principal da transportadora.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* CEP */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="cep" className="text-xs font-semibold flex items-center justify-between">
                  <span>CEP</span>
                  {isLoadingCep && <span className="text-[10px] text-primary flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Buscando...</span>}
                </Label>
                <Input
                  id="cep"
                  {...register("cep")}
                  placeholder="00000-000"
                  className="rounded-xl font-mono text-xs"
                  disabled={!canEditCompany}
                  onChange={handleCepChange}
                />
              </div>

              {/* Logradouro */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="logradouro" className="text-xs font-semibold">
                  Logradouro / rua / avenida
                </Label>
                <Input
                  id="logradouro"
                  {...register("logradouro")}
                  placeholder="Av. das Nações Unidas"
                  className="rounded-xl"
                  disabled={!canEditCompany}
                />
              </div>

              {/* Número */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="numero" className="text-xs font-semibold">
                  Número
                </Label>
                <Input
                  id="numero"
                  {...register("numero")}
                  placeholder="1000"
                  className="rounded-xl"
                  disabled={!canEditCompany}
                />
              </div>

              {/* Bairro */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="bairro" className="text-xs font-semibold">
                  Bairro
                </Label>
                <Input
                  id="bairro"
                  {...register("bairro")}
                  placeholder="Distrito Industrial"
                  className="rounded-xl"
                  disabled={!canEditCompany}
                />
              </div>

              {/* Cidade */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cidade" className="text-xs font-semibold">
                  Cidade
                </Label>
                <Input
                  id="cidade"
                  {...register("cidade")}
                  placeholder="São Paulo"
                  className="rounded-xl"
                  disabled={!canEditCompany}
                />
              </div>

              {/* Estado / UF */}
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="estado" className="text-xs font-semibold">
                  UF / estado
                </Label>
                <Input
                  id="estado"
                  {...register("estado")}
                  placeholder="SP"
                  maxLength={2}
                  className="rounded-xl uppercase font-mono text-xs"
                  disabled={!canEditCompany}
                  onChange={(e) => setValue("estado", maskUF(e.target.value))}
                />
              </div>
            </div>
          </CardContent>

          {canEditCompany && (
            <CardFooter className="flex justify-end pt-2 pb-6 px-6 border-t border-border/60">
              <Button
                type="submit"
                className="rounded-xl gap-2 font-bold px-6 shadow-md"
                disabled={isAtualizando}
              >
                {isAtualizando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando dados...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Salvar alterações cadastrais
                  </>
                )}
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>

      {/* Modal de Confirmação para Remoção de Logo */}
      <ConfirmDialog
        open={deleteLogoModalOpen}
        onOpenChange={setDeleteLogoModalOpen}
        title="Remover logotipo da empresa"
        description="Tem certeza que deseja remover o logotipo atual? A empresa voltará a utilizar o ícone corporativo padrão."
        confirmText="Sim, remover logotipo"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isDeletandoFoto}
        onConfirm={handleConfirmDeleteLogo}
      />
    </div>
  );
}

export default function EmpresaConfiguracoesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground text-xs">Carregando dados da empresa...</div>}>
      <EmpresaConfiguracoesContent />
    </Suspense>
  );
}
