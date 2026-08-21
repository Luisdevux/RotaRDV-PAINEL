// src/hooks/useMotoristas.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { empresaService } from "../services/empresaService";
import { usuarioService } from "../services/usuarioService";
import { useAuth } from "./useAuth";
import { CriarMotoristaInput, AtualizarUsuarioInput } from "../types";
import { toast } from "sonner";

export function useMotoristas(customEmpresaId?: string, params?: { page?: number; limite?: number }) {
  const queryClient = useQueryClient();
  const { empresaId: userEmpresaId } = useAuth();
  const targetEmpresaId = customEmpresaId || userEmpresaId;

  const motoristasQuery = useQuery({
    queryKey: ["motoristas", targetEmpresaId, params],
    queryFn: async () => {
      if (!targetEmpresaId) return { docs: [], items: [], totalDocs: 0 };
      return await empresaService.listarMotoristas(targetEmpresaId, params);
    },
    enabled: Boolean(targetEmpresaId),
  });

  const cadastrarMutation = useMutation({
    mutationFn: async (data: CriarMotoristaInput) => {
      if (!targetEmpresaId) throw new Error("Empresa não identificada");
      return await empresaService.cadastrarMotorista(targetEmpresaId, data);
    },
    onSuccess: () => {
      toast.success("Motorista cadastrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["motoristas", targetEmpresaId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", targetEmpresaId] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao cadastrar motorista.");
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AtualizarUsuarioInput }) => {
      return await usuarioService.atualizar(id, data);
    },
    onSuccess: () => {
      toast.success("Dados do motorista atualizados com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["motoristas", targetEmpresaId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", targetEmpresaId] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao atualizar motorista.");
    },
  });

  const alterarStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ativo' | 'inativo' }) => {
      return await usuarioService.atualizarStatus(id, status);
    },
    onSuccess: (_, variables) => {
      toast.success(`Motorista ${variables.status === 'ativo' ? 'ativado' : 'inativado'} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["motoristas", targetEmpresaId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", targetEmpresaId] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao alterar status do motorista.");
    },
  });

  const desvincularMutation = useMutation({
    mutationFn: async (motoristaId: string) => {
      if (!targetEmpresaId) throw new Error("Empresa não identificada");
      return await empresaService.desvincularMotorista(targetEmpresaId, motoristaId);
    },
    onSuccess: () => {
      toast.success("Motorista desvinculado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["motoristas", targetEmpresaId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", targetEmpresaId] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao desvincular motorista.");
    },
  });

  return {
    ...motoristasQuery,
    cadastrarMotorista: cadastrarMutation.mutateAsync,
    isCadastrando: cadastrarMutation.isPending,
    atualizarMotorista: atualizarMutation.mutateAsync,
    isAtualizando: atualizarMutation.isPending,
    alterarStatusMotorista: alterarStatusMutation.mutateAsync,
    isAlterandoStatus: alterarStatusMutation.isPending,
    desvincularMotorista: desvincularMutation.mutateAsync,
    isDesvinculando: desvincularMutation.isPending,
  };
}
