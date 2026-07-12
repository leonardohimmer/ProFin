import React from "react";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import CategoriesView from "@/components/CategoriesView";

export default async function CategoriasPage() {
  const headerList = await headers();
  const userId = headerList.get("x-user-id") || "test-user-id";

  // Busca todas as categorias vinculadas ao usuário
  const categories = await prisma.category.findMany({
    where: { userId: userId },
    include: {
      transactions: {
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }
    },
    orderBy: { name: "asc" }
  });

  const formattedCategories = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    transactionsCount: cat.transactions.length
  }));

  return (
    <CategoriesView categories={formattedCategories} />
  );
}
