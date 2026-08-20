// src/components/Sidebar.tsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Building
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveEmpresa } from "@/providers/ActiveEmpresaProvider";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const LOGO_URL = process.env.NEXT_PUBLIC_APP_LOGO_URL || "https://rota-rdv.web.fslab.dev/7c4bb021-7946-44b4-acc2-cdb9c29aadc2.jpeg";

export function Sidebar() {
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

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border/80 bg-card transition-all duration-300 z-30 h-screen sticky top-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Top Header Logo */}
      <div className="flex h-20 items-center justify-between px-4 border-b border-border/60">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border shadow-sm bg-black/20">
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
              <span className="font-bold text-lg leading-tight tracking-tight text-foreground">
                Rota<span className="text-primary">RDV</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[140px]">
                {isAdmin ? "Painel Master" : (empresa?.nome_empresa || "Gestão de Frotas")}
              </span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Empresa Ativa Badge */}
      {!collapsed && empresa && isGestor && (
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-muted/40 border border-border/50 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <Building className="h-4 w-4" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold truncate text-foreground">{empresa.nome_empresa}</p>
            <p className="text-[10px] text-muted-foreground">CNPJ: {empresa.cnpj}</p>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-primary/15 text-primary font-semibold border border-primary/30 shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              
              {!collapsed && <span>{item.name}</span>}

              {isActive && (
                <div className="absolute right-2 h-2 w-2 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User Info & Logout Footer */}
      <div className="border-t border-border/60 p-3">
        <div className={cn("flex items-center gap-3 p-2 rounded-xl bg-muted/30 border border-border/40", collapsed ? "justify-center" : "justify-between")}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Avatar className="h-9 w-9 border border-border shadow-sm shrink-0">
              <AvatarImage src={user?.image || ""} alt={user?.name || "Foto de perfil"} />
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "RD"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold truncate text-foreground">{user?.name || "Usuário"}</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  {isAdmin ? (
                    <Badge variant="destructive" className="px-1.5 py-0 text-[9px] h-4">Admin</Badge>
                  ) : (
                    <Badge variant="outline" className="px-1.5 py-0 text-[9px] h-4 text-primary border-primary/40">Gestor</Badge>
                  )}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
