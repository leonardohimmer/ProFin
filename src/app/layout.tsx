import type { Metadata } from "next";
import "./styles.css";
import AppLayout from "@/components/AppLayout";
import { ensureDatabaseInitialized } from "@/lib/db-init";

export const metadata: Metadata = {
  title: "Sistema de Gestão Financeira",
  description: "Sistema robusto para gestão financeira com arquitetura Ledger",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await ensureDatabaseInitialized();
  return (
    <html lang="pt-BR">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
