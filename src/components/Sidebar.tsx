// src/components/Sidebar.tsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Route, 
  ReceiptText, 
  Building2, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck, 
  Building,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveEmpresa } from "@/providers/ActiveEmpresaProvider";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const LOGO_URL = process.env.NEXT_PUBLIC_APP_LOGO_URL || "https://rota-rdv.web.fslab.dev/7c4bb021-7946-44b4-acc2-cdb9c29aadc2.jpeg";

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export function Sidebar({ mobileOpen = false, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAdmin, isGestor, logout } = useAuth();
  const { empresa } = useActiveEmpresa();
  const [collapsed, setCollapsed] = useState(false);

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "gestor"],
    },
    {
      name: "Motoristas",
      href: "/motoristas",
      icon: Users,
      roles: ["admin", "gestor"],
    },
    {
      name: "Administrativo",
      href: "/administrativo",
      icon: ShieldCheck,
      roles: ["admin", "gestor"],
    },
    {
      name: "Frota de Veículos",
      href: "/veiculos",
      icon: Truck,
      roles: ["admin", "gestor"],
    },
    {
      name: "Viagens",
      href: "/viagens",
      icon: Route,
      roles: ["admin", "gestor"],
    },
    {
      name: "Despesas & Fotos",
      href: "/despesas",
      icon: ReceiptText,
      roles: ["admin", "gestor"],
    },
    {
      name: "Empresas",
      href: "/empresas",
      icon: Building2,
      roles: ["admin"],
    },
    {
      name: "Minha Empresa",
      href: "/empresa/configuracoes",
      icon: Building,
      roles: ["gestor"],
    },
    {
      name: "Meu Perfil",
      href: "/perfil",
      icon: Settings,
      roles: ["admin", "gestor", "motorista"],
    },
  ];

  const filteredNav = navigation.filter((item) => {
    if (isAdmin) return true;
    if (user?.role && item.roles.includes(user.role)) return true;
    return false;
  });

  const renderNavLinks = (isMobile = false) => (
    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
      {filteredNav.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => {
              if (isMobile && setMobileOpen) setMobileOpen(false);
            }}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 group relative",
              isActive
                ? "bg-sidebar-primary/20 text-sidebar-primary font-semibold border border-sidebar-primary/40 shadow-sm"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
            title={collapsed && !isMobile ? item.name : undefined}
          >
            <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/75 group-hover:text-sidebar-foreground")} />
            
            {(!collapsed || isMobile) && <span>{item.name}</span>}

            {isActive && collapsed && !isMobile && (
              <div className="absolute right-2 h-2 w-2 rounded-full bg-sidebar-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );

  const renderUserInfo = (isMobile = false) => (
    <div className="border-t border-sidebar-border p-3">
      <div className={cn("flex items-center gap-3 p-2 rounded-xl bg-sidebar-accent/60 border border-sidebar-border", collapsed && !isMobile ? "justify-center" : "justify-between")}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Avatar className="h-9 w-9 border border-sidebar-border shadow-sm shrink-0">
            <AvatarImage src={user?.image || ""} alt={user?.name || "Foto de perfil"} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-bold text-xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : "RD"}
            </AvatarFallback>
          </Avatar>
          {(!collapsed || isMobile) && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold truncate text-sidebar-foreground">{user?.name || "Usuário"}</span>
              <span className="text-[10px] text-sidebar-foreground/70 flex items-center gap-1">
                {isAdmin ? (
                  <Badge variant="destructive" className="px-1.5 py-0 text-[9px] h-4">Admin</Badge>
                ) : (
                  <Badge variant="outline" className="px-1.5 py-0 text-[9px] h-4 text-sidebar-primary border-sidebar-primary/40">Gestor</Badge>
                )}
              </span>
            </div>
          )}
        </div>

        {(!collapsed || isMobile) && (
          <button
            onClick={logout}
            className="p-1.5 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/15 rounded-lg transition-colors"
            title="Sair da conta"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 z-30 h-screen sticky top-0 shrink-0",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Top Header Logo */}
        <div className="flex h-20 items-center justify-between px-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-sidebar-border shadow-sm bg-black/20">
              <SafeImage
                src={LOGO_URL}
                alt="RotaRDV Logo"
                fill
                className="object-cover"
                priority
                fallbackType="building"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-tight text-sidebar-foreground">
                  Rota<span className="text-sidebar-primary">RDV</span>
                </span>
                <span className="text-[11px] text-sidebar-foreground/70 font-medium truncate max-w-[140px]">
                  {isAdmin ? "Painel Master" : (empresa?.nome_empresa || "Gestão de Frotas")}
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent/60 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Empresa Ativa Badge */}
        {!collapsed && empresa && isGestor && (
          <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-sidebar-accent/80 border border-sidebar-border flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary/20 border border-sidebar-primary/40 flex items-center justify-center text-sidebar-primary shrink-0">
              <Building className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate text-sidebar-foreground">{empresa.nome_empresa}</p>
              <p className="text-[10px] text-sidebar-foreground/70">CNPJ: {empresa.cnpj}</p>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        {renderNavLinks(false)}

        {/* User Info & Logout Footer */}
        {renderUserInfo(false)}
      </aside>

      {/* 2. Mobile Drawer (Overlay + Drawer Sidebar) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setMobileOpen?.(false)}
          />

          {/* Drawer Content */}
          <aside className="relative flex flex-col w-72 max-w-[85vw] h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-2xl z-50 animate-in slide-in-from-left duration-300">
            {/* Top Header Logo + Close Button */}
            <div className="flex h-20 items-center justify-between px-4 border-b border-sidebar-border">
              <Link 
                href="/dashboard" 
                onClick={() => setMobileOpen?.(false)}
                className="flex items-center gap-3 overflow-hidden"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-sidebar-border shadow-sm bg-black/20">
                  <SafeImage
                    src={LOGO_URL}
                    alt="RotaRDV Logo"
                    fill
                    className="object-cover"
                    priority
                    fallbackType="building"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-tight tracking-tight text-sidebar-foreground">
                    Rota<span className="text-sidebar-primary">RDV</span>
                  </span>
                  <span className="text-[11px] text-sidebar-foreground/70 font-medium truncate max-w-[140px]">
                    {isAdmin ? "Painel Master" : (empresa?.nome_empresa || "Gestão de Frotas")}
                  </span>
                </div>
              </Link>

              <button
                onClick={() => setMobileOpen?.(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent/60 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                title="Fechar menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Empresa Ativa Badge */}
            {empresa && isGestor && (
              <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-sidebar-accent/80 border border-sidebar-border flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-sidebar-primary/20 border border-sidebar-primary/40 flex items-center justify-center text-sidebar-primary shrink-0">
                  <Building className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold truncate text-sidebar-foreground">{empresa.nome_empresa}</p>
                  <p className="text-[10px] text-sidebar-foreground/70">CNPJ: {empresa.cnpj}</p>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            {renderNavLinks(true)}

            {/* User Info & Logout Footer */}
            {renderUserInfo(true)}
          </aside>
        </div>
      )}
    </>
  );
}
