"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Empresa } from "../types";
import { empresaService } from "../services/empresaService";

interface ActiveEmpresaContextType {
  empresa: Empresa | null;
  empresaId: string | null;
  empresas: Empresa[];
  isLoadingEmpresa: boolean;
  isLoadingEmpresas: boolean;
  setEmpresaId: (id: string | null) => void;
  refreshEmpresa: () => Promise<void>;
  refreshEmpresas: () => Promise<void>;
}

const ActiveEmpresaContext = createContext<ActiveEmpresaContextType>({
  empresa: null,
  empresaId: null,
  empresas: [],
  isLoadingEmpresa: false,
  isLoadingEmpresas: false,
  setEmpresaId: () => {},
  refreshEmpresa: async () => {},
  refreshEmpresas: async () => {},
});

export function ActiveEmpresaProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [empresaId, setEmpresaIdState] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoadingEmpresa, setIsLoadingEmpresa] = useState<boolean>(false);
  const [isLoadingEmpresas, setIsLoadingEmpresas] = useState<boolean>(false);

  const isSuperAdmin = session?.user?.role === "superAdmin";
  const isAdminEmpresa = session?.user?.role === "admin";
  const canSwitchEmpresa = Boolean(isSuperAdmin || isAdminEmpresa);
  const userEmpresaId = session?.user?.empresa_id;

  // Carrega as empresas acessíveis (Super Admin Global ou Admin Master com Matriz e Filiais)
  const loadEmpresas = useCallback(async () => {
    if (!canSwitchEmpresa) {
      setEmpresas([]);
      return [];
    }
    try {
      setIsLoadingEmpresas(true);
      const res = await empresaService.listar({ limite: 100 });
      const items: Empresa[] = res?.docs || res?.items || (Array.isArray(res) ? res : []);
      setEmpresas(items);
      return items;
    } catch (error) {
      console.error("[ActiveEmpresaProvider] Erro ao carregar lista de empresas:", error);
      return [];
    } finally {
      setIsLoadingEmpresas(false);
    }
  }, [canSwitchEmpresa]);

  // Define a empresa ativa e persiste a escolha no localStorage
  const setEmpresaId = useCallback((id: string | null) => {
    setEmpresaIdState(id);
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("rotardv_active_empresa_id", id);
      } else {
        localStorage.removeItem("rotardv_active_empresa_id");
      }
    }
  }, []);

  // Inicialização inteligente da empresa ativa
  useEffect(() => {
    if (status === "authenticated") {
      const init = async () => {
        // 1. Usuários operacionais locais (gestor, motorista): estritamente vinculados à sua própria empresa
        if (!canSwitchEmpresa && userEmpresaId) {
          setEmpresaId(userEmpresaId);
          return;
        }

        // 2. Super Admin Global ou Admin Master: carrega empresas e restaura seleção salva ou padrão
        if (canSwitchEmpresa) {
          const list = await loadEmpresas();
          const savedId = typeof window !== "undefined" ? localStorage.getItem("rotardv_active_empresa_id") : null;
          if (savedId && list.some(e => String(e._id) === String(savedId))) {
            setEmpresaId(savedId);
            return;
          }

          if (userEmpresaId && list.some(e => String(e._id) === String(userEmpresaId))) {
            setEmpresaId(userEmpresaId);
            return;
          }

          if (list.length > 0) {
            setEmpresaId(list[0]._id);
          }
        }
      };

      init();
    }
  }, [status, canSwitchEmpresa, userEmpresaId, loadEmpresas, setEmpresaId]);

  // Carrega os dados detalhados da empresa ativa
  const loadEmpresa = useCallback(async (id: string) => {
    try {
      setIsLoadingEmpresa(true);
      const data = await empresaService.buscarPorID(id);
      setEmpresa(data);
    } catch (error) {
      console.error("[ActiveEmpresaProvider] Erro ao carregar dados da empresa ativa:", error);
    } finally {
      setIsLoadingEmpresa(false);
    }
  }, []);

  useEffect(() => {
    if (empresaId) {
      loadEmpresa(empresaId);
    } else {
      setEmpresa(null);
    }
  }, [empresaId, loadEmpresa]);

  const refreshEmpresa = async () => {
    if (empresaId) {
      await loadEmpresa(empresaId);
    }
  };

  const refreshEmpresas = async () => {
    await loadEmpresas();
  };

  return (
    <ActiveEmpresaContext.Provider
      value={{
        empresa,
        empresaId,
        empresas,
        isLoadingEmpresa,
        isLoadingEmpresas,
        setEmpresaId,
        refreshEmpresa,
        refreshEmpresas,
      }}
    >
      {children}
    </ActiveEmpresaContext.Provider>
  );
}

export const useActiveEmpresa = () => useContext(ActiveEmpresaContext);
