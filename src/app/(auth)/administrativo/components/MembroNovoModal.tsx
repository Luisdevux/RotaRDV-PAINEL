// src/app/(auth)/administrativo/components/MembroNovoModal.tsx

"use client";

import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { maskCPF, maskTelefone, unmask } from "@/lib/masks";
import { UserPlus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { CriarMembroAdministrativoInput } from "@/types";

const novoMembroSchema = z.object({
  nome: z.string().min(2, "Nome completo é obrigatório"),
  email: z.string().email("E-mail válido é obrigatório"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  cargo: z.string().min(2, "Cargo ou função na empresa é obrigatório"),
  role: z.enum(["admin", "gestor"]),
});

export type NovoMembroFormValues = z.infer<typeof novoMembroSchema>;

interface MembroNovoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CriarMembroAdministrativoInput) => Promise<void>;
  isLoading?: boolean;
}

export function MembroNovoModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: MembroNovoModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NovoMembroFormValues>({
    resolver: zodResolver(novoMembroSchema),
    defaultValues: {
      role: "gestor",
      cargo: "Gestor de Frota",
    },
  });

  const handleFormSubmit = async (data: NovoMembroFormValues) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <UserPlus className="h-5 w-5 text-primary" />
              Novo Membro Administrativo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre um novo Administrador ou Gestor de Frota para a empresa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                placeholder="Ex: Carlos Eduardo de Souza"
                className="rounded-xl"
                maxLength={80}
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail de Acesso *</Label>
              <Input
                id="email"
                type="email"
                placeholder="carlos@transportadora.com.br"
                className="rounded-xl"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha Inicial *</Label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••••"
                className="rounded-xl"
                {...register("senha")}
              />
              {errors.senha && (
                <p className="text-xs text-destructive">{errors.senha.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  className="rounded-xl"
                  maxLength={14}
                  {...register("cpf", {
                    onChange: (e) => setValue("cpf", maskCPF(e.target.value)),
                  })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone / Celular</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  className="rounded-xl"
                  maxLength={15}
                  {...register("telefone", {
                    onChange: (e) => setValue("telefone", maskTelefone(e.target.value)),
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cargo">Cargo / Função *</Label>
                <Input
                  id="cargo"
                  placeholder="Ex: Gestor Operacional"
                  className="rounded-xl"
                  {...register("cargo")}
                />
                {errors.cargo && (
                  <p className="text-xs text-destructive">{errors.cargo.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Papel de Acesso</Label>
                <Select
                  defaultValue="gestor"
                  onValueChange={(val: "admin" | "gestor") => setValue("role", val)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione o papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="default" 
              disabled={isLoading} 
              className="rounded-xl font-bold gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                "Cadastrar Membro"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
