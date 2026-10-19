// src/components/SignupForm.tsx

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
import { SafeImage } from "@/components/ui/safe-image";
import { maskCNPJ, maskCPF, maskTelefone, unmask, isValidCNPJ } from "@/lib/masks";
import { cn } from "@/lib/utils";
import { 
  Building2, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Eye, 
  EyeOff 
} from "lucide-react";

const LOGO_URL = process.env.NEXT_PUBLIC_APP_LOGO_URL || "https://rota-rdv.web.fslab.dev/7c4bb021-7946-44b4-acc2-cdb9c29aadc2.jpeg";

const signupSchema = z.object({
  nome_empresa: z.string().min(2, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(14, "CNPJ é obrigatório").refine((val) => isValidCNPJ(val), {
    message: "CNPJ inválido (numérico ou alfanumérico)",
  }),
  email_empresa: z.string().email("E-mail corporativo inválido"),
  telefone_empresa: z.string().optional(),

  // Administrador Master
  nome: z.string().min(2, "Nome do administrador é obrigatório"),
  email: z.string().email("E-mail do administrador inválido"),
  senha: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
  confirmarSenha: z.string().min(8, "Confirme sua senha"),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const { signup, isSigningUp } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      // Notificado pelo hook useAuth
    }
  };

  const isSubmitting = isSigningUp;

  return (
    <div className="w-full max-w-lg p-8 space-y-6 bg-card rounded-xl shadow-lg border border-border">
      {/* Header com Logo no topo */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-border shadow-sm bg-muted/20 mb-1">
          <SafeImage
            src={LOGO_URL}
            alt="RotaRDV Logo"
            fill
            className="object-cover"
            priority
            fallbackType="building"
          />
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Crie sua Conta</h1>
        <p className="text-muted-foreground text-sm">
          Cadastre sua transportadora e acesse a plataforma RotaRDV
        </p>
      </div>

      {/* Stepper simples em pílulas */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
            step === 1
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
          )}
        >
          <span>1. Transportadora</span>
        </button>
        <button
          type="button"
          onClick={nextStep}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
            step === 2
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
          )}
        >
          <span>2. Administrador</span>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ETAPA 1: DADOS DA EMPRESA */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <Label htmlFor="nome_empresa" className="cursor-pointer">
                Razão Social / Nome da Transportadora
              </Label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="nome_empresa"
                  placeholder="Ex: TransLogística Rodoviária LTDA"
                  className="pl-11 h-11"
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
                <Label htmlFor="cnpj" className="cursor-pointer">
                  CNPJ
                </Label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    className="pl-11 h-11"
                    maxLength={18}
                    {...register("cnpj", {
                      onChange: (e) => {
                        e.target.value = maskCNPJ(e.target.value);
                        setValue("cnpj", e.target.value);
                      },
                    })}
                  />
                </div>
                {errors.cnpj && (
                  <p className="text-xs text-destructive">{errors.cnpj.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefone_empresa" className="cursor-pointer">
                  Telefone Comercial (opcional)
                </Label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="telefone_empresa"
                    placeholder="(00) 00000-0000"
                    className="pl-11 h-11"
                    maxLength={15}
                    {...register("telefone_empresa", {
                      onChange: (e) => {
                        e.target.value = maskTelefone(e.target.value);
                        setValue("telefone_empresa", e.target.value);
                      },
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email_empresa" className="cursor-pointer">
                E-mail Corporativo
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email_empresa"
                  type="email"
                  placeholder="contato@transportadora.com.br"
                  className="pl-11 h-11"
                  {...register("email_empresa")}
                />
              </div>
              {errors.email_empresa && (
                <p className="text-xs text-destructive">{errors.email_empresa.message}</p>
              )}
            </div>

            <Button
              type="button"
              onClick={nextStep}
              className="w-full h-11 text-base font-bold mt-2 cursor-pointer active:scale-95 transition-all"
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* ETAPA 2: DADOS DO GESTOR / ADMINISTRADOR MASTER */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="cursor-pointer">
                Nome Completo do Administrador
              </Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="nome"
                  placeholder="Ex: Carlos Silva"
                  className="pl-11 h-11"
                  {...register("nome")}
                />
              </div>
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="cursor-pointer">
                E-mail de Acesso
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="carlos@transportadora.com.br"
                  className="pl-11 h-11"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cpf" className="cursor-pointer">
                  CPF (opcional)
                </Label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    className="pl-11 h-11"
                    maxLength={14}
                    {...register("cpf", {
                      onChange: (e) => {
                        e.target.value = maskCPF(e.target.value);
                        setValue("cpf", e.target.value);
                      },
                    })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefone" className="cursor-pointer">
                  WhatsApp / Celular (opcional)
                </Label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    className="pl-11 h-11"
                    maxLength={15}
                    {...register("telefone", {
                      onChange: (e) => {
                        e.target.value = maskTelefone(e.target.value);
                        setValue("telefone", e.target.value);
                      },
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="senha" title="Senha" className="cursor-pointer">
                  Senha
                </Label>
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
                <Label htmlFor="confirmarSenha" title="Confirmar Senha" className="cursor-pointer">
                  Confirmar Senha
                </Label>
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
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="w-1/3 h-11 text-sm font-bold border-border hover:bg-muted/50 cursor-pointer active:scale-95 transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 h-11 text-base font-bold cursor-pointer active:scale-95 transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando conta...
                  </span>
                ) : (
                  "Finalizar Cadastro"
                )}
              </Button>
            </div>
          </div>
        )}
      </form>

      <p className="text-center text-sm text-muted-foreground pt-2">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-primary font-bold hover:underline cursor-pointer">
          Faça login
        </Link>
      </p>
    </div>
  );
}
