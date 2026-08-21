// src/components/DashboardWrapper.tsx

"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const { user, isMotorista, isAdmin, logout } = useAuth();

  useEffect(() => {
    if (user && isMotorista && !isAdmin) {
      logout();
    }
  }, [user, isMotorista, isAdmin, logout]);

  if (user && isMotorista && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-xl font-bold text-destructive">Acesso Restrito ao App Mobile</h2>
          <p className="text-sm text-muted-foreground">
            Contas de motorista devem utilizar exclusivamente o aplicativo móvel RotaRDV. Redirecionando...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 w-full animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
