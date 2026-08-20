// src/hooks/useVeiculos.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { veiculoService } from "../services/veiculoService";
import { CriarVeiculoInput, AtualizarVeiculoInput } from "../types";
import { toast } from "sonner";

export function useVeiculos(params?: { page?: number; limite?: number; placa?: string; modelo?: string }) {
  const queryClient = useQueryClient();

  const veiculosQuery = useQuery({
    queryKey: ["veiculos", params],
    queryFn: async () => {
      return await veiculoService.listar(params);
    },
  });

  const criarMutation = useMutation({
    mutationFn: async (data: CriarVeiculoInput) => {
      return await veiculoService.criar(data);
    },
    onSuccess: () => {
      toast.success("Veículo cadastrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["veiculos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao cadastrar veículo.");
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AtualizarVeiculoInput }) => {
      return await veiculoService.atualizar(id, data);
    },
    onSuccess: () => {
      toast.success("Veículo atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["veiculos"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao atualizar veículo.");
    },
  });

  const deletarMutation = useMutation({
    mutationFn: async (id: string) => {
      return await veiculoService.deletar(id);
    },
    onSuccess: () => {
      toast.success("Veículo removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["veiculos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao remover veículo.");
    },
  });

  return {
    ...veiculosQuery,
    criarVeiculo: criarMutation.mutateAsync,
    isCriando: criarMutation.isPending,
    atualizarVeiculo: atualizarMutation.mutateAsync,
    isAtualizando: atualizarMutation.isPending,
    deletarVeiculo: deletarMutation.mutateAsync,
    isDeletando: deletarMutation.isPending,
  };
}
