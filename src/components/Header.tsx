// src/components/Header.tsx

"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, User, Building, ShieldCheck, Menu, ChevronDown, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveEmpresa } from "@/providers/ActiveEmpresaProvider";
import { toast } from "sonner";
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
import Link from "next/link";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Visão Geral", subtitle: "Métricas consolidadas, frotas e despesas operacionais" },
  "/motoristas": { title: "Gestão de Motoristas", subtitle: "Equipe de condutores, credenciais e veículos vinculados" },
  "/veiculos": { title: "Frota de Veículos", subtitle: "Cavalos mecânicos, carretas e implementos rodoviários" },
  "/viagens": { title: "Controle de Viagens", subtitle: "Auditoria de rotas, odômetro inicial/final e status" },
  "/despesas": { title: "Despesas & Comprovantes", subtitle: "Auditoria financeira, abastecimentos e fotos de notas" },
  "/empresas": { title: "Transportadoras Globais", subtitle: "Administração de empresas clientes da plataforma" },
  "/administrativo": { title: "Equipe Administrativa", subtitle: "Gestão de administradores e gestores da transportadora" },
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
  const { user, isAdmin, isSuperAdmin, isAdminEmpresa, isGestor, logout } = useAuth();
  const { empresa, empresas, isLoadingEmpresas, setEmpresaId } = useActiveEmpresa();

  useEffect(() => {
    setMounted(true);
  }, []);

  const pageInfo = PAGE_TITLES[pathname] || {
    title: "Painel de Controle",
    subtitle: "Sistema de Gestão de Despesas e Frotas",
  };

  const getRoleLabel = () => {
    if (isSuperAdmin) return "Super Admin";
    if (isAdminEmpresa) return "Administrador";
    if (isGestor) return "Gestor";
    return user?.role || "Usuário";
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
          <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight tracking-tight truncate max-w-[160px] sm:max-w-[240px] md:max-w-none">
            {pageInfo.title}
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls (Company Selector + Theme Switcher + Profile Menu) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Seletor de Empresa Ativa (Apenas para super administradores) */}
        {isSuperAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 px-3 py-1.5 h-10 rounded-xl border-primary/30 bg-primary/5 hover:bg-primary/10 text-xs font-semibold text-foreground transition-colors max-w-[170px] sm:max-w-[260px]"
                title="Alternar Transportadora Ativa"
              >
                <Building className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">
                  {empresa?.nome_empresa || (isLoadingEmpresas ? "Carregando..." : "Selecione uma Empresa")}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-1.5 rounded-2xl shadow-xl">
              <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-2 py-1.5">
                Transportadora Ativa (Visão Admin)
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-60 overflow-y-auto space-y-1">
                {empresas.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 text-center">Nenhuma transportadora cadastrada.</p>
                ) : (
                  empresas.map((emp) => {
                    const isSelected = String(emp._id) === String(empresa?._id);
                    return (
                      <DropdownMenuItem
                        key={emp._id}
                        onClick={() => {
                          setEmpresaId(emp._id);
                          toast.info(`Empresa ativa: ${emp.nome_empresa}`);
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer ${
                          isSelected ? "bg-primary/10 text-primary font-bold" : ""
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-xs truncate">{emp.nome_empresa}</span>
                          {emp.endereco?.cidade && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              {emp.endereco.cidade}/{emp.endereco.estado}
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </DropdownMenuItem>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Indicador da Empresa Vinculada (Admins Internos e Gestores) */}
        {!isSuperAdmin && empresa && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 h-10 rounded-md border border-border/80 bg-muted/40 text-xs text-foreground font-medium">
            <Building className="h-4 w-4 text-primary shrink-0" />
            <span className="max-w-[160px] md:max-w-[220px] truncate">{empresa.nome_empresa}</span>
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
                  {getRoleLabel()}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl shadow-xl">
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

            {!isSuperAdmin && (isAdminEmpresa || isGestor) && (
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
