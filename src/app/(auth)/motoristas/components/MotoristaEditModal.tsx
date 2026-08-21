// src/app/(auth)/motoristas/components/MotoristaEditModal.tsx

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
import { formatPlaca } from "@/lib/formatters";
import { maskCPF, maskTelefone, unmask } from "@/lib/masks";
import { Edit3, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Usuario, Veiculo, AtualizarUsuarioInput } from "@/types";

const editMotoristaSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
});

type EditMotoristaFormValues = z.infer<typeof editMotoristaSchema>;

interface MotoristaEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motorista: Usuario | null;
  veiculosList: Veiculo[];
  onSubmit: (data: AtualizarUsuarioInput) => Promise<void>;
  isLoading?: boolean;
}

export function MotoristaEditModal({
  open,
  onOpenChange,
  motorista,
  veiculosList,
  onSubmit,
  isLoading = false,
}: MotoristaEditModalProps) {
  const [editVeiculoId, setEditVeiculoId] = useState<string>("nenhum");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditMotoristaFormValues>({
    resolver: zodResolver(editMotoristaSchema),
  });

  useEffect(() => {
    if (open && motorista) {
      reset({
        nome: motorista.nome || "",
        cpf: maskCPF(motorista.cpf || ""),
        telefone: maskTelefone(motorista.telefone || ""),
      });
      const veicId = typeof motorista.veiculo_id === "object" ? motorista.veiculo_id?._id : motorista.veiculo_id;
      setEditVeiculoId(veicId || "nenhum");
    }
  }, [open, motorista, reset]);

  const handleFormSubmit = async (data: EditMotoristaFormValues) => {
    await onSubmit({
      nome: data.nome,
      cpf: data.cpf ? unmask(data.cpf) : undefined,
      telefone: data.telefone ? unmask(data.telefone) : undefined,
      veiculo_id: editVeiculoId === "nenhum" ? null : editVeiculoId || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Edit3 className="h-5 w-5 text-primary" />
              Editar Dados do Motorista
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Atualize as informações de contato e o caminhão vinculado ao motorista.
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

            <div className="space-y-1">
              <Label htmlFor="edit-veiculo">Caminhão Vinculado</Label>
              <Select
                value={editVeiculoId}
                onValueChange={setEditVeiculoId}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione um veículo" />
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
