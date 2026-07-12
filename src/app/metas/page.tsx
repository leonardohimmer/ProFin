import React from "react";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import GoalsView from "@/components/GoalsView";

export default async function MetasPage() {
  const headerList = await headers();
  const userId = headerList.get("x-user-id") || "test-user-id";

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  const accounts = await prisma.account.findMany({
    where: { userId },
    orderBy: { name: "asc" }
  });

  // Calcula saldos de cada conta
  const accountsData = await Promise.all(accounts.map(async (acc) => {
    const entries = await prisma.ledgerEntry.findMany({
      where: { accountId: acc.id }
    });
    
    let balance = 0;
    entries.forEach(entry => {
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
  }));

  const formattedGoals = goals.map(g => ({
    id: g.id,
    name: g.name,
    targetAmount: g.targetAmount,
    currentAmount: g.currentAmount,
    deadline: g.deadline ? g.deadline.toISOString() : null
  }));

  const formattedAccounts = accountsData.map(acc => ({
    id: acc.id,
    name: acc.name,
    balance: acc.balance
  }));

  return (
    <GoalsView goals={formattedGoals} accounts={formattedAccounts} />
  );
}
