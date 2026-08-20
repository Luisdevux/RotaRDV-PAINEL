// src/hooks/useAuth.ts

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoginCredentials, SignupEmpresaData } from "../types";
import { authService } from "../services/authService";
import { useMutation } from "@tanstack/react-query";

export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const user = session?.user;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const result = await signIn("credentials", {
        redirect: false,
        email: credentials.email,
        password: credentials.senha,
      });

      if (result?.error) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      window.location.replace("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao efetuar login.");
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupEmpresaData) => {
      return await authService.signupEmpresa(data);
    },
    onSuccess: () => {
      toast.success("Transportadora cadastrada com sucesso! Faça seu login.");
      router.push("/login");
    },
    onError: (error: any) => {
      toast.error(error.friendlyMessage || "Erro ao cadastrar transportadora.");
    },
  });

  const loginWithGoogle = async () => {
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      toast.error("Erro ao autenticar com Google.");
    }
  };

  const logout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return {
    session,
    user,
    isLoading,
    isAuthenticated,
    isAdmin: Boolean(user?.isAdmin || user?.role === "admin"),
    isGestor: user?.role === "gestor",
    isMotorista: user?.role === "motorista",
    empresaId: user?.empresa_id,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    signup: signupMutation.mutateAsync,
    isSigningUp: signupMutation.isPending,
    loginWithGoogle,
    logout,
    updateSession: update,
  };
}
