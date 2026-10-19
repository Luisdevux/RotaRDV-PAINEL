// src/app/(no-auth)/cadastro/page.tsx

import React, { Suspense } from "react";
import SignupForm from "@/components/SignupForm";

export default function CadastroPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
        <SignupForm />
      </Suspense>
    </main>
  );
}
