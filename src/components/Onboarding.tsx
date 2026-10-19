// src/components/Onboarding.tsx

"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Building2, FileText, Phone, Mail, Loader2, LogOut } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { maskCNPJ, maskTelefone, unmask, isValidCNPJ } from "@/lib/masks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const LOGO_URL = process.env.NEXT_PUBLIC_APP_LOGO_URL || "https://rota-rdv.web.fslab.dev/7c4bb021-7946-44b4-acc2-cdb9c29aadc2.jpeg";

const onboardingSchema = z.object({
  nome_empresa: z.string().min(2, "Nome da transportadora deve ter pelo menos 2 caracteres"),
  email_empresa: z.string().email("E-mail corporativo inválido"),
  telefone_empresa: z.string().optional(),
  cnpj: z.string().optional(),
  preencher_cnpj_depois: z.boolean(),
}).refine((data) => {
  if (!data.preencher_cnpj_depois) {
    if (!data.cnpj || data.cnpj.length < 14 || !isValidCNPJ(data.cnpj)) {
      return false;
    }
  }
  return true;
}, {
  message: "CNPJ obrigatório ou marque a opção para preencher depois",
  path: ["cnpj"],
});

type OnboardingData = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const { user, logout, updateSession } = useAuth();
  const { cadastrarFilial, isCadastrandoFilial } = useEmpresa();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      nome_empresa: "",
      email_empresa: user?.email || "",
      telefone_empresa: "",
      cnpj: "",
      preencher_cnpj_depois: false,
    },
  });

  const skipCnpj = watch("preencher_cnpj_depois");
  const cnpjValue = watch("cnpj") || "";

  const onSubmit = async (data: OnboardingData) => {
    try {
      const finalCnpj = data.preencher_cnpj_depois 
        ? `TEMP${Date.now().toString().slice(-10)}` 
        : unmask(data.cnpj || "").toUpperCase();

      await cadastrarFilial({
        nome_empresa: data.nome_empresa,
        cnpj: finalCnpj,
        email: data.email_empresa,
        telefone: data.telefone_empresa ? unmask(data.telefone_empresa) : "",
      });

      toast.success("Transportadora configurada com sucesso!");
      await updateSession();
      window.location.reload();
    } catch {
      // Tratado pelo hook useEmpresa
    }
  };

  const isSaving = isCadastrandoFilial;

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl shadow-lg border border-border">
        {/* Header com Logo */}
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
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Configurar Empresa</h1>
          <p className="text-muted-foreground text-sm">
            Informe os dados da sua transportadora para começar a gerenciar sua frota
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome_empresa" className="cursor-pointer">
              Nome da Transportadora
            </Label>
            <div className="relative group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="nome_empresa"
                {...register("nome_empresa")}
                placeholder="Ex: Transportadora Rota Brasil"
                className="pl-11 h-11"
              />
            </div>
            {errors.nome_empresa && (
              <p className="text-destructive text-xs">{errors.nome_empresa.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="cnpj"
              className={cn(
                "cursor-pointer transition-colors",
                skipCnpj ? "text-muted-foreground/40" : "text-foreground"
              )}
            >
              CNPJ
            </Label>
            <div className="relative group">
              <FileText
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                  skipCnpj ? "text-muted-foreground/20" : "text-muted-foreground group-focus-within:text-primary"
                )}
              />
              <Input
                id="cnpj"
                {...register("cnpj", {
                  onChange: (e) => {
                    e.target.value = maskCNPJ(e.target.value);
                    setValue("cnpj", e.target.value);
                  },
                })}
                value={cnpjValue}
                disabled={skipCnpj}
                placeholder="00.000.000/0000-00"
                className={cn(
                  "pl-11 h-11",
                  skipCnpj && "opacity-40 grayscale"
                )}
              />
            </div>
            {errors.cnpj && (
              <p className="text-destructive text-xs">{errors.cnpj.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border">
            <div className="space-y-0.5">
              <Label className="text-foreground font-semibold text-xs cursor-pointer" htmlFor="skip-cnpj">
                Preencher CNPJ depois
              </Label>
              <p className="text-[10px] text-muted-foreground">
                Você poderá cadastrar nas configurações da empresa
              </p>
            </div>
            <Switch
              id="skip-cnpj"
              checked={skipCnpj}
              onCheckedChange={(checked) => setValue("preencher_cnpj_depois", checked)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="telefone_empresa" className="cursor-pointer">
              Telefone Comercial (opcional)
            </Label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="telefone_empresa"
                {...register("telefone_empresa", {
                  onChange: (e) => {
                    e.target.value = maskTelefone(e.target.value);
                    setValue("telefone_empresa", e.target.value);
                  },
                })}
                placeholder="(00) 00000-0000"
                className="pl-11 h-11"
              />
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
                {...register("email_empresa")}
                placeholder="contato@transportadora.com.br"
                className="pl-11 h-11"
              />
            </div>
            {errors.email_empresa && (
              <p className="text-destructive text-xs">{errors.email_empresa.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base font-bold mt-2 cursor-pointer active:scale-95 transition-all"
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Configurando...
              </span>
            ) : (
              "Começar Agora"
            )}
          </Button>
        </form>

        <div className="pt-2 text-center">
          <button
            onClick={() => logout()}
            type="button"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair da conta
          </button>
        </div>
      </div>
    </main>
  );
}
