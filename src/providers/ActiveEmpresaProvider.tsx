"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Empresa } from "../types";
import { empresaService } from "../services/empresaService";

interface ActiveEmpresaContextType {
  empresa: Empresa | null;
  empresaId: string | null;
  isLoadingEmpresa: boolean;
  setEmpresaId: (id: string | null) => void;
  refreshEmpresa: () => Promise<void>;
}

const ActiveEmpresaContext = createContext<ActiveEmpresaContextType>({
  empresa: null,
  empresaId: null,
  isLoadingEmpresa: false,
  setEmpresaId: () => {},
  refreshEmpresa: async () => {},
});

export function ActiveEmpresaProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [isLoadingEmpresa, setIsLoadingEmpresa] = useState<boolean>(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.empresa_id) {
      setEmpresaId(session.user.empresa_id);
    }
  }, [session, status]);

  const loadEmpresa = async (id: string) => {
    try {
      setIsLoadingEmpresa(true);
      const data = await empresaService.buscarPorID(id);
      setEmpresa(data);
    } catch (error) {
      console.error("[ActiveEmpresaProvider] Erro ao carregar empresa:", error);
    } finally {
      setIsLoadingEmpresa(false);
    }
  };

  useEffect(() => {
    if (empresaId) {
      loadEmpresa(empresaId);
    } else {
      setEmpresa(null);
    }
  }, [empresaId]);

  const refreshEmpresa = async () => {
    if (empresaId) {
      await loadEmpresa(empresaId);
    }
  };

  return (
    <ActiveEmpresaContext.Provider
      value={{
        empresa,
        empresaId,
        isLoadingEmpresa,
        setEmpresaId,
        refreshEmpresa,
      }}
    >
      {children}
    </ActiveEmpresaContext.Provider>
  );
}

export const useActiveEmpresa = () => useContext(ActiveEmpresaContext);
