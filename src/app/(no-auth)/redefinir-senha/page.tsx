// src/app/(no-auth)/redefinir-senha/page.tsx

"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const LOGO_URL = process.env.NEXT_PUBLIC_APP_LOGO_URL || "https://rota-rdv.web.fslab.dev/7c4bb021-7946-44b4-acc2-cdb9c29aadc2.jpeg";

const redefinirSchema = z.object({
  senha: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
  confirmarSenha: z.string().min(8, "Confirme sua senha"),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type RedefinirFormValues = z.infer<typeof redefinirSchema>;

function RedefinirSenhaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RedefinirFormValues>({
    resolver: zodResolver(redefinirSchema),
  });

  const onSubmit = async (data: RedefinirFormValues) => {
    if (!token) {
      toast.error("Token de redefinição não encontrado.");
      return;
    }

    setLoading(true);
    try {
      await authService.redefinirSenha({
        token,
        senha: data.senha,
      });
      setSucesso(true);
      toast.success("Senha redefinida com sucesso!");
    } catch (error: any) {
      toast.error(error.friendlyMessage || "Token inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-2xl backdrop-blur-sm bg-card/90 rounded-2xl">
      {sucesso ? (
        <CardContent className="space-y-4 pt-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Senha Atualizada!</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sua nova senha foi salva. Você já pode fazer login na plataforma.
          </p>
          <div className="pt-2">
            <Button asChild variant="default" className="w-full rounded-xl">
              <Link href="/login">Ir para o Login</Link>
            </Button>
          </div>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold">Criar Nova Senha</CardTitle>
            <CardDescription className="text-xs">
              Escolha uma senha forte com no mínimo 8 caracteres.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="senha">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="senha"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="pl-9 rounded-xl"
                  {...register("senha")}
                />
              </div>
              {errors.senha && (
                <p className="text-xs text-destructive">{errors.senha.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmarSenha"
                  type="password"
                  placeholder="Repita a nova senha"
                  className="pl-9 rounded-xl"
                  {...register("confirmarSenha")}
                />
              </div>
              {errors.confirmarSenha && (
                <p className="text-xs text-destructive">{errors.confirmarSenha.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="default"
              className="w-full h-11 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Nova Senha"
              )}
            </Button>
          </CardContent>
        </form>
      )}
    </Card>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-card to-background">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-border shadow-xl bg-black/20">
            <SafeImage
              src={LOGO_URL}
              alt="RotaRDV Logo"
              fill
              className="object-cover"
              priority
              fallbackType="building"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Redefinir Senha
          </h1>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
          <RedefinirSenhaContent />
        </Suspense>
      </div>
    </div>
  );
}
