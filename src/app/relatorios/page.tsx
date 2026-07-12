import React from "react";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import ReportsView from "@/components/ReportsView";

export default async function RelatoriosPage() {
  const headerList = await headers();
  const userId = headerList.get("x-user-id") || "test-user-id";

  // Busca todas as transações e entradas do usuário
  const entries = await prisma.ledgerEntry.findMany({
    where: {
      account: { userId: userId }
    },
    include: {
      transaction: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  // Filtra transações que não sejam ajustes iniciais de saldo
  const activeEntries = entries.filter(e => !e.transaction.description.includes("Ajuste"));

  // 1. Agrupamento por mês para fluxo de caixa (últimos 6 meses)
  const monthlyFlow: Record<string, { income: number; expense: number }> = {};
  
  activeEntries.forEach(entry => {
    const date = new Date(entry.createdAt);
    const monthKey = date.toLocaleString("pt-BR", { month: "short", year: "2-digit" }); // e.g. "jun/26"

    if (!monthlyFlow[monthKey]) {
      monthlyFlow[monthKey] = { income: 0, expense: 0 };
    }

    if (entry.type === "CREDIT") {
      monthlyFlow[monthKey].income += entry.amount;
    } else {
      monthlyFlow[monthKey].expense += entry.amount;
    }
  });

  const cashFlowData = Object.entries(monthlyFlow).map(([month, data]) => ({
    month,
    income: data.income,
    expense: data.expense
  })).slice(-6); // Pega no máximo os últimos 6 meses

  // 2. Agrupamento por categorias (despesas do mês atual)
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const currentMonthEntries = activeEntries.filter(entry => new Date(entry.createdAt) >= firstDayOfMonth);

  const categoryTotals: Record<string, number> = {};
  let totalExpenses = 0;
  let totalIncome = 0;

  currentMonthEntries.forEach(entry => {
    if (entry.type === "DEBIT") {
      const catName = entry.transaction.categoryName || "OUTROS";
      categoryTotals[catName] = (categoryTotals[catName] || 0) + entry.amount;
      totalExpenses += entry.amount;
    } else {
      totalIncome += entry.amount;
    }
  });

  const categoryData = Object.entries(categoryTotals).map(([name, total]) => ({
    name,
    value: total,
    percent: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
  })).sort((a, b) => b.value - a.value);

  // Média de gastos
  const totalMonths = Math.max(Object.keys(monthlyFlow).length, 1);
  const totalAllTimeExpenses = activeEntries
    .filter(e => e.type === "DEBIT")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const averageMonthlyExpense = totalAllTimeExpenses / totalMonths;

  return (
    <ReportsView
      cashFlowData={cashFlowData}
      categoryData={categoryData}
      totalExpenses={totalExpenses}
      totalIncome={totalIncome}
      averageExpense={averageMonthlyExpense}
    />
  );
}
