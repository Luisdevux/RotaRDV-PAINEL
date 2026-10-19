// src/app/(no-auth)/login/page.tsx

import React, { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
