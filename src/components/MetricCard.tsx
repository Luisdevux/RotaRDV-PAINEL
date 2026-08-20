// src/components/MetricCard.tsx

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MetricVariant = 
  | "default" 
  | "primary" 
  | "emerald" 
  | "info" 
  | "blue" 
  | "warning" 
  | "amber" 
  | "destructive" 
  | "rose";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: MetricVariant;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  className,
}: MetricCardProps) {
  const variantStyles: Record<MetricVariant, string> = {
    default: "bg-card text-card-foreground",
    primary: "border-primary/30 bg-primary/[0.04]",
    emerald: "border-primary/30 bg-primary/[0.04]",
    info: "border-info/30 bg-info/[0.04]",
    blue: "border-info/30 bg-info/[0.04]",
    warning: "border-warning/30 bg-warning/[0.04]",
    amber: "border-warning/30 bg-warning/[0.04]",
    destructive: "border-destructive/30 bg-destructive/[0.04]",
    rose: "border-destructive/30 bg-destructive/[0.04]",
  };

  const iconStyles: Record<MetricVariant, string> = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/15 text-primary border border-primary/30",
    emerald: "bg-primary/15 text-primary border border-primary/30",
    info: "bg-info/15 text-info border border-info/30",
    blue: "bg-info/15 text-info border border-info/30",
    warning: "bg-warning/15 text-warning border border-warning/30",
    amber: "bg-warning/15 text-warning border border-warning/30",
    destructive: "bg-destructive/15 text-destructive border border-destructive/30",
    rose: "bg-destructive/15 text-destructive border border-destructive/30",
  };

  return (
    <Card className={cn("hover:shadow-md transition-all duration-200", variantStyles[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-extrabold text-foreground tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground font-medium pt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", iconStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
