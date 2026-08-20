// src/app/(auth)/empresa/configuracoes/page.tsx

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SafeImage } from "@/components/ui/safe-image";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useActiveEmpresa } from "@/providers/ActiveEmpresaProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCNPJ } from "@/lib/formatters";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  UploadCloud, 
  Trash2, 
  Loader2, 
  CheckCircle2,
  FileText
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

export default function EmpresaConfiguracoesPage() {
  const { empresa, refreshEmpresa } = useActiveEmpresa();
  const { atualizarEmpresa, isAtualizando, uploadLogo, isUploadingLogo, deletarLogo, isDeletandoLogo } = useEmpresa();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteLogoModalOpen, setDeleteLogoModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmpresaConfigValues>({
    resolver: zodResolver(empresaConfigSchema),
    values: {
      nome_empresa: empresa?.nome_empresa || "",
      email: empresa?.email || "",
      telefone: empresa?.telefone || "",
      cep: empresa?.endereco?.cep || "",
      logradouro: empresa?.endereco?.logradouro || "",
      numero: empresa?.endereco?.numero || "",
      bairro: empresa?.endereco?.bairro || "",
      cidade: empresa?.endereco?.cidade || "",
      estado: empresa?.endereco?.estado || "",
    },
  });

  const onSubmit = async (data: EmpresaConfigValues) => {
    await atualizarEmpresa({
      nome_empresa: data.nome_empresa,
      email: data.email,
      telefone: data.telefone,
      endereco: {
        cep: data.cep,
        logradouro: data.logradouro,
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
      },
    });
    await refreshEmpresa();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      await uploadLogo(file);
      await refreshEmpresa();
    }
  };

  const handleConfirmDeleteLogo = async () => {
    await deletarLogo();
    await refreshEmpresa();
    setDeleteLogoModalOpen(false);
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      {/* Logotipo da Empresa Card */}
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
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer">
                <Input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={isUploadingLogo}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 text-xs font-semibold"
                  disabled={isUploadingLogo}
                  asChild
                >
                  <span>
                    {isUploadingLogo ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="h-3.5 w-3.5" />
                    )}
                    Carregar Nova Imagem
                  </span>
                </Button>
              </label>

              {empresa?.foto_logo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs text-destructive hover:bg-destructive/10 gap-1.5"
                  onClick={() => setDeleteLogoModalOpen(true)}
                  disabled={isDeletandoLogo}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover Logo
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Formatos aceitos: JPG, PNG ou JPEG. Recomendado tamanho quadrado de no mínimo 300x300px.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Remoção de Logotipo */}
      <ConfirmDialog
        open={deleteLogoModalOpen}
        onOpenChange={setDeleteLogoModalOpen}
        title="Remover Logotipo da Transportadora"
        description="Tem certeza que deseja remover o logotipo corporativo? A identidade padrão do RotaRDV será exibida até que um novo arquivo seja carregado."
        confirmText="Sim, Remover Logo"
        cancelText="Cancelar"
        variant="destructive"
        isLoading={isDeletandoLogo}
        onConfirm={handleConfirmDeleteLogo}
      />

      {/* Dados Cadastrais Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Dados da Transportadora
                </CardTitle>
                <CardDescription className="text-xs">
                  Informações cadastrais e endereço da sede.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30">
                CNPJ: {formatCNPJ(empresa?.cnpj)}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome_empresa">Nome / Razão Social</Label>
                <Input
                  id="nome_empresa"
                  className="rounded-xl"
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
                  placeholder="(11) 3333-4444"
                  className="rounded-xl"
                  {...register("telefone")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  className="rounded-xl"
                  {...register("cep")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="logradouro">Logradouro / Rua</Label>
                <Input
                  id="logradouro"
                  placeholder="Av. das Nações"
                  className="rounded-xl"
                  {...register("logradouro")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  placeholder="1000"
                  className="rounded-xl"
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
                  {...register("estado")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="São Paulo"
                  className="rounded-xl"
                  {...register("cidade")}
                />
              </div>
            </div>
          </CardContent>

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
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
