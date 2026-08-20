// src/app/(no-auth)/esqueci-senha/page.tsx

"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { Mail, ArrowLeft, Send, Loader2, CheckCircle } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-card to-background">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Header Logo */}
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
            Recuperação de Senha
          </h1>
          <p className="text-xs text-muted-foreground">
            Enviaremos um link de redefinição para o seu e-mail cadastrado
          </p>
        </div>

        <Card className="border-border/80 shadow-2xl backdrop-blur-sm bg-card/90 rounded-2xl">
          {enviado ? (
            <CardContent className="space-y-4 pt-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Verifique sua Caixa de Entrada</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enviamos um e-mail com as instruções para redefinir sua senha. O link expira em 1 hora.
              </p>
              <div className="pt-2">
                <Button asChild variant="default" className="w-full rounded-xl">
                  <Link href="/login">Voltar ao Login</Link>
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold">Esqueceu sua senha?</CardTitle>
                <CardDescription className="text-xs">
                  Digite seu e-mail corporativo abaixo para receber as instruções.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
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

                <Button
                  type="submit"
                  variant="default"
                  className="w-full h-11 rounded-xl font-bold gap-2 shadow-lg shadow-primary/20"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Link de Recuperação
                    </>
                  )}
                </Button>
              </CardContent>

              <CardFooter className="border-t border-border/60 pt-4 flex justify-center">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar para o Login
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
