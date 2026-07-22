import React from "react";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import PlanningView from "@/components/PlanningView";

export default async function PlanejamentoPage() {
  const headerList = await headers();
  const userId = headerList.get("x-user-id") || "test-user-id";

  // Busca todos os planejamentos/orçamentos de metas cadastrados
  const budgets = await prisma.budget.findMany({
    where: { userId: userId },
    orderBy: { categoryName: "asc" }
  });

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthEntries = await prisma.ledgerEntry.findMany({
    where: {
      account: { userId: userId },
      createdAt: { gte: firstDayOfMonth },
      type: "DEBIT"
    },
    include: { transaction: true }
  });

  const spentByCategory: Record<string, number> = {};
  monthEntries.forEach(entry => {
    if (entry.transaction.description.includes("Ajuste")) return;
    const cat = entry.transaction.categoryName || "OUTROS";
    spentByCategory[cat] = (spentByCategory[cat] || 0) + entry.amount;
  });

  const formattedBudgets = budgets.map(b => ({
    id: b.id,
    categoryName: b.categoryName,
    targetAmount: b.targetAmount,
    spentAmount: spentByCategory[b.categoryName] || 0
  }));

  return (
    <PlanningView budgets={formattedBudgets} />
  );
}
