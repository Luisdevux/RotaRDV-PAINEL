// src/app/(no-auth)/cadastro/page.tsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { maskCNPJ, maskCPF, maskTelefone, unmask, isValidCNPJ } from "@/lib/masks";
import { Building2, User, Lock, Mail, Phone, FileText, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

const LOGO_URL = process.env.NEXT_PUBLIC_APP_LOGO_URL || "https://rota-rdv.web.fslab.dev/7c4bb021-7946-44b4-acc2-cdb9c29aadc2.jpeg";

const signupSchema = z.object({
  nome_empresa: z.string().min(2, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(14, "CNPJ é obrigatório").refine((val) => isValidCNPJ(val), {
    message: "CNPJ inválido (suporta padrão numérico e alfanumérico oficial)",
  }),
  email_empresa: z.string().email("E-mail corporativo inválido"),
  telefone_empresa: z.string().optional(),
  
  // Gestor Master
  nome: z.string().min(2, "Nome do gestor é obrigatório"),
  email: z.string().email("E-mail do gestor inválido"),
  senha: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
  confirmarSenha: z.string().min(8, "Confirme sua senha"),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function CadastroPage() {
  const { signup, isSigningUp } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
  });

  const nextStep = async () => {
    const valid = await trigger(["nome_empresa", "cnpj", "email_empresa"]);
    if (valid) setStep(2);
  };

  const prevStep = () => setStep(1);

  const onSubmit = async (data: SignupFormValues) => {
    try {
      await signup({
        nome_empresa: data.nome_empresa,
        cnpj: unmask(data.cnpj).toUpperCase(),
        email_empresa: data.email_empresa,
        telefone_empresa: data.telefone_empresa ? unmask(data.telefone_empresa) : undefined,
        gestor: {
          nome: data.nome,
          email: data.email,
          senha: data.senha,
          cpf: data.cpf ? unmask(data.cpf) : undefined,
          telefone: data.telefone ? unmask(data.telefone) : undefined,
        },
      });
    } catch {
      // Notificado pelo hook
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-card to-background">
      <div className="w-full max-w-xl space-y-6 animate-fade-in py-8">
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
            Cadastro de Transportadora
          </h1>
          <p className="text-xs text-muted-foreground">
            Crie sua conta corporativa para gerenciar frotas, motoristas e despesas de viagem
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${step === 1 ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}>
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">1</span>
            Dados da Transportadora
          </div>
          <div className="h-px w-6 bg-border" />
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${step === 2 ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}>
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">2</span>
            Gestor Master
          </div>
        </div>

        {/* Signup Card */}
        <Card className="border-border/80 shadow-2xl backdrop-blur-sm bg-card/90 rounded-2xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 pt-6">
              {/* ETAPA 1: DADOS DA EMPRESA */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome_empresa">Razão Social / Nome da Transportadora</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="nome_empresa"
                        placeholder="Ex: TransLogística Rodoviária LTDA"
                        className="pl-9 rounded-xl"
                        maxLength={100}
                        {...register("nome_empresa")}
                      />
                    </div>
                    {errors.nome_empresa && (
                      <p className="text-xs text-destructive">{errors.nome_empresa.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="cnpj">CNPJ (Numérico ou Alfanumérico)</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="cnpj"
                          placeholder="00.000.000/0000-00"
                          className="pl-9 rounded-xl uppercase"
                          maxLength={18}
                          {...register("cnpj", {
                            onChange: (e) => setValue("cnpj", maskCNPJ(e.target.value)),
                          })}
                        />
                      </div>
                      {errors.cnpj && (
                        <p className="text-xs text-destructive">{errors.cnpj.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="telefone_empresa">Telefone Corporativo</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="telefone_empresa"
                          placeholder="(00) 00000-0000"
                          className="pl-9 rounded-xl"
                          maxLength={15}
                          {...register("telefone_empresa", {
                            onChange: (e) => setValue("telefone_empresa", maskTelefone(e.target.value)),
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email_empresa">E-mail Corporativo Oficial</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email_empresa"
                        type="email"
                        placeholder="contato@translogistica.com.br"
                        className="pl-9 rounded-xl"
                        maxLength={100}
                        {...register("email_empresa")}
                      />
                    </div>
                    {errors.email_empresa && (
                      <p className="text-xs text-destructive">{errors.email_empresa.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* ETAPA 2: DADOS DO GESTOR */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <Label htmlFor="nome">Nome Completo do Gestor / Administrador</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="nome"
                        placeholder="Ex: Carlos Eduardo Silva"
                        className="pl-9 rounded-xl"
                        maxLength={80}
                        {...register("nome")}
                      />
                    </div>
                    {errors.nome && (
                      <p className="text-xs text-destructive">{errors.nome.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">E-mail de Acesso do Gestor</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="carlos@translogistica.com.br"
                          className="pl-9 rounded-xl"
                          maxLength={100}
                          {...register("email")}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cpf">CPF do Gestor</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="cpf"
                          placeholder="000.000.000-00"
                          className="pl-9 rounded-xl"
                          maxLength={14}
                          {...register("cpf", {
                            onChange: (e) => setValue("cpf", maskCPF(e.target.value)),
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="telefone"
                          placeholder="(00) 00000-0000"
                          className="pl-9 rounded-xl"
                          maxLength={15}
                          {...register("telefone", {
                            onChange: (e) => setValue("telefone", maskTelefone(e.target.value)),
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="senha">Senha de Acesso</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="senha"
                          type="password"
                          placeholder="Mínimo 8 caracteres"
                          className="pl-9 rounded-xl"
                          maxLength={64}
                          {...register("senha")}
                        />
                      </div>
                      {errors.senha && (
                        <p className="text-xs text-destructive">{errors.senha.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmarSenha"
                        type="password"
                        placeholder="Repita a senha"
                        className="pl-9 rounded-xl"
                        maxLength={64}
                        {...register("confirmarSenha")}
                      />
                    </div>
                    {errors.confirmarSenha && (
                      <p className="text-xs text-destructive">{errors.confirmarSenha.message}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 pt-4 bg-muted/20">
              {step === 1 ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Já possui conta?{" "}
                    <Link href="/login" className="text-primary font-bold hover:underline">
                      Fazer Login
                    </Link>
                  </p>
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="w-full sm:w-auto rounded-xl font-bold gap-2 shadow-md"
                  >
                    Avançar para Gestor
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="w-full sm:w-auto rounded-xl gap-2 font-semibold"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar aos Dados da Empresa
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSigningUp}
                    className="w-full sm:w-auto rounded-xl font-bold gap-2 shadow-md"
                  >
                    {isSigningUp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Finalizar Cadastro
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
