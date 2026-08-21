// src/app/(auth)/dashboard/page.tsx

"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useActiveEmpresa } from "@/providers/ActiveEmpresaProvider";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatKM, formatConsumo } from "@/lib/formatters";
import { 
  Users, 
  Truck, 
  Route, 
  ReceiptText, 
  Fuel, 
  Utensils, 
  Wrench, 
  DollarSign, 
  Building2,
  ArrowUpRight,
  TrendingUp,
  PlusCircle
} from "lucide-react";
import Link from "next/link";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  ABASTECIMENTO: "hsl(var(--chart-1))",
  ALIMENTACAO: "hsl(var(--chart-2))",
  MANUTENCAO: "hsl(var(--chart-3))",
  PEDAGIO: "hsl(var(--chart-4))",
  OUTROS: "hsl(var(--chart-5))",
};

const CATEGORY_LABELS: Record<string, string> = {
  ABASTECIMENTO: "Abastecimento",
  ALIMENTACAO: "Alimentação",
  MANUTENCAO: "Manutenção",
  PEDAGIO: "Pedágio",
  OUTROS: "Outros",
};

export default function DashboardPage() {
  const { user, isAdmin, isGestor } = useAuth();
  const { empresa, empresaId } = useActiveEmpresa();
  const { data: dashboardData, isLoading } = useDashboard(empresa?._id || empresaId || undefined);

  const resumo = dashboardData?.resumo || {
    total_motoristas: 0,
    total_veiculos: 0,
    viagens_em_andamento: 0,
    viagens_concluidas: 0,
    total_km_rodado: 0,
    total_litros: 0,
    media_consumo_frota: 0,
    total_despesas: 0,
    despesas_por_categoria: {
      ABASTECIMENTO: 0,
      ALIMENTACAO: 0,
      MANUTENCAO: 0,
      PEDAGIO: 0,
      OUTROS: 0,
    },
  };

  const pieData = Object.entries(resumo.despesas_por_categoria || {}).map(([key, value]) => ({
    name: CATEGORY_LABELS[key] || key,
    value: Number(value) || 0,
    color: CATEGORY_COLORS[key] || "hsl(var(--muted))",
  })).filter((item) => item.value > 0);

  const barData = Object.entries(resumo.despesas_por_categoria || {}).map(([key, value]) => ({
    categoria: CATEGORY_LABELS[key] || key,
    valor: Number(value) || 0,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-card via-muted/30 to-card border border-border/70 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Olá, {user?.name?.split(" ")[0] || "Gestor"}! 👋
          </h2>
          <p className="text-xs text-muted-foreground">
            {empresa ? `Gerenciando a frota da ${empresa.nome_empresa}` : "Bem-vindo ao centro de controle operacional RotaRDV."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="default" className="rounded-xl font-semibold gap-2 shadow-md">
            <Link href="/motoristas">
              <PlusCircle className="h-4 w-4" />
              Novo Motorista
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl font-semibold gap-2">
            <Link href="/veiculos">
              <Truck className="h-4 w-4" />
              Frota
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Motoristas Ativos"
          value={resumo.total_motoristas}
          subtitle={`Frota de ${resumo.total_veiculos} veículos`}
          icon={Users}
          variant="success"
        />
        <MetricCard
          title="Viagens em Andamento"
          value={resumo.viagens_em_andamento}
          subtitle={`${resumo.viagens_concluidas} concluídas`}
          icon={Route}
          variant="info"
        />
        <MetricCard
          title="Distância Total"
          value={formatKM(resumo.total_km_rodado)}
          subtitle={resumo.media_consumo_frota ? `Média da frota: ${formatConsumo(resumo.media_consumo_frota)}` : "Quilômetros auditados"}
          icon={TrendingUp}
          variant="warning"
        />
        <MetricCard
          title="Despesas Operacionais"
          value={formatCurrency(resumo.total_despesas)}
          subtitle={resumo.total_litros ? `${resumo.total_litros.toLocaleString('pt-BR')}L de combustível` : "Comprovantes lançados"}
          icon={ReceiptText}
          variant="destructive"
        />
      </div>

      {/* Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Despesas por Categoria (Donut Chart) */}
        <Card className="lg:col-span-1 rounded-2xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-primary" />
              Divisão de Gastos
            </CardTitle>
            <CardDescription className="text-xs">
              Distribuição percentual por tipo de despesa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), "Total"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "hsl(var(--foreground))",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                      }}
                      itemStyle={{
                        color: "hsl(var(--foreground))",
                        fontWeight: 600,
                      }}
                      labelStyle={{
                        color: "hsl(var(--foreground))",
                        fontWeight: 700,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-center text-muted-foreground text-xs p-4">
                Nenhuma despesa registrada para exibir o gráfico.
              </div>
            )}

            {/* Category Legend Badges */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/60">
              {Object.entries(resumo.despesas_por_categoria || {}).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs">
                  <div 
                    className="h-2.5 w-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: CATEGORY_COLORS[key] || "hsl(var(--muted))" }} 
                  />
                  <span className="text-muted-foreground truncate">{CATEGORY_LABELS[key]}:</span>
                  <span className="font-semibold text-foreground ml-auto">{formatCurrency(val)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Despesas em Barra (Bar Chart) */}
        <Card className="lg:col-span-2 rounded-2xl border-border/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-info" />
                Comparativo de Custos Operacionais
              </CardTitle>
              <CardDescription className="text-xs">
                Valores consolidados em Reais (BRL)
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs text-primary hover:text-primary/80">
              <Link href="/despesas">
                Ver todas
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {barData.some((d) => d.valor > 0) ? (
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis 
                      dataKey="categoria" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(v) => `R$ ${v}`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), "Valor Total"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "hsl(var(--foreground))",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                      }}
                      itemStyle={{
                        color: "hsl(var(--foreground))",
                        fontWeight: 600,
                      }}
                      labelStyle={{
                        color: "hsl(var(--foreground))",
                        fontWeight: 700,
                      }}
                    />
                    <Bar dataKey="valor" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-center text-muted-foreground text-xs">
                Inicie viagens e lance despesas para visualizar os gráficos analíticos.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/viagens"
          className="p-5 rounded-2xl bg-card border border-border/70 hover:border-primary/50 hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Auditoria de Viagens
            </h4>
            <p className="text-xs text-muted-foreground">
              Acompanhe odômetros, condutores e rotas em tempo real
            </p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-muted group-hover:bg-primary/15 group-hover:text-primary text-muted-foreground flex items-center justify-center transition-colors">
            <Route className="h-4 w-4" />
          </div>
        </Link>

        <Link 
          href="/despesas"
          className="p-5 rounded-2xl bg-card border border-border/70 hover:border-primary/50 hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Notas & Comprovantes
            </h4>
            <p className="text-xs text-muted-foreground">
              Visualize fotos de abastecimento e recibos fiscais com zoom
            </p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-muted group-hover:bg-primary/15 group-hover:text-primary text-muted-foreground flex items-center justify-center transition-colors">
            <ReceiptText className="h-4 w-4" />
          </div>
        </Link>

        <Link 
          href="/motoristas"
          className="p-5 rounded-2xl bg-card border border-border/70 hover:border-primary/50 hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
              Equipe de Motoristas
            </h4>
            <p className="text-xs text-muted-foreground">
              Cadastre novos condutores e vincule caminhões da frota
            </p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-muted group-hover:bg-primary/15 group-hover:text-primary text-muted-foreground flex items-center justify-center transition-colors">
            <Users className="h-4 w-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
