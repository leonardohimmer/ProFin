import React from "react";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import ImporterView from "@/components/ImporterView";

export default async function ImportarPage() {
  const headerList = await headers();
  const userId = headerList.get("x-user-id") || "test-user-id";

  const categories = await prisma.category.findMany({
    where: { userId: userId },
    orderBy: { name: "asc" }
  });

  const accounts = await prisma.account.findMany({
    where: { userId: userId },
    orderBy: { name: "asc" }
  });

  const formattedCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name
  }));

  const formattedAccounts = accounts.map(acc => ({
    id: acc.id,
    name: acc.name
  }));

  return (
    <ImporterView categories={formattedCategories} accounts={formattedAccounts} />
  );
}
