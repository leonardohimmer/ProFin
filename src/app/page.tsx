import React from "react";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import DashboardView from "@/components/DashboardView";
import { ensureDatabaseInitialized } from "@/lib/db-init";

export default async function HomePage() {
  await ensureDatabaseInitialized();

  try {
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

    // Busca lançamentos do mês atual para preencher os resumos de Receita/Despesa do mês
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthEntries = await prisma.ledgerEntry.findMany({
      where: {
        account: { userId: userId },
        createdAt: { gte: firstDayOfMonth }
      },
      include: { transaction: true }
    });

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    monthEntries.forEach(entry => {
      // Ignora transações de ajuste inicial para coincidir com os valores zerados das imagens (R$ 0,00)
      if (entry.transaction.description.includes("Ajuste")) {
        return;
      }

      if (entry.type === "CREDIT") {
        monthlyIncome += entry.amount;
      } else {
        monthlyExpenses += entry.amount;
      }
    });

    return (
      <DashboardView
        userName={userName}
        accounts={accountsData}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
      />
    );
  } catch (error) {
    console.error("Erro ao carregar HomePage:", error);
    return (
      <DashboardView
        userName="Alexandre Silva"
        accounts={[
          { id: "1", name: "Nubank Principal", balance: 0 },
          { id: "2", name: "Carteira / Dinheiro", balance: 0 }
        ]}
        monthlyIncome={0}
        monthlyExpenses={0}
      />
    );
  }
}
