"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "./ThemeProvider";
import { ActiveEmpresaProvider } from "./ActiveEmpresaProvider";

function SessionAuthHandler({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      console.warn("[Auth] Sessão expirada e não pôde ser renovada. Redirecionando para login...");
      signOut({ callbackUrl: "/login" });
    }
  }, [session]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <SessionAuthHandler>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ActiveEmpresaProvider>
              {children}
              <Toaster position="top-right" richColors closeButton />
            </ActiveEmpresaProvider>
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </SessionAuthHandler>
    </SessionProvider>
  );
}
