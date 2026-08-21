// src/app/(auth)/administrativo/components/MembroEditModal.tsx

"use client";

import React, { useState, useEffect } from "react";
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
import { Edit3, ShieldCheck, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Usuario, UserRole, AtualizarMembroAdministrativoInput } from "@/types";

const editarNivelSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  cargo: z.string().min(2, "Cargo é obrigatório"),
  role: z.enum(["admin", "gestor", "motorista"]),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
});

export type EditarNivelFormValues = z.infer<typeof editarNivelSchema>;

interface MembroEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  membro: Usuario | null;
  isAdmin: boolean;
  onSubmit: (data: AtualizarMembroAdministrativoInput) => Promise<void>;
  isLoading?: boolean;
}

export function MembroEditModal({
  open,
  onOpenChange,
  membro,
  isAdmin,
  onSubmit,
  isLoading = false,
}: MembroEditModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>("gestor");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditarNivelFormValues>({
    resolver: zodResolver(editarNivelSchema),
  });

  useEffect(() => {
    if (open && membro) {
      const role = membro.role || (membro.isAdmin ? "admin" : "gestor");
      setSelectedRole(role);
      reset({
        nome: membro.nome || "",
        cargo: membro.empresa?.cargo || (role === "admin" ? "Administrador Geral" : "Gestor"),
        role,
        cpf: maskCPF(membro.cpf || ""),
        telefone: maskTelefone(membro.telefone || ""),
      });
    }
  }, [open, membro, reset]);

  const handleFormSubmit = async (data: EditarNivelFormValues) => {
    await onSubmit({
      ...data,
      role: selectedRole,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Edit3 className="h-5 w-5 text-primary" />
              Alterar Cargo & Nível de Acesso
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Defina as responsabilidades e permissões hierárquicas deste membro na transportadora.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1">
              <Label htmlFor="edit-nome">Nome Completo *</Label>
              <Input
                id="edit-nome"
                className="rounded-xl"
                maxLength={80}
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="edit-cargo">Cargo / Função na Empresa *</Label>
              <Input
                id="edit-cargo"
                placeholder="Ex: Diretor de Operações, Gestor de Logística..."
                className="rounded-xl"
                maxLength={50}
                {...register("cargo")}
              />
              {errors.cargo && (
                <p className="text-xs text-destructive">{errors.cargo.message}</p>
              )}
            </div>

            {/* Seletor de Papel de Acesso / Hierarquia */}
            <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border/60">
              <div className="flex items-center justify-between">
                <Label className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Papel Hierárquico (Nível de Acesso)
                </Label>
                {!isAdmin && (
                  <span className="text-[10px] text-destructive font-medium">Requer perfil Admin</span>
                )}
              </div>

              <Select
                value={selectedRole}
                onValueChange={(val: UserRole) => setSelectedRole(val)}
                disabled={!isAdmin}
              >
                <SelectTrigger className="rounded-xl bg-background">
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gestor">Gestor (Frota, motoristas e viagens da transportadora)</SelectItem>
                  <SelectItem value="admin">Administrador (Controle irrestrito, governança e promoção de cargos)</SelectItem>
                  <SelectItem value="motorista">Motorista (Acesso restrito ao aplicativo)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {selectedRole === "admin" 
                  ? "Permite gerenciar outros gestores, promover cargos e ter controle total do sistema." 
                  : "Permite gerenciar motoristas, viagens e despesas da sua empresa."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="edit-cpf">CPF</Label>
                <Input
                  id="edit-cpf"
                  placeholder="000.000.000-00"
                  className="rounded-xl"
                  maxLength={14}
                  {...register("cpf", {
                    onChange: (e) => setValue("cpf", maskCPF(e.target.value)),
                  })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-telefone">Telefone</Label>
                <Input
                  id="edit-telefone"
                  placeholder="(00) 00000-0000"
                  className="rounded-xl"
                  maxLength={15}
                  {...register("telefone", {
                    onChange: (e) => setValue("telefone", maskTelefone(e.target.value)),
                  })}
                />
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
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
