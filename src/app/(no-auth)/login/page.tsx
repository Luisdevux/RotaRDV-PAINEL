// src/app/(no-auth)/login/page.tsx

"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

const LOGO_URL = process.env.NEXT_PUBLIC_APP_LOGO_URL || "https://rota-rdv.web.fslab.dev/7c4bb021-7946-44b4-acc2-cdb9c29aadc2.jpeg";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  senha: z.string().min(1, "A senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const { login, isLoggingIn, loginWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const [dismissedError, setDismissedError] = useState(false);
  const authError = dismissedError ? null : searchParams.get("error");

  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const clearError = () => {
    setDismissedError(true);
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    clearError();
    try {
      await login(data);
    } catch {
      // Notificado pelo hook
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Card className="border-border/80 shadow-2xl backdrop-blur-sm bg-card/90 rounded-2xl">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-bold text-center">Entrar no Painel</CardTitle>
        <CardDescription className="text-center text-xs">
          Acesso exclusivo para Gestores e Administradores
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {authError === "MotoristaRestrito" && (
          <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              Acesso Restrito ao Aplicativo Mobile!
            </p>
            <p className="leading-relaxed">
              Contas de <strong>Motorista</strong> devem utilizar exclusivamente o <strong>aplicativo móvel RotaRDV</strong> para registrar viagens e despesas. O painel web é restrito a Gestores.
            </p>
          </div>
        )}

        {authError && authError !== "MotoristaRestrito" && (
          <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium">
            Falha na autenticação. Verifique suas credenciais e permissões de acesso.
          </div>
        )}

        {/* Email + Password Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail corporativo</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="gestor@suatransportadora.com.br"
                className="pl-9 rounded-xl"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="senha">Senha</Label>
              <Link
                href="/esqueci-senha"
                className="text-xs text-primary hover:underline font-medium"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                className="pl-9 rounded-xl"
                {...register("senha")}
              />
            </div>
            {errors.senha && (
              <p className="text-xs text-destructive">{errors.senha.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="default"
            className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                Acessar Painel
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="relative pt-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-card px-2 text-muted-foreground font-semibold">
              ou continue com
            </span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-xl border-border hover:bg-muted font-semibold flex items-center justify-center gap-2"
          onClick={handleGoogleLogin}
          disabled={googleLoading || isLoggingIn}
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
          )}
          Entrar com o Google
        </Button>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 pt-2 border-t border-border/60">
        <p className="text-xs text-center text-muted-foreground">
          É uma nova transportadora?{" "}
          <Link href="/cadastro" className="text-primary font-bold hover:underline">
            Cadastre sua empresa
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-card to-background">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-border shadow-xl bg-black/20">
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
            Rota<span className="text-primary">RDV</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Painel de Gestão de Frotas & Auditoria de Despesas
          </p>
        </div>

        {/* Login Form with Suspense */}
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
          <LoginFormContent />
        </Suspense>
      </div>
    </div>
  );
}
