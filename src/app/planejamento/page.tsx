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

  const formattedBudgets = budgets.map(b => ({
    id: b.id,
    categoryName: b.categoryName,
    targetAmount: b.targetAmount,
    spentAmount: b.spentAmount
  }));

  return (
    <PlanningView budgets={formattedBudgets} />
  );
}
