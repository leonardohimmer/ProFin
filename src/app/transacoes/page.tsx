import React, { Suspense } from "react";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import TransactionsView from "@/components/TransactionsView";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function TransacoesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const now = new Date();
  const selectedMonth = resolvedSearchParams?.month !== undefined ? parseInt(resolvedSearchParams.month, 10) : now.getMonth();
  const selectedYear = resolvedSearchParams?.year !== undefined ? parseInt(resolvedSearchParams.year, 10) : now.getFullYear();

  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
  const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

  const headerList = await headers();
  const userId = headerList.get("x-user-id") || "test-user-id";

  // Busca todas as ledger entries do usuário no período selecionado
  const entries = await prisma.ledgerEntry.findMany({
    where: { 
      account: { userId: userId },
      createdAt: {
        gte: firstDayOfMonth,
        lte: lastDayOfMonth
      }
    },
    include: {
      transaction: true,
      account: true
    },
    orderBy: { createdAt: "desc" }
  });

  // Calcula o saldo total das contas do banco (saldo acumulado geral)
  const accounts = await prisma.account.findMany({
    where: { userId: userId },
    include: { entries: true }
  });

  let totalBankBalance = 0;
  accounts.forEach(acc => {
    acc.entries.forEach(entry => {
      if (entry.type === "CREDIT") {
        totalBankBalance += entry.amount;
      } else {
        totalBankBalance -= entry.amount;
      }
    });
  });

  // Calcula receitas e despesas do mês selecionado
  let monthlyIncome = 0;
  let monthlyExpenses = 0;

  entries.forEach(entry => {
    // Ignora lançamentos de ajuste de saldo inicial
    if (entry.transaction.description.includes("Ajuste")) {
      return;
    }

    if (entry.type === "CREDIT") {
      monthlyIncome += entry.amount;
    } else {
      monthlyExpenses += entry.amount;
    }
  });

  // Converte a lista de ledger entries para o formato do componente
  const formattedEntries = entries.map(entry => ({
    id: entry.id,
    createdAt: entry.createdAt.toISOString(),
    type: entry.type as "CREDIT" | "DEBIT",
    amount: entry.amount,
    accountName: entry.account?.name || "Conta Principal",
    transaction: {
      id: entry.transaction.id,
      description: entry.transaction.description,
      contact: entry.transaction.contact,
      categoryName: entry.transaction.categoryName,
      paymentType: entry.transaction.paymentType,
      paymentMethod: entry.transaction.paymentMethod,
      isPaid: entry.transaction.isPaid
    }
  }));

  return (
    <Suspense fallback={null}>
      <TransactionsView
        entries={formattedEntries}
        totalBankBalance={totalBankBalance}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />
    </Suspense>
  );
}
