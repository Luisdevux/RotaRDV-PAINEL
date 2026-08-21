// src/app/(auth)/motoristas/components/MotoristaFormModal.tsx

"use client";

import React, { useState } from "react";
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
import { formatPlaca } from "@/lib/formatters";
import { maskCPF, maskTelefone, unmask } from "@/lib/masks";
import { UserPlus, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CriarMotoristaInput, Veiculo } from "@/types";

const motoristaSchema = z.object({
  nome: z.string().min(2, "Nome do motorista é obrigatório"),
  email: z.string().email("E-mail válido é obrigatório"),
  senha: z.string().min(6, "Mínimo 6 caracteres para acesso inicial").optional().or(z.literal("")),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
});

type MotoristaFormValues = z.infer<typeof motoristaSchema>;

interface MotoristaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  veiculosList: Veiculo[];
  onSubmit: (data: CriarMotoristaInput) => Promise<void>;
  isLoading?: boolean;
}

export function MotoristaFormModal({
  open,
  onOpenChange,
  veiculosList,
  onSubmit,
  isLoading = false,
}: MotoristaFormModalProps) {
  const [selectedVeiculoId, setSelectedVeiculoId] = useState<string>("nenhum");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MotoristaFormValues>({
    resolver: zodResolver(motoristaSchema),
  });

  const handleFormSubmit = async (data: MotoristaFormValues) => {
    await onSubmit({
      nome: data.nome,
      email: data.email,
      senha: data.senha || undefined,
      cpf: data.cpf ? unmask(data.cpf) : undefined,
      telefone: data.telefone ? unmask(data.telefone) : undefined,
      cargo: "Motorista Rodoviário",
      veiculo_id: selectedVeiculoId === "nenhum" ? undefined : selectedVeiculoId,
    });
    reset();
    setSelectedVeiculoId("nenhum");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <UserPlus className="h-5 w-5 text-primary" />
              Cadastrar Novo Motorista
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              O condutor receberá credenciais para acessar o aplicativo móvel RotaRDV.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-4">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                placeholder="Ex: João Ferreira da Silva"
                className="rounded-xl"
                maxLength={80}
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao.silva@email.com"
                className="rounded-xl"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="senha">Senha Inicial (Opcional)</Label>
              <Input
                id="senha"
                type="password"
                placeholder="•••••••• (Padrão: 123456)"
                className="rounded-xl"
                {...register("senha")}
              />
              {errors.senha && (
                <p className="text-xs text-destructive">{errors.senha.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
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
              <div className="space-y-1">
                <Label htmlFor="telefone">Telefone</Label>
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

            <div className="space-y-1">
              <Label htmlFor="veiculo">Caminhão Vinculado (Opcional)</Label>
              <Select
                value={selectedVeiculoId}
                onValueChange={setSelectedVeiculoId}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione um caminhão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum veículo vinculado</SelectItem>
                  {veiculosList.map((v) => (
                    <SelectItem key={v._id} value={v._id}>
                      {formatPlaca(v.placa)} — {v.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                "Cadastrar Motorista"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
