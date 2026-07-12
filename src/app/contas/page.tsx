import React from "react";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import AccountsView from "@/components/AccountsView";
import { ensureDatabaseInitialized } from "@/lib/db-init";

export const dynamic = "force-dynamic";

export default async function ContasPage() {
  await ensureDatabaseInitialized();

  const headerList = await headers();
  const userId = headerList.get("x-user-id") || "test-user-id";

  const accounts = await prisma.account.findMany({
    where: { userId },
    include: {
      entries: {
        include: { transaction: true }
      }
    },
    orderBy: { name: "asc" }
  });

  const formattedAccounts = accounts.map(acc => {
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
      balance,
      entriesCount: acc.entries.length,
      createdAt: acc.createdAt.toISOString()
    };
  });

  return <AccountsView accounts={formattedAccounts} />;
}
