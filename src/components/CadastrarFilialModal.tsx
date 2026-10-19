// src/components/CadastrarFilialModal.tsx

"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useActiveEmpresa } from "@/providers/ActiveEmpresaProvider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, FileText, Mail, Phone, MapPin, Loader2, Plus } from "lucide-react";
import { maskCNPJ, maskTelefone, maskUF, unmask, isValidCNPJ } from "@/lib/masks";
import { toast } from "sonner";

const cadastrarFilialSchema = z.object({
  nome_empresa: z.string().min(2, "Nome da filial é obrigatório"),
  cnpj: z.string().min(14, "CNPJ é obrigatório").refine((val) => isValidCNPJ(val), {
    message: "CNPJ inválido",
  }),
  email: z.string().email("E-mail institucional inválido"),
  telefone: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

type CadastrarFilialFormValues = z.infer<typeof cadastrarFilialSchema>;

interface CadastrarFilialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CadastrarFilialModal({ open, onOpenChange }: CadastrarFilialModalProps) {
  const { cadastrarFilial, isCadastrandoFilial } = useEmpresa();
  const { setEmpresaId } = useActiveEmpresa();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CadastrarFilialFormValues>({
    resolver: zodResolver(cadastrarFilialSchema),
    defaultValues: {
      nome_empresa: "",
      cnpj: "",
      email: "",
      telefone: "",
      cidade: "",
      estado: "",
    },
  });

  const onSubmit = async (data: CadastrarFilialFormValues) => {
    try {
      const novaFilial = await cadastrarFilial({
        nome_empresa: data.nome_empresa,
        cnpj: unmask(data.cnpj).toUpperCase(),
        email: data.email,
        telefone: data.telefone ? unmask(data.telefone) : "",
        endereco: {
          cidade: data.cidade || "",
          estado: data.estado ? data.estado.toUpperCase() : "",
        },
      });

      toast.success("Nova unidade cadastrada com sucesso!");
      if (novaFilial?._id) {
        setEmpresaId(novaFilial._id);
      }
      reset();
      onOpenChange(false);
    } catch {
      // Feedback tratado pelo hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-6 sm:p-8 bg-card border-border shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="space-y-3 pb-2 text-left">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner border border-primary/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle className="text-xl font-black text-foreground">
              Cadastrar Nova Filial
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Cadastre uma nova unidade ou filial coligada sob sua administração.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="nome_filial" className="text-[10px] font-black uppercase text-muted-foreground ml-1 cursor-pointer">
              Nome da Filial / Razão Social
            </Label>
            <div className="relative group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="nome_filial"
                placeholder="Ex: Transportadora Rota Brasil - Filial Porto Velho"
                className="h-11 pl-11 rounded-xl bg-muted/20 border border-border shadow-inner font-medium text-foreground focus-visible:ring-primary transition-all"
                {...register("nome_empresa")}
              />
            </div>
            {errors.nome_empresa && (
              <p className="text-[11px] font-bold text-destructive ml-1">{errors.nome_empresa.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cnpj_filial" className="text-[10px] font-black uppercase text-muted-foreground ml-1 cursor-pointer">
                CNPJ
              </Label>
              <div className="relative group">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="cnpj_filial"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="h-11 pl-11 rounded-xl bg-muted/20 border border-border shadow-inner font-medium text-foreground focus-visible:ring-primary transition-all"
                  {...register("cnpj", {
                    onChange: (e) => {
                      e.target.value = maskCNPJ(e.target.value);
                      setValue("cnpj", e.target.value);
                    },
                  })}
                />
              </div>
              {errors.cnpj && (
                <p className="text-[11px] font-bold text-destructive ml-1">{errors.cnpj.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tel_filial" className="text-[10px] font-black uppercase text-muted-foreground ml-1 cursor-pointer">
                Telefone
              </Label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="tel_filial"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="h-11 pl-11 rounded-xl bg-muted/20 border border-border shadow-inner font-medium text-foreground focus-visible:ring-primary transition-all"
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

          <div className="space-y-1.5">
            <Label htmlFor="email_filial" className="text-[10px] font-black uppercase text-muted-foreground ml-1 cursor-pointer">
              E-mail Institucional
            </Label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="email_filial"
                type="email"
                placeholder="filial@transportadora.com.br"
                className="h-11 pl-11 rounded-xl bg-muted/20 border border-border shadow-inner font-medium text-foreground focus-visible:ring-primary transition-all"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] font-bold text-destructive ml-1">{errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="cidade_filial" className="text-[10px] font-black uppercase text-muted-foreground ml-1 cursor-pointer">
                Cidade
              </Label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="cidade_filial"
                  placeholder="Ex: Porto Velho"
                  className="h-11 pl-11 rounded-xl bg-muted/20 border border-border shadow-inner font-medium text-foreground focus-visible:ring-primary transition-all"
                  {...register("cidade")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="uf_filial" className="text-[10px] font-black uppercase text-muted-foreground ml-1 cursor-pointer">
                UF
              </Label>
              <Input
                id="uf_filial"
                placeholder="RO"
                maxLength={2}
                className="h-11 uppercase text-center rounded-xl bg-muted/20 border border-border shadow-inner font-medium text-foreground focus-visible:ring-primary transition-all"
                {...register("estado", {
                  onChange: (e) => {
                    e.target.value = maskUF(e.target.value);
                    setValue("estado", e.target.value);
                  },
                })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-1/3 h-12 rounded-xl text-xs font-bold border-border hover:bg-muted/50 cursor-pointer active:scale-95 transition-all"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isCadastrandoFilial}
              className="w-2/3 h-12 rounded-xl text-xs font-black shadow-lg shadow-primary/10 cursor-pointer active:scale-95 transition-all"
            >
              {isCadastrandoFilial ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </span>
              ) : (
                "Cadastrar Filial"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
