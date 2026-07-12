import type { Metadata } from "next";
import "./styles.css";
import AppLayout from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "Sistema de Gestão Financeira",
  description: "Sistema robusto para gestão financeira com arquitetura Ledger",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
