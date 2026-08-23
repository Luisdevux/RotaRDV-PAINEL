// src/hooks/useDespesas.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { despesaService } from "../services/despesaService";
import { useActiveEmpresa } from "../providers/ActiveEmpresaProvider";
import { useAuth } from "./useAuth";
import { CriarDespesaInput } from "../types";
import { toast } from "sonner";

export function useDespesas(params?: { 
  page?: number; 
  limite?: number; 
  viagem_id?: string; 
  tipo?: string; 
  data_inicio?: string; 
  data_fim?: string; 
  empresa_id?: string;
}) {
  const queryClient = useQueryClient();
  const { empresaId: activeEmpresaId } = useActiveEmpresa();
  const { isSuperAdmin } = useAuth();

  const queryParams = {
    ...params,
    empresa_id: params?.empresa_id || (isSuperAdmin ? (activeEmpresaId || undefined) : undefined),
  };

  const despesasQuery = useQuery({
    queryKey: ["despesas", queryParams],
    queryFn: async () => {
      return await despesaService.listar(queryParams);
    },
  });

  const criarMutation = useMutation({
    mutationFn: async (data: CriarDespesaInput) => {
      return await despesaService.criar(data);
    },
    onSuccess: () => {
      toast.success("Despesa cadastrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      queryClient.invalidateQueries({ queryKey: ["viagens"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao cadastrar despesa.");
    },
  });

  const deletarMutation = useMutation({
    mutationFn: async (id: string) => {
      return await despesaService.deletar(id);
    },
    onSuccess: () => {
      toast.success("Despesa removida com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      queryClient.invalidateQueries({ queryKey: ["viagens"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao remover despesa.");
    },
  });

  const uploadFotoMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      return await despesaService.uploadFoto(id, file);
    },
    onSuccess: () => {
      toast.success("Comprovante anexado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["despesas"] });
      queryClient.invalidateQueries({ queryKey: ["viagens"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao anexar comprovante.");
    },
  });

  return {
    ...despesasQuery,
    criarDespesa: criarMutation.mutateAsync,
    isCriando: criarMutation.isPending,
    deletarDespesa: deletarMutation.mutateAsync,
    isDeletando: deletarMutation.isPending,
    uploadFoto: uploadFotoMutation.mutateAsync,
    isUploadingFoto: uploadFotoMutation.isPending,
  };
}
