// src/app/(auth)/perfil/page.tsx

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { usuarioService } from "@/services/usuarioService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCPF } from "@/lib/formatters";
import { 
  User, 
  Mail, 
  Phone, 
  FileText, 
  ShieldCheck, 
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
  cargo: z.string().optional(),
});

type PerfilFormValues = z.infer<typeof perfilSchema>;

export default function PerfilPage() {
  const { user, isAdmin, updateSession } = useAuth();
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    values: {
      nome: user?.name || "",
      telefone: "",
      cpf: "",
      cargo: user?.role || "",
    },
  });

  const onSubmit = async (data: PerfilFormValues) => {
    if (!user?.id) return;
    try {
      await usuarioService.atualizar(user.id, {
        nome: data.nome,
        telefone: data.telefone,
        cpf: data.cpf ? data.cpf.replace(/\D/g, "") : undefined,
        cargo: data.cargo,
      });
      toast.success("Perfil atualizado com sucesso!");
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
        await usuarioService.uploadFotoPerfil(user.id, file);
        toast.success("Foto de perfil atualizada!");
        await updateSession();
      } catch (error: any) {
        toast.error(error.friendlyMessage || "Erro ao enviar foto.");
      } finally {
        setUploading(false);
      }
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
            {isAdmin ? (
              <Badge variant="destructive">Super Administrador</Badge>
            ) : (
              <Badge variant="outline" className="text-primary border-primary/30 capitalize">
                {user?.role || "Gestor"}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-muted/30 border border-border/60">
            <Avatar className="h-20 w-20 border-2 border-border shadow-md">
              <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
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
                <Input id="nome" className="rounded-xl" {...register("nome")} />
                {errors.nome && (
                  <p className="text-xs text-destructive">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail (Não editável)</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="rounded-xl opacity-70 bg-muted"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Input id="cpf" placeholder="000.000.000-00" className="rounded-xl" {...register("cpf")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" placeholder="(11) 98888-7777" className="rounded-xl" {...register("telefone")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cargo">Cargo / Função</Label>
                <Input id="cargo" placeholder="Ex: Gestor de Frota" className="rounded-xl" {...register("cargo")} />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting}
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
