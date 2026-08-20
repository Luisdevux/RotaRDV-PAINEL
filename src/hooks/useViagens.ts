// src/hooks/useViagens.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { viagemService } from "../services/viagemService";
import { CriarViagemInput, ConcluirViagemInput } from "../types";
import { toast } from "sonner";

export function useViagens(params?: { 
  page?: number; 
  limite?: number; 
  status?: string; 
  veiculo_id?: string;
  data_inicio?: string;
  data_fim?: string;
}) {
  const queryClient = useQueryClient();

  const viagensQuery = useQuery({
    queryKey: ["viagens", params],
    queryFn: async () => {
      return await viagemService.listar(params);
    },
  });

  const criarMutation = useMutation({
    mutationFn: async (data: CriarViagemInput) => {
      return await viagemService.criar(data);
    },
    onSuccess: () => {
      toast.success("Viagem iniciada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["viagens"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao iniciar viagem.");
    },
  });

  const concluirMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ConcluirViagemInput }) => {
      return await viagemService.concluir(id, data);
    },
    onSuccess: () => {
      toast.success("Viagem concluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["viagens"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao concluir viagem.");
    },
  });

  const deletarMutation = useMutation({
    mutationFn: async (id: string) => {
      return await viagemService.deletar(id);
    },
    onSuccess: () => {
      toast.success("Viagem removida com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["viagens"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao remover viagem.");
    },
  });

  return {
    ...viagensQuery,
    criarViagem: criarMutation.mutateAsync,
    isCriando: criarMutation.isPending,
    concluirViagem: concluirMutation.mutateAsync,
    isConcluindo: concluirMutation.isPending,
    deletarViagem: deletarMutation.mutateAsync,
    isDeletando: deletarMutation.isPending,
  };
}

export function useViagemDetalhes(id: string) {
  return useQuery({
    queryKey: ["viagem", id],
    queryFn: async () => {
      if (!id) throw new Error("ID da viagem não informado");
      return await viagemService.buscarPorID(id);
    },
    enabled: Boolean(id),
  });
}
