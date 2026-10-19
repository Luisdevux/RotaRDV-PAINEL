// src/app/(no-auth)/esqueci-senha/page.tsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SafeImage } from "@/components/ui/safe-image";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const LOGO_URL = process.env.NEXT_PUBLIC_APP_LOGO_URL || "https://rota-rdv.web.fslab.dev/7c4bb021-7946-44b4-acc2-cdb9c29aadc2.jpeg";

const esqueciSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
});

type EsqueciFormValues = z.infer<typeof esqueciSchema>;

export default function EsqueciSenhaPage() {
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EsqueciFormValues>({
    resolver: zodResolver(esqueciSchema),
  });

  const onSubmit = async (data: EsqueciFormValues) => {
    setLoading(true);
    try {
      await authService.recuperarSenha(data);
      setEnviado(true);
      toast.success("Instruções enviadas para seu e-mail!");
    } catch (error: any) {
      toast.error(error.friendlyMessage || "Erro ao solicitar recuperação de senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
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
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Recuperar Senha</h1>
          <p className="text-muted-foreground text-sm">
            Informe o e-mail corporativo da sua conta para receber as instruções de recuperação.
          </p>
        </div>

        {enviado ? (
          <div className="flex flex-col items-center text-center space-y-4 py-4 animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/30 text-primary flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Verifique sua caixa de entrada</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enviamos um e-mail com as instruções para redefinir sua senha. O link expira em 1 hora.
            </p>
            <Button asChild className="w-full h-11 text-base font-bold mt-4 cursor-pointer active:scale-95 transition-all">
              <Link href="/login">Voltar para o Login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="cursor-pointer">E-mail corporativo</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="gestor@suatransportadora.com.br"
                  className="pl-11 h-11"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
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
                  Enviando instruções...
                </span>
              ) : (
                "Enviar Instruções"
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
    </main>
  );
}
