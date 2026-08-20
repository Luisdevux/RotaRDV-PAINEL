// src/lib/auth.ts

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { JWT } from "next-auth/jwt";

const API_URL = process.env.API_URL_SERVER_SIDED || process.env.NEXT_PUBLIC_API_URL || "https://rotardv-api.luisfelipe.dpdns.org";

/**
 * Extrai a expiração real do token JWT para sincronizar com o NextAuth (com margem de 1 minuto)
 */
function getTokenExpiration(token: string): number {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    return (decoded.exp * 1000) - (60 * 1000);
  } catch {
    return Date.now() + (30 * 60 * 1000); // 30 min fallback
  }
}

/**
 * Helper para renovar o access token usando o refresh token
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(`${API_URL}/refresh`, {
      refresh_token: token.refreshToken,
    });

    const data = response.data?.dados || response.data?.data;
    const apiUser = data?.user;

    if (!apiUser) {
      throw new Error("Falha ao renovar token: Resposta inválida");
    }

    const newAccessToken = apiUser.accessToken || apiUser.accesstoken;

    return {
      ...token,
      accessToken: newAccessToken,
      refreshToken: apiUser.refreshtoken || apiUser.refreshToken || token.refreshToken,
      accessTokenExpires: getTokenExpiration(newAccessToken),
    };
  } catch (error) {
    console.error("[NextAuth] Erro ao renovar access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "RotaRDV Gestor",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          const response = await axios.post(`${API_URL}/login`, {
            email: credentials?.email,
            senha: credentials?.password,
          });

          const data = response.data?.dados || response.data?.data;
          const apiUser = data?.user;

          if (apiUser) {
            const isAdm = Boolean(apiUser.isAdmin || apiUser.role === "admin");
            const isGest = apiUser.role === "gestor";

            // Apenas motoristas comuns (não admins) são restritos ao app
            if (!isAdm && !isGest && apiUser.role === "motorista") {
              throw new Error("Acesso restrito. Motoristas devem utilizar exclusivamente o aplicativo móvel RotaRDV.");
            }

            return {
              id: apiUser._id,
              name: apiUser.nome,
              email: apiUser.email,
              role: isAdm ? "admin" : (apiUser.role || "gestor"),
              empresa_id: apiUser.empresa_id,
              isAdmin: isAdm,
              image: apiUser.foto_perfil,
              accessToken: apiUser.accessToken || apiUser.accesstoken,
              refreshToken: apiUser.refreshtoken || apiUser.refreshToken,
            };
          }
          return null;
        } catch (error: any) {
          const message = error.message || error.response?.data?.mensagem || "Falha na autenticação. Verifique suas credenciais.";
          throw new Error(message);
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const response = await axios.post(`${API_URL}/google`, {
            idToken: account.id_token,
          });

          const data = response.data?.dados || response.data?.data;
          const apiUser = data?.user;

          if (apiUser) {
            const isAdm = Boolean(apiUser.isAdmin || apiUser.role === "admin");
            const isGest = apiUser.role === "gestor";

            // Apenas motoristas comuns (não admins) são restritos ao app
            if (!isAdm && !isGest && apiUser.role === "motorista") {
              console.warn(`[NextAuth] Acesso restrito: Motorista (${apiUser.email}) tentou acessar o painel web.`);
              return "/login?error=MotoristaRestrito";
            }

            user.id = apiUser._id;
            user.name = apiUser.nome;
            user.email = apiUser.email;
            user.role = isAdm ? "admin" : (apiUser.role || "gestor");
            user.empresa_id = apiUser.empresa_id;
            user.isAdmin = isAdm;
            user.image = apiUser.foto_perfil || user.image;
            user.accessToken = apiUser.accessToken || apiUser.accesstoken;
            user.refreshToken = apiUser.refreshtoken || apiUser.refreshToken;
            return true;
          }
          return false;
        } catch (error) {
          console.error("[NextAuth] Erro no login com Google:", error);
          return "/login?error=GoogleAuthFailed";
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // Quando o usuário acabou de logar (Credentials ou Google)
      if (user) {
        const accessToken = user.accessToken || "";
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        token.role = user.role;
        token.empresa_id = user.empresa_id;
        token.isAdmin = user.isAdmin;
        token.accessToken = accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = getTokenExpiration(accessToken);
        return token;
      }

      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
        session.user.role = token.role as any;
        session.user.empresa_id = token.empresa_id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.error = token.error as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
};
