// src/types/next-auth.d.ts

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    error?: string;
    user: {
      id: string;
      role?: "admin" | "gestor" | "motorista";
      empresa_id?: string;
      isAdmin?: boolean;
      cpf?: string;
      telefone?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: "admin" | "gestor" | "motorista";
    empresa_id?: string;
    isAdmin?: boolean;
    cpf?: string;
    telefone?: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "gestor" | "motorista";
    empresa_id?: string;
    isAdmin?: boolean;
    cpf?: string;
    telefone?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}
