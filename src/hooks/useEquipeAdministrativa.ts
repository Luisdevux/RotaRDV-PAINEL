// src/hooks/useEquipeAdministrativa.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usuarioService } from "../services/usuarioService";
import { useAuth } from "./useAuth";
import { useActiveEmpresa } from "../providers/ActiveEmpresaProvider";
import { 
  Usuario, 
  CriarMembroAdministrativoInput, 
  AtualizarMembroAdministrativoInput, 
  AtualizarUsuarioInput, 
  UserStatus 
} from "../types";
import { unmask } from "../lib/masks";
import { toast } from "sonner";

interface UseEquipeAdministrativaOptions {
  roleFilter?: string;
  statusFilter?: string;
}

export function useEquipeAdministrativa(options?: UseEquipeAdministrativaOptions) {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const { empresa } = useActiveEmpresa();

  const roleFilter = options?.roleFilter || "todos";
  const statusFilter = options?.statusFilter || "todos";

  const equipeQuery = useQuery({
    queryKey: ["equipe-administrativa", empresa?._id, roleFilter, statusFilter],
    queryFn: async () => {
      const roleParam = roleFilter === "todos" ? undefined : roleFilter;
      const statusParam = statusFilter !== "todos" ? statusFilter : undefined;
      const empresaIdParam = !isAdmin && empresa?._id ? empresa._id : undefined;

      return await usuarioService.listar({
        limite: 100,
        role: roleParam,
        status: statusParam,
        empresa_id: empresaIdParam,
      });
    },
  });

  const cadastrarMutation = useMutation({
    mutationFn: async (data: CriarMembroAdministrativoInput) => {
      const payload: AtualizarUsuarioInput = {
        nome: data.nome,
        email: data.email,
        cpf: data.cpf ? unmask(data.cpf) : undefined,
        telefone: data.telefone ? unmask(data.telefone) : undefined,
        empresa_id: empresa?._id,
        empresa: {
          nome: empresa?.nome_empresa,
          cargo: data.cargo,
        },
        role: data.role,
        isAdmin: data.role === "admin",
      };
      return await usuarioService.atualizar(data.email, payload);
    },
    onSuccess: () => {
      toast.success("Membro administrativo cadastrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["equipe-administrativa"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao cadastrar membro da equipe.");
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AtualizarMembroAdministrativoInput }) => {
      const payload: AtualizarUsuarioInput = {
        nome: data.nome,
        cpf: data.cpf ? unmask(data.cpf) : undefined,
        telefone: data.telefone ? unmask(data.telefone) : undefined,
        role: data.role,
        isAdmin: data.role === "admin",
        empresa: {
          cargo: data.cargo,
        },
      };
      return await usuarioService.atualizar(id, payload);
    },
    onSuccess: () => {
      toast.success("Nível de acesso e cargo atualizados com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["equipe-administrativa"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao atualizar permissões do membro.");
    },
  });

  const alterarStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: UserStatus }) => {
      return await usuarioService.atualizarStatus(id, status);
    },
    onSuccess: (_, variables) => {
      toast.success(`Usuário ${variables.status === "ativo" ? "ativado" : "inativado"} com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["equipe-administrativa"] });
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao alterar status do usuário.");
    },
  });

  const rawMembros: Usuario[] = 
    equipeQuery.data?.docs || 
    equipeQuery.data?.items || 
    (Array.isArray(equipeQuery.data) ? equipeQuery.data : []);

  // Garante que apenas membros da equipe administrativa (admin e gestor) sejam considerados
  const membros = rawMembros.filter((m) => m.role === "admin" || m.role === "gestor" || m.isAdmin);

  return {
    ...equipeQuery,
    membros,
    cadastrarMembro: cadastrarMutation.mutateAsync,
    isCadastrando: cadastrarMutation.isPending,
    atualizarMembro: atualizarMutation.mutateAsync,
    isAtualizando: atualizarMutation.isPending,
    alterarStatusMembro: alterarStatusMutation.mutateAsync,
    isAlterandoStatus: alterarStatusMutation.isPending,
  };
}
