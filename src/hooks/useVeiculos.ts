import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { veiculoService } from "../services/veiculoService";
import { useActiveEmpresa } from "../providers/ActiveEmpresaProvider";
import { useAuth } from "./useAuth";
import { CriarVeiculoInput, AtualizarVeiculoInput } from "../types";
import { toast } from "sonner";

export function useVeiculos(params?: { page?: number; limite?: number; placa?: string; modelo?: string; empresa_id?: string; todos?: boolean }) {
  const queryClient = useQueryClient();
  const { empresaId: activeEmpresaId } = useActiveEmpresa();
  const { isSuperAdmin } = useAuth();

  const queryParams = {
    ...params,
    empresa_id: params?.empresa_id || (isSuperAdmin ? (activeEmpresaId || undefined) : undefined),
  };

  const veiculosQuery = useQuery({
    queryKey: ["veiculos", queryParams],
    queryFn: async () => {
      return await veiculoService.listar(queryParams);
    },
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  });

  const criarMutation = useMutation({
    mutationFn: async (data: CriarVeiculoInput) => {
      const payload = {
        ...data,
        empresa_id: data.empresa_id || activeEmpresaId || undefined,
      };
      return await veiculoService.criar(payload);
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

  const alterarStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ativo' | 'inativo' }) => {
      return await veiculoService.atualizarStatus(id, status);
    },
    onSuccess: (_, variables) => {
      toast.success(`Veículo ${variables.status === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["veiculos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao alterar status do veículo.");
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
    alterarStatusVeiculo: alterarStatusMutation.mutateAsync,
    isAlterandoStatus: alterarStatusMutation.isPending,
    deletarVeiculo: deletarMutation.mutateAsync,
    isDeletando: deletarMutation.isPending,
  };
}
