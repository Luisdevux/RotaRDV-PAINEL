// src/hooks/useViaCep.ts

import { useState, useCallback } from 'react';
import { viaCepService } from '../services/viaCepService';
import { EnderecoViaCep } from '../types';
import { toast } from 'sonner';
import { unmask } from '../lib/masks';

export function useViaCep() {
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const consultarCep = useCallback(async (
    cep: string, 
    onSuccess?: (endereco: EnderecoViaCep) => void
  ): Promise<EnderecoViaCep | null> => {
    const cleanCep = unmask(cep);
    if (cleanCep.length !== 8) {
      return null;
    }

    setIsLoadingCep(true);
    try {
      const resultado = await viaCepService.buscarPorCep(cleanCep);
      if (!resultado) {
        toast.error("CEP não encontrado.");
        return null;
      }

      if (onSuccess) {
        onSuccess(resultado);
      }
      toast.success("Endereço preenchido automaticamente!");
      return resultado;
    } catch {
      toast.error("Falha ao consultar o CEP.");
      return null;
    } finally {
      setIsLoadingCep(false);
    }
  }, []);

  return {
    consultarCep,
    isLoadingCep,
  };
}
