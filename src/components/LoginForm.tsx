// src/components/LoginForm.tsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SafeImage } from "@/components/ui/safe-image";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

const LOGO_URL = process.env.NEXT_PUBLIC_APP_LOGO_URL || "https://rota-rdv.web.fslab.dev/7c4bb021-7946-44b4-acc2-cdb9c29aadc2.jpeg";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  senha: z.string().min(1, "A senha é obrigatória"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { login, isLoggingIn, loginWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const [dismissedError, setDismissedError] = useState(false);
  const authError = dismissedError ? null : searchParams.get("error");

  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const clearError = () => {
    setDismissedError(true);
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  const onSubmit = async (data: LoginData) => {
    clearError();
    try {
      await login(data);
    } catch {
      // Feedback tratado pelo hook useAuth
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

  const isSubmitting = isLoggingIn;

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-lg border border-border">
      {/* Header com Logo integrado ao Card */}
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
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Bem-vindo ao RotaRDV</h1>
        <p className="text-muted-foreground text-sm">Painel de gestão de frotas e auditoria de despesas</p>
      </div>

      {authError === "MotoristaRestrito" && (
        <div className="p-3.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs space-y-1">
          <p className="font-bold">Acesso restrito ao aplicativo mobile!</p>
          <p className="leading-relaxed">
            Contas de <strong>Motorista</strong> devem utilizar exclusivamente o <strong>aplicativo móvel RotaRDV</strong> para registrar viagens e despesas. O painel web é restrito a Gestores e Administradores.
          </p>
        </div>
      )}

      {authError && authError !== "MotoristaRestrito" && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium">
          Falha na autenticação. Verifique suas credenciais e permissões de acesso.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="cursor-pointer">E-mail corporativo</Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="email"
              {...register("email")}
              type="email"
              placeholder="email@suatransportadora.com.br"
              className="pl-11 h-11"
            />
          </div>
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="senha" title="Senha" className="cursor-pointer">Senha</Label>
            <Link 
              href="/esqueci-senha" 
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="senha"
              {...register("senha")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-11 pr-12 h-11"
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
          {errors.senha && <p className="text-destructive text-xs">{errors.senha.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 text-base font-bold mt-2 cursor-pointer active:scale-95 transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Entrando...
            </span>
          ) : "Entrar na Conta"}
        </Button>
      </form>

      <div className="relative flex items-center justify-center py-2">
        <div className="border-t border-border w-full"></div>
        <span className="absolute bg-card px-3 text-xs font-semibold text-muted-foreground">OU CONTINUE COM</span>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={googleLoading || isSubmitting}
        className="w-full h-11 text-base flex items-center justify-center gap-3 font-medium border-border hover:bg-muted/50 transition-all cursor-pointer active:scale-95"
      >
        {googleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/>
          </svg>
        )}
        Continuar com Google
      </Button>

      <p className="text-center text-sm text-muted-foreground mt-8">
        É uma nova transportadora?{" "}
        <Link href="/cadastro" className="text-primary font-bold hover:underline cursor-pointer">
          Cadastre sua empresa
        </Link>
      </p>
    </div>
  );
}
