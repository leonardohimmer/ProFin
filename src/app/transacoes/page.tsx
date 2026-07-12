import React from "react";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import TransactionsView from "@/components/TransactionsView";

export default async function TransacoesPage() {
  const headerList = await headers();
  const userId = headerList.get("x-user-id") || "test-user-id";

  // Busca todas as ledger entries do usuário
  const entries = await prisma.ledgerEntry.findMany({
    where: { account: { userId: userId } },
    include: {
      transaction: true,
      account: true
    },
    orderBy: { createdAt: "desc" }
  });

  // Calcula o saldo total das contas do banco
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

  // Calcula receitas e despesas do mês atual
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
    <TransactionsView
      entries={formattedEntries}
      totalBankBalance={totalBankBalance}
      monthlyIncome={monthlyIncome}
      monthlyExpenses={monthlyExpenses}
    />
  );
}
