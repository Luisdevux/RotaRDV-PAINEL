// src/proxy.ts

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Ignorar arquivos estáticos, chunks, imagens e APIs
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/public") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  const isAuthPage = 
    pathname.startsWith("/login") || 
    pathname.startsWith("/cadastro") || 
    pathname.startsWith("/esqueci-senha") || 
    pathname.startsWith("/redefinir-senha");

  // 2. Se o usuário já está logado
  if (token) {
    // Se o token for de um motorista (sem permissão de admin), bloqueia o acesso ao painel web
    if (token.role === "motorista" && !token.isAdmin) {
      if (!isAuthPage) {
        return NextResponse.redirect(new URL("/login?error=MotoristaRestrito", request.url));
      }
      return NextResponse.next();
    }

    // Se usuário gestor/admin tenta acessar páginas de autenticação, redireciona ao dashboard
    if (isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 3. Rotas protegidas que exigem login
  const protectedRoutes = [
    "/dashboard",
    "/motoristas",
    "/veiculos",
    "/viagens",
    "/despesas",
    "/empresas",
    "/empresa",
    "/perfil",
  ];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)",
  ],
};
