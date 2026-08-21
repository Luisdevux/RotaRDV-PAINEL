// src/hooks/useEmpresa.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { empresaService } from "../services/empresaService";
import { useAuth } from "./useAuth";
import { useActiveEmpresa } from "../providers/ActiveEmpresaProvider";
import { AtualizarEmpresaInput, CriarEmpresaInput, EmpresaStatus } from "../types";
import { toast } from "sonner";

export function useEmpresa(customId?: string) {
  const queryClient = useQueryClient();
  const { empresaId: userEmpresaId } = useAuth();
  const { empresaId: activeEmpresaId, empresa: activeEmpresa } = useActiveEmpresa();
  const empresaId = customId || activeEmpresaId || activeEmpresa?._id || userEmpresaId;

  const empresaQuery = useQuery({
    queryKey: ["empresa", empresaId],
    queryFn: async () => {
      if (!empresaId) return null;
      return await empresaService.buscarPorID(empresaId);
    },
    enabled: Boolean(empresaId),
  });

  const atualizarMutation = useMutation({
    mutationFn: async (data: AtualizarEmpresaInput) => {
      if (!empresaId) throw new Error("ID da empresa não informado");
      return await empresaService.atualizar(empresaId, data);
    },
    onSuccess: () => {
      toast.success("Dados da transportadora atualizados!");
      queryClient.invalidateQueries({ queryKey: ["empresa", empresaId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", empresaId] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao atualizar dados da empresa.");
    },
  });

  const uploadFotoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!empresaId) throw new Error("ID da empresa não informado");
      return await empresaService.uploadFoto(empresaId, file);
    },
    onSuccess: () => {
      toast.success("Foto atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["empresa", empresaId] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao enviar foto.");
    },
  });

  const deletarFotoMutation = useMutation({
    mutationFn: async () => {
      if (!empresaId) throw new Error("ID da empresa não informado");
      return await empresaService.deletarFoto(empresaId);
    },
    onSuccess: () => {
      toast.success("Foto removida com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["empresa", empresaId] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao remover foto.");
    },
  });

  return {
    ...empresaQuery,
    empresa: empresaQuery.data,
    atualizarEmpresa: atualizarMutation.mutateAsync,
    isAtualizando: atualizarMutation.isPending,
    uploadFoto: uploadFotoMutation.mutateAsync,
    isUploadingFoto: uploadFotoMutation.isPending,
    deletarFoto: deletarFotoMutation.mutateAsync,
    isDeletandoFoto: deletarFotoMutation.isPending,
  };
}

export function useEmpresasAdmin(params?: { page?: number; limite?: number; search?: string; status?: string }) {
  const queryClient = useQueryClient();

  const empresasQuery = useQuery({
    queryKey: ["empresas", params],
    queryFn: async () => {
      return await empresaService.listar(params);
    },
  });

  const criarEmpresaMutation = useMutation({
    mutationFn: async (data: CriarEmpresaInput) => {
      return await empresaService.criar(data);
    },
    onSuccess: () => {
      toast.success("Empresa cadastrada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao cadastrar empresa.");
    },
  });

  const alterarStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EmpresaStatus }) => {
      return await empresaService.atualizarStatus(id, status);
    },
    onSuccess: () => {
      toast.success("Status da empresa atualizado!");
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao alterar status da empresa.");
    },
  });

  return {
    ...empresasQuery,
    criarEmpresa: criarEmpresaMutation.mutateAsync,
    isCriando: criarEmpresaMutation.isPending,
    alterarStatus: alterarStatusMutation.mutateAsync,
    isAlterandoStatus: alterarStatusMutation.isPending,
  };
}
