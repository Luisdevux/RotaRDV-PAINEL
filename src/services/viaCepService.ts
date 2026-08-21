// src/services/viaCepService.ts

import axios from 'axios';
import { ViaCepResponse, EnderecoViaCep } from '../types';
import { unmask } from '../lib/masks';

export const viaCepService = {
  async buscarPorCep(cep: string): Promise<EnderecoViaCep | null> {
    const cleanCep = unmask(cep);
    if (cleanCep.length !== 8) {
      return null;
    }

    try {
      const response = await axios.get<ViaCepResponse>(`https://viacep.com.br/ws/${cleanCep}/json/`, {
        timeout: 7000,
      });

      if (response.data.erro) {
        return null;
      }

      return {
        cep: response.data.cep,
        logradouro: response.data.logradouro || '',
        bairro: response.data.bairro || '',
        cidade: response.data.localidade || '',
        estado: response.data.uf || '',
      };
    } catch {
      return null;
    }
  },
};
