// src/app/(auth)/perfil/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usuarioService } from "@/services/usuarioService";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { maskCPF, maskCNH, maskTelefone, unmask } from "@/lib/masks";
import { 
  User, 
  UploadCloud, 
  Loader2, 
  CheckCircle2 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const perfilSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  telefone: z.string().optional(),
  cpf: z.string().optional(),
  cnh: z.string().optional(),
  cargo: z.string().optional(),
});

type PerfilFormValues = z.infer<typeof perfilSchema>;

export default function PerfilPage() {
  const { user, isAdmin, updateSession } = useAuth();
  const [uploading, setUploading] = useState(false);

  // Busca os dados atualizados e completos do usuário diretamente na API
  const { data: usuarioData, isLoading: isLoadingPerfil, refetch } = useQuery({
    queryKey: ["perfil", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return await usuarioService.buscarPorID(user.id);
    },
    enabled: Boolean(user?.id),
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      cpf: "",
      cnh: "",
      cargo: "",
    },
  });

  // Atualiza os valores do formulário com os dados carregados da API ou da sessão
  useEffect(() => {
    if (usuarioData) {
      reset({
        nome: usuarioData.nome || user?.name || "",
        telefone: maskTelefone(usuarioData.telefone || user?.telefone || ""),
        cpf: maskCPF(usuarioData.cpf || user?.cpf || ""),
        cnh: maskCNH(usuarioData.cnh || (user as any)?.cnh || ""),
        cargo: usuarioData.role || user?.role || "",
      });
    } else if (user) {
      reset({
        nome: user.name || "",
        telefone: maskTelefone(user.telefone || ""),
        cpf: maskCPF(user.cpf || ""),
        cnh: maskCNH((user as any)?.cnh || ""),
        cargo: user.role || "",
      });
    }
  }, [usuarioData, user, reset]);

  const onSubmit = async (data: PerfilFormValues) => {
    if (!user?.id) return;
    try {
      const cleanCpf = data.cpf ? unmask(data.cpf) : undefined;
      const cleanCnh = data.cnh ? unmask(data.cnh) : undefined;
      const cleanTelefone = data.telefone ? unmask(data.telefone) : undefined;

      await usuarioService.atualizar(user.id, {
        nome: data.nome,
        telefone: cleanTelefone,
        cpf: cleanCpf,
        cnh: cleanCnh,
      });
      toast.success("Perfil atualizado com sucesso!");
      await refetch();
      await updateSession();
    } catch (error: any) {
      toast.error(error.friendlyMessage || "Erro ao atualizar perfil.");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
      setUploading(true);
      try {
        await usuarioService.uploadFoto(user.id, file);
        toast.success("Foto de perfil atualizada!");
        await refetch();
        await updateSession();
      } catch (error: any) {
        toast.error(error.friendlyMessage || "Erro ao enviar foto.");
      } finally {
        setUploading(false);
      }
    }
  };

  const fotoPerfilAtual = usuarioData?.foto_perfil || user?.image || "";

  const renderRoleBadge = () => {
    const role = usuarioData?.role || user?.role;
    switch (role) {
      case "superAdmin":
        return (
          <Badge variant="destructive" className="rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-bold px-2.5 py-1 text-xs">
            Super Administrador
          </Badge>
        );
      case "admin":
        return (
          <Badge variant="outline" className="rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold px-2.5 py-1 text-xs">
            Administrador
          </Badge>
        );
      case "gestor":
        return (
          <Badge variant="outline" className="rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold px-2.5 py-1 text-xs">
            Gestor
          </Badge>
        );
      case "motorista":
        return (
          <Badge variant="outline" className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold px-2.5 py-1 text-xs">
            Motorista
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="rounded-md text-muted-foreground border-border capitalize px-2.5 py-1 text-xs">
            {role || "Usuário"}
          </Badge>
        );
    }
  };

  const getCargoLabel = () => {
    const role = usuarioData?.role || user?.role;
    switch (role) {
      case "superAdmin":
        return "Super Administrador (Global)";
      case "admin":
        return "Administrador Geral da Empresa";
      case "gestor":
        return "Gestor de Frotas";
      case "motorista":
        return "Motorista";
      default:
        return "Usuário";
    }
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <Card className="rounded-2xl border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informações Pessoais
              </CardTitle>
              <CardDescription className="text-xs">
                Seus dados cadastrais e foto de perfil na plataforma RotaRDV.
              </CardDescription>
            </div>
            {renderRoleBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-muted/30 border border-border/60">
            <Avatar className="h-20 w-20 border-2 border-border shadow-md">
              <AvatarImage src={fotoPerfilAtual} alt={user?.name || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground font-black text-xl">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "RD"}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2 text-center sm:text-left">
              <label className="cursor-pointer">
                <Input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 text-xs font-semibold"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="h-3.5 w-3.5" />
                    )}
                    Alterar Foto de Perfil
                  </span>
                </Button>
              </label>
              <p className="text-[11px] text-muted-foreground">
                Formatos permitidos: JPG, PNG até 5MB.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input 
                  id="nome" 
                  className="rounded-xl" 
                  maxLength={80}
                  {...register("nome")} 
                />
                {errors.nome && (
                  <p className="text-xs text-destructive">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail (Não editável)</Label>
                <Input
                  id="email"
                  type="email"
                  value={usuarioData?.email || user?.email || ""}
                  disabled
                  className="rounded-xl opacity-70 bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Input 
                  id="cpf" 
                  placeholder="000.000.000-00" 
                  className="rounded-xl" 
                  maxLength={14}
                  {...register("cpf", {
                    onChange: (e) => setValue("cpf", maskCPF(e.target.value)),
                  })} 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cnh">CNH (Habilitação)</Label>
                <Input 
                  id="cnh" 
                  placeholder="00000000000" 
                  className="rounded-xl" 
                  maxLength={11}
                  {...register("cnh", {
                    onChange: (e) => setValue("cnh", maskCNH(e.target.value)),
                  })} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone</Label>
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
                <Label htmlFor="cargo">Cargo / Função (Não editável)</Label>
                <Input
                  id="cargo"
                  value={getCargoLabel()}
                  disabled
                  className="rounded-xl opacity-70 bg-muted font-medium"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting || isLoadingPerfil}
                className="rounded-xl font-bold gap-2 shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Atualizar Meus Dados
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
