// src/app/(auth)/empresa/configuracoes/page.tsx

"use client";

import React, { useState } from "react";
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
  const { atualizarEmpresa, isAtualizando, uploadFoto, isUploadingFoto, deletarFoto, isDeletandoFoto } = useEmpresa();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteLogoModalOpen, setDeleteLogoModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EmpresaConfigValues>({
    resolver: zodResolver(empresaConfigSchema),
    values: {
      nome_empresa: empresa?.nome_empresa || "",
      email: empresa?.email || "",
      telefone: maskTelefone(empresa?.telefone || ""),
      cep: maskCEP(empresa?.endereco?.cep || ""),
      logradouro: empresa?.endereco?.logradouro || "",
      numero: empresa?.endereco?.numero || "",
      bairro: empresa?.endereco?.bairro || "",
      cidade: empresa?.endereco?.cidade || "",
      estado: maskUF(empresa?.endereco?.estado || ""),
    },
  });

  const onSubmit = async (data: EmpresaConfigValues) => {
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
      setSelectedFile(file);
      await uploadFoto(file);
      await refreshEmpresa();
    }
  };

  const handleConfirmDeleteLogo = async () => {
    await deletarFoto();
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="rounded-2xl border-border/80 shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                  maxLength={100}
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
                  {...register("telefone", {
                    onChange: (e) => setValue("telefone", maskTelefone(e.target.value)),
                  })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  className="rounded-xl"
                  maxLength={9}
                  {...register("cep", {
                    onChange: (e) => setValue("cep", maskCEP(e.target.value)),
                  })}
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
                  maxLength={120}
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
