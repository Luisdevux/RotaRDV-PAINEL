// src/app/not-found.tsx

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoveLeft, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
      <div className="h-16 w-16 rounded-2xl bg-warning/15 border border-warning/30 text-warning flex items-center justify-center mb-6 shadow-md">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
        404
      </h1>
      <p className="mt-2 text-lg font-semibold text-foreground">
        Página não encontrada
      </p>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        O recurso solicitado não existe ou você não possui permissões para acessá-lo.
      </p>
      <div className="mt-6">
        <Button asChild variant="default" className="gap-2 rounded-xl">
          <Link href="/dashboard">
            <MoveLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
