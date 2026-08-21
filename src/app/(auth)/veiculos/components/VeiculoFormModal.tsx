// src/app/(auth)/veiculos/components/VeiculoFormModal.tsx

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
import { maskPlaca, unmask } from "@/lib/masks";
import { 
  Truck, 
  Layers, 
  Plus, 
  Trash2, 
  Loader2 
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Veiculo, CombustivelPreferencial, CriarVeiculoInput, AtualizarVeiculoInput } from "@/types";

const veiculoFormSchema = z.object({
  placa: z.string().min(7, "Placa deve ter no mínimo 7 caracteres"),
  modelo: z.string().min(2, "Modelo do caminhão é obrigatório"),
  combustivel_preferencial: z.enum(["DIESEL_S10", "DIESEL_S500", "GASOLINA", "ETANOL", "ARLA_32", "OUTRO"]),
  capacidade_tanque: z.coerce.number().min(1, "Capacidade do tanque é obrigatória"),
  ano_fabricacao: z.coerce.number().min(1980, "Ano de fabricação inválido"),
  reboque_modelo: z.string().optional(),
  reboque_ano_fabricacao: z.coerce.number().optional(),
});

type VeiculoFormValues = z.infer<typeof veiculoFormSchema>;

interface VeiculoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  veiculo?: Veiculo | null;
  onSubmit: (data: CriarVeiculoInput | AtualizarVeiculoInput) => Promise<void>;
  isLoading?: boolean;
}

export function VeiculoFormModal({
  open,
  onOpenChange,
  veiculo,
  onSubmit,
  isLoading = false,
}: VeiculoFormModalProps) {
  const isEditing = Boolean(veiculo);

  const [combustivel, setCombustivel] = useState<CombustivelPreferencial>("DIESEL_S10");
  const [reboquePlacas, setReboquePlacas] = useState<string[]>([""]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<VeiculoFormValues>({
    resolver: zodResolver(veiculoFormSchema),
    defaultValues: {
      combustivel_preferencial: "DIESEL_S10",
      capacidade_tanque: 400,
      ano_fabricacao: new Date().getFullYear(),
    },
  });

  useEffect(() => {
    if (open) {
      if (veiculo) {
        reset({
          placa: maskPlaca(veiculo.placa || ""),
          modelo: veiculo.modelo || "",
          combustivel_preferencial: veiculo.combustivel_preferencial || "DIESEL_S10",
          capacidade_tanque: veiculo.capacidade_tanque || 400,
          ano_fabricacao: veiculo.ano_fabricacao || new Date().getFullYear(),
          reboque_modelo: veiculo.reboque?.modelo || "",
          reboque_ano_fabricacao: veiculo.reboque?.ano_fabricacao || undefined,
        });
        setCombustivel(veiculo.combustivel_preferencial || "DIESEL_S10");

        // Preenche placas do reboque/implemento
        if (veiculo.reboque?.placas && veiculo.reboque.placas.length > 0) {
          setReboquePlacas(veiculo.reboque.placas.map(p => maskPlaca(p)));
        } else if (veiculo.reboque?.placa) {
          setReboquePlacas([maskPlaca(veiculo.reboque.placa)]);
        } else {
          setReboquePlacas([""]);
        }
      } else {
        reset({
          placa: "",
          modelo: "",
          combustivel_preferencial: "DIESEL_S10",
          capacidade_tanque: 400,
          ano_fabricacao: new Date().getFullYear(),
          reboque_modelo: "",
          reboque_ano_fabricacao: undefined,
        });
        setCombustivel("DIESEL_S10");
        setReboquePlacas([""]);
      }
    }
  }, [open, veiculo, reset]);

  const handleAddReboquePlaca = () => {
    setReboquePlacas(prev => [...prev, ""]);
  };

  const handleRemoveReboquePlaca = (index: number) => {
    setReboquePlacas(prev => prev.filter((_, i) => i !== index));
  };

  const handleReboquePlacaChange = (index: number, value: string) => {
    const formatted = maskPlaca(value);
    setReboquePlacas(prev => {
      const updated = [...prev];
      updated[index] = formatted;
      return updated;
    });
  };

  const handleFormSubmit = async (data: VeiculoFormValues) => {
    // Filtra placas preenchidas limpas
    const validPlacas = reboquePlacas
      .map(p => unmask(p).toUpperCase())
      .filter(p => p.length >= 7);

    const hasReboque = Boolean(data.reboque_modelo || validPlacas.length > 0 || data.reboque_ano_fabricacao);

    const payload: CriarVeiculoInput = {
      placa: unmask(data.placa).toUpperCase(),
      modelo: data.modelo,
      combustivel_preferencial: combustivel,
      capacidade_tanque: Number(data.capacidade_tanque),
      ano_fabricacao: Number(data.ano_fabricacao),
      reboque: hasReboque
        ? {
            modelo: data.reboque_modelo || undefined,
            placas: validPlacas.length > 0 ? validPlacas : undefined,
            placa: validPlacas.length > 0 ? validPlacas[0] : undefined,
            ano_fabricacao: data.reboque_ano_fabricacao ? Number(data.reboque_ano_fabricacao) : undefined,
          }
        : undefined,
    };

    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Truck className="h-5 w-5 text-primary" />
              {isEditing ? "Editar Veículo da Frota" : "Cadastrar Veículo na Frota"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isEditing 
                ? "Atualize as especificações do cavalo mecânico e das carretas/implementos acoplados." 
                : "Cadastre cavalos mecânicos e implementos (simples, bitrem, rodotrem, canavieiro)."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Seção 1: Cavalo Mecânico */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                <Truck className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Unidade de Tração (Cavalo Mecânico)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="placa">Placa do Cavalo *</Label>
                  <Input
                    id="placa"
                    placeholder="ABC-1234 ou ABC1D23"
                    className="rounded-xl font-mono uppercase"
                    maxLength={8}
                    disabled={isEditing}
                    {...register("placa", {
                      onChange: (e) => setValue("placa", maskPlaca(e.target.value)),
                    })}
                  />
                  {errors.placa && (
                    <p className="text-xs text-destructive">{errors.placa.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="modelo">Modelo do Caminhão *</Label>
                  <Input
                    id="modelo"
                    placeholder="Ex: Scania R450, Volvo FH 540"
                    className="rounded-xl"
                    maxLength={80}
                    {...register("modelo")}
                  />
                  {errors.modelo && (
                    <p className="text-xs text-destructive">{errors.modelo.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="combustivel">Combustível Preferencial</Label>
                  <Select
                    value={combustivel}
                    onValueChange={(val: CombustivelPreferencial) => setCombustivel(val)}
                  >
                    <SelectTrigger className="rounded-xl bg-background">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIESEL_S10">Diesel S10</SelectItem>
                      <SelectItem value="DIESEL_S500">Diesel S500</SelectItem>
                      <SelectItem value="GASOLINA">Gasolina</SelectItem>
                      <SelectItem value="ETANOL">Etanol</SelectItem>
                      <SelectItem value="ARLA_32">Arla 32</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="capacidade_tanque">Capacidade Tanque (L) *</Label>
                  <Input
                    id="capacidade_tanque"
                    type="number"
                    placeholder="400"
                    min={1}
                    max={3000}
                    className="rounded-xl"
                    {...register("capacidade_tanque")}
                  />
                  {errors.capacidade_tanque && (
                    <p className="text-xs text-destructive">{errors.capacidade_tanque.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ano_fabricacao">Ano Fabricação *</Label>
                  <Input
                    id="ano_fabricacao"
                    type="number"
                    placeholder="2024"
                    min={1980}
                    max={new Date().getFullYear() + 1}
                    className="rounded-xl"
                    {...register("ano_fabricacao")}
                  />
                  {errors.ano_fabricacao && (
                    <p className="text-xs text-destructive">{errors.ano_fabricacao.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Seção 2: Implemento / Reboques Multi-Carretas */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Implemento / Carretas (Bitrem, Rodotrem, Canavieiro)
                  </h4>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddReboquePlaca}
                  className="rounded-lg h-7 px-2 text-xs font-semibold gap-1 text-primary border-primary/40 hover:bg-primary/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar Carreta
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="reboque_modelo">Tipo / Modelo do Implemento</Label>
                  <Input
                    id="reboque_modelo"
                    placeholder="Ex: Randon Graneleiro Bitrem, Noma 9 Eixos"
                    className="rounded-xl"
                    maxLength={80}
                    {...register("reboque_modelo")}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="reboque_ano_fabricacao">Ano do Implemento</Label>
                  <Input
                    id="reboque_ano_fabricacao"
                    type="number"
                    placeholder="Ex: 2023"
                    min={1980}
                    max={new Date().getFullYear() + 1}
                    className="rounded-xl"
                    {...register("reboque_ano_fabricacao")}
                  />
                </div>
              </div>

              {/* Lista Dinâmica de Placas de Carretas */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs text-muted-foreground font-medium">
                  Placas das Carretas Acopladas:
                </Label>

                <div className="space-y-2">
                  {reboquePlacas.map((placa, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Input
                          placeholder={`Placa da Carreta #${index + 1} (ex: XYZ-9A87)`}
                          value={placa}
                          onChange={(e) => handleReboquePlacaChange(index, e.target.value)}
                          maxLength={8}
                          className="rounded-xl font-mono uppercase bg-background"
                        />
                      </div>

                      {reboquePlacas.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveReboquePlaca(index)}
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          title="Remover carreta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
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
                isEditing ? "Salvar Alterações" : "Cadastrar Veículo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
