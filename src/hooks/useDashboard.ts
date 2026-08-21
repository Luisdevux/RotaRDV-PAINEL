// src/hooks/useDashboard.ts

import { useQuery } from "@tanstack/react-query";
import { empresaService } from "../services/empresaService";
import { useAuth } from "./useAuth";
import { useActiveEmpresa } from "../providers/ActiveEmpresaProvider";

export function useDashboard(customEmpresaId?: string) {
  const { empresaId: userEmpresaId } = useAuth();
  const { empresaId: activeEmpresaId, empresa } = useActiveEmpresa();
  const targetEmpresaId = customEmpresaId || activeEmpresaId || empresa?._id || userEmpresaId;

  return useQuery({
    queryKey: ["dashboard", targetEmpresaId],
    queryFn: async () => {
      if (!targetEmpresaId) {
        throw new Error("ID da empresa não informado");
      }
      return await empresaService.buscarDashboard(targetEmpresaId);
    },
    enabled: Boolean(targetEmpresaId),
    staleTime: 60 * 1000, // 1 minuto
  });
}

