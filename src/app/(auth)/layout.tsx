// src/app/(auth)/layout.tsx

import React from "react";
import { DashboardWrapper } from "@/components/DashboardWrapper";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardWrapper>{children}</DashboardWrapper>;
}
