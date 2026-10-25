// src/app/(no-auth)/redefinir-senha/page.tsx

"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SafeImage } from "@/components/ui/safe-image";
import { Lock, KeyRound, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const LOGO_URL = process.env.NEXT_PUBLIC_APP_LOGO_URL || "https://rota-rdv.web.fslab.dev/7c4bb021-7946-44b4-acc2-cdb9c29aadc2.jpeg";

const redefinirSchema = z.object({
  token: z.string().trim().min(1, "Informe o token de recuperação enviado por e-mail"),
  senha: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Use maiúscula, minúscula, número e símbolo (@$!%*?&)"
    ),
  confirmarSenha: z.string().min(8, "Confirme sua senha"),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type RedefinirFormValues = z.infer<typeof redefinirSchema>;

function RedefinirSenhaContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") || "";
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RedefinirFormValues>({
    resolver: zodResolver(redefinirSchema),
    defaultValues: {
      token: initialToken,
    },
  });

  const onSubmit = async (data: RedefinirFormValues) => {
    setLoading(true);
    try {
      await authService.redefinirSenha({
        token: data.token.trim(),
        senha: data.senha,
      });
      setSucesso(true);
      toast.success("Senha redefinida com sucesso!");
    } catch (error: any) {
      toast.error(error.friendlyMessage || "Código inválido ou expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg border border-border">
      {/* Header integrado ao Card */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-border shadow-sm bg-muted/20 mb-2">
          <SafeImage
            src={LOGO_URL}
            alt="RotaRDV Logo"
            fill
            className="object-cover"
            priority
            fallbackType="building"
          />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Nova Senha</h1>
        <p className="text-muted-foreground text-sm">
          Informe o token de recuperação recebido por e-mail e crie uma nova senha
        </p>
      </div>

      {sucesso ? (
        <div className="flex flex-col items-center text-center space-y-4 py-4 animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/30 text-primary flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Senha atualizada com sucesso!</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sua nova senha foi salva. Você já pode fazer login normalmente na plataforma.
          </p>
          <Button asChild className="w-full h-11 text-base font-bold mt-4 cursor-pointer active:scale-95 transition-all">
            <Link href="/login">Ir para o Login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="token" className="cursor-pointer">Token de recuperação</Label>
            <div className="relative group">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="token"
                type="text"
                placeholder="Cole ou digite o token de recuperação"
                className="pl-11 h-11 text-xs"
                {...register("token")}
              />
            </div>
            {errors.token && (
              <p className="text-xs text-destructive">{errors.token.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="senha" title="Senha" className="cursor-pointer">Nova Senha</Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="senha"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-11 pr-12 h-11"
                {...register("senha")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                tabIndex={-1}
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.senha && (
              <p className="text-xs text-destructive">{errors.senha.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmarSenha" title="Confirmar Senha" className="cursor-pointer">Confirmar Nova Senha</Label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="confirmarSenha"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-11 pr-12 h-11"
                {...register("confirmarSenha")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                tabIndex={-1}
                title={showConfirmPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmarSenha && (
              <p className="text-xs text-destructive">{errors.confirmarSenha.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-base font-bold mt-2 cursor-pointer active:scale-95 transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Atualizando senha...
              </span>
            ) : (
              "Redefinir Senha"
            )}
          </Button>
        </form>
      )}

      <div className="pt-2 text-center">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
        <RedefinirSenhaContent />
      </Suspense>
    </main>
  );
}
