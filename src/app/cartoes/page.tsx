import React from "react";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import CardsView from "@/components/CardsView";

export default async function CartoesPage() {
  const headerList = await headers();
  const userId = headerList.get("x-user-id") || "test-user-id";

  // Busca todos os cartões cadastrados para este usuário
  const cards = await prisma.card.findMany({
    where: { userId: userId },
    orderBy: { name: "asc" }
  });

  // Busca transações recentes vinculadas a estes cartões
  // Filtramos por métodos de pagamento contendo o nome do cartão ou associado à conta SX
  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { paymentMethod: "Premium Visa" },
        { paymentMethod: "Business Elite" }
      ]
    },
    include: { entries: true },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  const formattedCards = cards.map(c => ({
    id: c.id,
    name: c.name,
    cardNumber: c.cardNumber,
    expirationDate: c.expirationDate,
    holderName: c.holderName,
    limit: c.limit,
    currentInvoice: c.currentInvoice,
    dueDate: c.dueDate
  }));

  const formattedTransactions = transactions.map(t => ({
    id: t.id,
    description: t.description,
    categoryName: t.categoryName,
    paymentMethod: t.paymentMethod,
    amount: t.entries[0]?.amount || 0, // Pega o valor do primeiro entry (normalmente é DEBIT)
    createdAt: t.createdAt.toISOString()
  }));

  return (
    <CardsView
      cards={formattedCards}
      transactions={formattedTransactions}
    />
  );
}
