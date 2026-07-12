import React from "react";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import InvestmentsView from "@/components/InvestmentsView";

export default async function InvestimentosPage() {
  const headerList = await headers();
  const userId = headerList.get("x-user-id") || "test-user-id";

  const investments = await prisma.investment.findMany({
    where: { userId },
    orderBy: { name: "asc" }
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

  const formattedInvestments = investments.map(inv => ({
    id: inv.id,
    name: inv.name,
    type: inv.type,
    purchaseValue: inv.purchaseValue,
    currentValue: inv.currentValue,
    quantity: inv.quantity
  }));

  const formattedAccounts = accountsData.map(acc => ({
    id: acc.id,
    name: acc.name,
    balance: acc.balance
  }));

  return (
    <InvestmentsView investments={formattedInvestments} accounts={formattedAccounts} />
  );
}
