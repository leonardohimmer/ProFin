import React from "react";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import NewTransactionView from "@/components/NewTransactionView";

export default async function NovaTransacaoPage() {
  const headerList = await headers();
  const userId = headerList.get("x-user-id") || "test-user-id";

  // Busca as categorias, contas e cartões vinculadas ao usuário
  const categories = await prisma.category.findMany({
    where: { userId: userId },
    orderBy: { name: "asc" }
  });

  const accounts = await prisma.account.findMany({
    where: { userId: userId },
    orderBy: { name: "asc" }
  });

  const cards = await prisma.card.findMany({
    where: { userId: userId },
    orderBy: { name: "asc" }
  });

  const formattedCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    type: cat.type
  }));

  const formattedAccounts = accounts.map(acc => ({
    id: acc.id,
    name: acc.name
  }));

  const formattedCards = cards.map(c => ({
    id: c.id,
    name: c.name
  }));

  return (
    <NewTransactionView
      categories={formattedCategories}
      accounts={formattedAccounts}
      cards={formattedCards}
      defaultType="DEBIT"
    />
  );
}
