// src/components/Header.tsx

"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, User, Building, ShieldCheck, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveEmpresa } from "@/providers/ActiveEmpresaProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Visão Geral", subtitle: "Métricas consolidadas, frotas e despesas operacionais" },
  "/motoristas": { title: "Gestão de Motoristas", subtitle: "Equipe de condutores, credenciais e veículos vinculados" },
  "/veiculos": { title: "Frota de Veículos", subtitle: "Cavalos mecânicos, carretas e implementos rodoviários" },
  "/viagens": { title: "Controle de Viagens", subtitle: "Auditoria de rotas, odômetro inicial/final e status" },
  "/despesas": { title: "Despesas & Comprovantes", subtitle: "Auditoria financeira, abastecimentos e fotos de notas" },
  "/empresas": { title: "Transportadoras Globais", subtitle: "Administração de empresas clientes da plataforma" },
  "/empresa/configuracoes": { title: "Dados da Transportadora", subtitle: "CNPJ, endereços e logotipo corporativo" },
  "/perfil": { title: "Meu Perfil", subtitle: "Informações pessoais e credenciais de acesso" },
};

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, isAdmin, isGestor, logout } = useAuth();
  const { empresa } = useActiveEmpresa();

  useEffect(() => {
    setMounted(true);
  }, []);

  const pageInfo = PAGE_TITLES[pathname] || {
    title: "Painel de Controle",
    subtitle: "Sistema de Gestão de Despesas e Frotas",
  };

  return (
    <header className="sticky top-0 z-20 flex h-20 w-full items-center justify-between border-b border-border/80 bg-background/95 backdrop-blur-md px-4 sm:px-6">
      {/* Page Title & Subtitle + Mobile Hamburger */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="md:hidden rounded-xl border-border/80 h-10 w-10 shrink-0"
          onClick={onOpenMobileMenu}
          title="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight tracking-tight truncate max-w-[200px] sm:max-w-none">
            {pageInfo.title}
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls (Theme Switcher + Profile Menu) */}
      <div className="flex items-center gap-3">
        {/* Empresa Badge */}
        {empresa && isGestor && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 text-xs text-foreground font-medium">
            <Building className="h-3.5 w-3.5 text-primary" />
            <span className="max-w-[180px] truncate">{empresa.nome_empresa}</span>
          </div>
        )}

        {/* Theme Toggle Button */}
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl border-border/80 hover:bg-muted"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Alternar tema claro/escuro"
        >
          {mounted ? (
            theme === "dark" ? (
              <Sun className="h-4 w-4 text-warning transition-all" />
            ) : (
              <Moon className="h-4 w-4 text-foreground transition-all" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-muted"
            >
              <Avatar className="h-9 w-9 border border-border/80">
                <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : "RD"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start text-left">
                <span className="text-xs font-semibold text-foreground max-w-[120px] truncate">
                  {user?.name || "Usuário"}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize">
                  {isAdmin ? "Administrador" : (user?.role || "Gestor")}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-1.5">
            <DropdownMenuLabel className="font-normal p-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-foreground">
                  {user?.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/perfil" className="cursor-pointer">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Meu Perfil</span>
              </Link>
            </DropdownMenuItem>

            {isGestor && (
              <DropdownMenuItem asChild>
                <Link href="/empresa/configuracoes" className="cursor-pointer">
                  <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Dados da Transportadora</span>
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair da conta</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
