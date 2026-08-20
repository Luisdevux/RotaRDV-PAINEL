// src/types/api.ts

export interface ApiResponse<T = any> {
  erro: boolean;
  mensagem: string;
  statusCode?: number;
  dados?: T;
  data?: T;
}

export interface PaginatedResult<T> {
  docs?: T[];
  items?: T[];
  totalDocs?: number;
  total?: number;
  count?: number;
  limit?: number;
  limite?: number;
  page?: number;
  pagina?: number;
  totalPages?: number;
  total_paginas?: number;
  paginas?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  nextPage?: number | null;
  prevPage?: number | null;
  pagingCounter?: number;
}
