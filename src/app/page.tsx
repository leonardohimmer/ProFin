import React, { Suspense } from "react";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import DashboardView from "@/components/DashboardView";
import { ensureDatabaseInitialized } from "@/lib/db-init";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  await ensureDatabaseInitialized();

  try {
    const resolvedSearchParams = await searchParams;
    const now = new Date();
    const selectedMonth = resolvedSearchParams?.month !== undefined ? parseInt(resolvedSearchParams.month, 10) : now.getMonth();
    const selectedYear = resolvedSearchParams?.year !== undefined ? parseInt(resolvedSearchParams.year, 10) : now.getFullYear();

    const headerList = await headers();
    const userId = headerList.get("x-user-id") || "test-user-id";

    // Busca o usuário para exibir o nome correto
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const userName = user?.name || "Alexandre Silva";

    // Busca todas as contas do usuário com suas respectivas ledger entries
    const accounts = await prisma.account.findMany({
      where: { userId: userId },
      include: {
        entries: {
          include: { transaction: true }
        }
      }
    });

    // Calcula o saldo de cada conta
    const accountsData = accounts.map(acc => {
      let balance = 0;
      acc.entries.forEach(entry => {
        if (entry.type === "CREDIT") {
          balance += entry.amount;
        } else {
          balance -= entry.amount;
        }
      });

      return {
        id: acc.id,
        name: acc.name,
        balance
      };
    });

    // Busca lançamentos do mês e ano selecionados
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
    const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);

    const monthEntries = await prisma.ledgerEntry.findMany({
      where: {
        account: { userId: userId },
        createdAt: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        }
      },
      include: { transaction: true }
    });

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    const expensesByCategory: Record<string, number> = {};

    monthEntries.forEach(entry => {
      // Ignora transações de ajuste inicial para coincidir com os valores zerados das imagens (R$ 0,00)
      if (entry.transaction.description.includes("Ajuste")) {
        return;
      }

      if (entry.type === "CREDIT") {
        monthlyIncome += entry.amount;
      } else {
        monthlyExpenses += entry.amount;
        const category = entry.transaction.categoryName || "OUTROS";
        expensesByCategory[category] = (expensesByCategory[category] || 0) + entry.amount;
      }
    });

    const expensesByCategoryArray = Object.entries(expensesByCategory).map(([name, amount]) => ({
      name,
      amount
    })).sort((a, b) => b.amount - a.amount);

    const budgetsData = await prisma.budget.findMany({
      where: { userId: userId }
    });

    const budgets = budgetsData.map(b => ({
      ...b,
      spentAmount: expensesByCategory[b.categoryName] || 0
    }));

    const cards = await prisma.card.findMany({
      where: { userId: userId }
    });

    const goals = await prisma.goal.findMany({
      where: { userId: userId }
    });

    const investments = await prisma.investment.findMany({
      where: { userId: userId }
    });

    return (
      <Suspense fallback={null}>
        <DashboardView
          userName={userName}
          accounts={accountsData}
          monthlyIncome={monthlyIncome}
          monthlyExpenses={monthlyExpenses}
          expensesByCategory={expensesByCategoryArray}
          budgets={budgets}
          cards={cards}
          goals={goals}
          investments={investments}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      </Suspense>
    );
  } catch (error) {
    console.error("Erro ao carregar HomePage:", error);
    return (
      <Suspense fallback={null}>
        <DashboardView
          userName="Alexandre Silva"
          accounts={[
            { id: "1", name: "Nubank Principal", balance: 0 },
            { id: "2", name: "Carteira / Dinheiro", balance: 0 }
          ]}
          monthlyIncome={0}
          monthlyExpenses={0}
          expensesByCategory={[]}
          budgets={[]}
          cards={[]}
          goals={[]}
          investments={[]}
          selectedMonth={new Date().getMonth()}
          selectedYear={new Date().getFullYear()}
        />
      </Suspense>
    );
  }
}
